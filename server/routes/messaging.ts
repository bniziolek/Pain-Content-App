/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth, requireSubscription } from "../auth";
import {
  createAppContextWithInfrastructure,
  deleteEmailConnection,
  getPatientSummary,
  listEmailLogContentViews,
  listEmailLogs,
  resendContentEmailFlow,
  sendContentEmailFlow,
  updateEmailDeliveryMode,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const appContext = createAppContextWithInfrastructure();

export function createMessagingRouter(requireFeatureFlag: (key: string) => any) {
  const router = Router();

  // Send email with content
  router.post("/email-logs", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const { patientEmail, subject, contentIds, providerNote, type } = req.body;

      const result = await sendContentEmailFlow(appContext, buildAuditRequestContext(req), {
        clinician: req.user!,
        patientEmail,
        subject,
        contentIds,
        providerNote,
        type,
      });

      res.status(201).json({ ...result.emailLog, accessCode: result.accessCode });
    } catch (error) {
      next(error);
    }
  });

  // Get email logs
  router.get("/email-logs", requireSubscription, requireFeatureFlag('send_history_enabled'), async (req, res, next) => {
    try {
      const logs = await listEmailLogs(appContext, { clinician: req.user! });
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Get content views for email log
  router.get("/email-logs/:id/content-views", requireSubscription, requireFeatureFlag('send_history_enabled'), async (req, res, next) => {
    try {
      const views = await listEmailLogContentViews(appContext, { emailLogId: req.params.id });
      res.json(views);
    } catch (error) {
      next(error);
    }
  });

  // Resend email
  router.post("/email-logs/:id/resend", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const result = await resendContentEmailFlow(appContext, buildAuditRequestContext(req), {
        clinician: req.user!,
        emailLogId: req.params.id,
        providerNote: req.body.providerNote,
      });

      res.status(201).json({ ...result.emailLog, accessCode: result.accessCode });
    } catch (error) {
      if (error instanceof Error && error.message === "Email log not found") {
        return res.status(404).send("Email log not found");
      }
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
    
    await updateEmailDeliveryMode(appContext, buildAuditRequestContext(req), {
      clinician: req.user!,
      mode,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

emailSettingsRouter.delete("/connection", requireAuth, async (req, res, next) => {
  try {
    await deleteEmailConnection(appContext, buildAuditRequestContext(req), { clinician: req.user! });
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

    const summary = await getPatientSummary(appContext, buildAuditRequestContext(req), {
      clinician: req.user!,
      patientEmail,
    });
    
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export { patientSummaryRouter };
