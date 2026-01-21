import { Router } from "express";
import { requireAuth, requireSubscription } from "../auth";
import { storage } from "../storage";
import { insertEmailLogSchema } from "@shared/schema";
import { logClinicianAction, logPatientAction } from "../audit";
import { sendContentEmail } from "../gmail";
import crypto from "crypto";
import { pbkdf2Sync, randomBytes } from "crypto";

function hashAccessCode(code: string, salt: string): string {
  return pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex');
}

function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createMessagingRouter(requireFeatureFlag: (key: string) => any) {
  const router = Router();

  // Send email with content
  router.post("/email-logs", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const { patientEmail, subject, contentIds, providerNote, type } = req.body;
      
      // Generate and hash access code
      const accessCode = generateAccessCode();
      const accessCodeSalt = randomBytes(16).toString('hex');
      const accessCodeHash = hashAccessCode(accessCode, accessCodeSalt);
      
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
      const contentItems = await storage.getContentByIds(contentIds);
      
      // Send the email
      await sendContentEmail(
        patientEmail,
        subject,
        contentItems,
        providerNote,
        emailLog.id,
        accessCode
      );
      
      await logClinicianAction(req, req.user!, 'email_send', {
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
      const logs = await storage.getEmailLogs(req.user!.id);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Get content views for email log
  router.get("/email-logs/:id/content-views", requireSubscription, requireFeatureFlag('send_history_enabled'), async (req, res, next) => {
    try {
      const views = await storage.getContentViewsByEmailLog(req.params.id);
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
      
      // Generate new access code
      const accessCode = generateAccessCode();
      const accessCodeSalt = randomBytes(16).toString('hex');
      const accessCodeHash = hashAccessCode(accessCode, accessCodeSalt);
      
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
      const contentItems = await storage.getContentByIds(originalLog.contentIds || []);
      await sendContentEmail(
        originalLog.patientEmail,
        `Re: ${originalLog.subject}`,
        contentItems,
        req.body.providerNote || originalLog.providerNote,
        newLog.id,
        accessCode
      );
      
      await logClinicianAction(req, req.user!, 'email_send', {
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
    const connection = await storage.getUserEmailConnection(user.id);
    
    res.json({
      emailDeliveryMode: user.emailDeliveryMode || 'central',
      connection: connection ? {
        email: connection.email,
        status: connection.status,
        lastError: connection.lastError,
      } : null,
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
    
    await storage.updateUser(req.user!.id, { emailDeliveryMode: mode });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

emailSettingsRouter.delete("/connection", requireAuth, async (req, res, next) => {
  try {
    await storage.deleteUserEmailConnection(req.user!.id);
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
    const emailLogs = await storage.getEmailLogsByPatient(req.user!.id, patientEmail);
    
    // Get all content views
    const contentViews = await storage.getContentViewsByPatient(patientEmail);
    
    // Get assessment results
    const assessmentResults = await storage.getAssessmentResultsByPatient(patientEmail);
    
    await logClinicianAction(req, req.user!, 'patient_summary_access', {
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
