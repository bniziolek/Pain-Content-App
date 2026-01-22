import { Router } from "express";
import { requireAuth, requireSubscription } from "../auth";
import { storage } from "../storage";
import { insertEmailLogSchema } from "@shared/schema";
import { logClinicianAction, logPatientAction } from "../audit";
import { sendContentEmail } from "../gmail";
import { createSecureAccessCode } from "../domain/messaging";

export function createMessagingRouter(requireFeatureFlag: (key: string) => any) {
  const router = Router();

  // Send email with content
  router.post("/email-logs", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const { patientEmail, subject, contentIds, providerNote, type } = req.body;
      
      // Generate secure access code
      const { accessCode, accessCodeHash, accessCodeSalt } = createSecureAccessCode();
      
      const data = insertEmailLogSchema.parse({
        clinicianUserId: req.user!.id,
        patientEmail,
        subject,
        contentIds,
        providerNote,
        type: type || 'content_bundle',
        accessCodeHash,
        accessCodeSalt,
        accessCodeGeneratedAt: new Date(),
      });
      
      const emailLog = await storage.createEmailLog(data);
      
      // Get content items for the email
      const contentItems = (await Promise.all(
        contentIds.map((id: string) => storage.getContentById(id))
      )).filter(Boolean);
      
      // Build view URLs for content items
      const contentItemsWithUrls = contentItems.map((item: any) => ({
        title: item.title,
        summary: item.summary || '',
        readTime: item.readTime,
        imageUrl: item.imageUrl,
        viewUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/view/${emailLog.id}?content=${item.id}`,
      }));
      
      // Send the email
      await sendContentEmail({
        toEmail: patientEmail,
        subject,
        contentItems: contentItemsWithUrls,
        providerNote,
      });
      
      await logClinicianAction(req, req.user!, 'email_sent', {
        resourceType: 'email_log',
        resourceId: emailLog.id,
        phiAccessed: true,
        phiScope: 'patient email, content bundle',
        details: { patientEmail, contentCount: contentIds.length },
      });
      
      res.status(201).json({ ...emailLog, accessCode });
    } catch (error) {
      next(error);
    }
  });

  // Get email logs
  router.get("/email-logs", requireSubscription, requireFeatureFlag('send_history_enabled'), async (req, res, next) => {
    try {
      const logs = await storage.getEmailLogsByClinicianId(req.user!.id);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Get content views for email log
  router.get("/email-logs/:id/content-views", requireSubscription, requireFeatureFlag('send_history_enabled'), async (req, res, next) => {
    try {
      const views = await storage.getContentViewsByEmailLogId(req.params.id);
      res.json(views);
    } catch (error) {
      next(error);
    }
  });

  // Resend email
  router.post("/email-logs/:id/resend", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const originalLog = await storage.getEmailLogById(req.params.id);
      if (!originalLog) {
        return res.status(404).send("Email log not found");
      }
      
      // Generate secure access code
      const { accessCode, accessCodeHash, accessCodeSalt } = createSecureAccessCode();
      
      // Create new email log
      const newLog = await storage.createEmailLog({
        clinicianUserId: req.user!.id,
        patientEmail: originalLog.patientEmail,
        subject: `Re: ${originalLog.subject}`,
        contentIds: originalLog.contentIds,
        providerNote: req.body.providerNote || originalLog.providerNote,
        type: 'content_bundle',
        accessCodeHash,
        accessCodeSalt,
        accessCodeGeneratedAt: new Date(),
        isFollowUp: true,
        parentEmailLogId: originalLog.id,
      });
      
      // Get content and resend
      const contentItems = await Promise.all(
        (originalLog.contentIds || []).map((id: string) => storage.getContentById(id))
      );
      const validContentItems = contentItems.filter(Boolean);
      
      const contentItemsWithUrls = validContentItems.map((item: any) => ({
        title: item.title,
        summary: item.summary || '',
        readTime: item.readTime,
        imageUrl: item.imageUrl,
        viewUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/view/${newLog.id}?content=${item.id}`,
      }));
      
      await sendContentEmail({
        toEmail: originalLog.patientEmail,
        subject: `Re: ${originalLog.subject}`,
        contentItems: contentItemsWithUrls,
        providerNote: req.body.providerNote || originalLog.providerNote,
      });
      
      await logClinicianAction(req, req.user!, 'email_sent', {
        resourceType: 'email_log',
        resourceId: newLog.id,
        phiAccessed: true,
        phiScope: 'patient email resend',
        details: { originalId: originalLog.id, patientEmail: originalLog.patientEmail },
      });
      
      res.status(201).json({ ...newLog, accessCode });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// Email Settings Router
const emailSettingsRouter = Router();

emailSettingsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    
    res.json({
      emailDeliveryMode: user.emailDeliveryMode || 'central',
      connection: null,
    });
  } catch (error) {
    next(error);
  }
});

emailSettingsRouter.patch("/mode", requireAuth, async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['central', 'personal'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    
    await storage.updateEmailDeliveryMode(req.user!.id, mode);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

emailSettingsRouter.delete("/connection", requireAuth, async (req, res, next) => {
  try {
    await storage.deleteEmailConnection(req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { emailSettingsRouter };

// Patient Summary Router
const patientSummaryRouter = Router();

patientSummaryRouter.get("/:email", requireSubscription, async (req, res, next) => {
  try {
    const patientEmail = decodeURIComponent(req.params.email);
    
    // Get all email logs for this patient
    const emailLogs = await storage.getEmailLogsByPatientEmail(req.user!.id, patientEmail);
    
    // Get content views from all email logs
    const contentViews: any[] = [];
    for (const log of emailLogs) {
      const views = await storage.getContentViewsByEmailLogId(log.id);
      contentViews.push(...views);
    }
    
    // Get assessment invites for this patient
    const assessmentResults = await storage.getAssessmentInvitesByPatientEmail(req.user!.id, patientEmail);
    
    await logClinicianAction(req, req.user!, 'patient_summary_view', {
      resourceType: 'patient',
      phiAccessed: true,
      phiScope: 'patient summary, email history, content views, assessments',
      details: { patientEmail },
    });
    
    res.json({
      patientEmail,
      emailLogs,
      contentViews,
      assessmentResults,
      summary: {
        totalEmails: emailLogs.length,
        totalViews: contentViews.length,
        lastContact: emailLogs[0]?.sentAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { patientSummaryRouter };
