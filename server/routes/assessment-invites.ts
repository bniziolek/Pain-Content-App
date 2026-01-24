/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import {
  AppError,
  completeAssessmentInvite,
  createAppContextWithInfrastructure,
  createAssessmentInvite,
  getAssessmentInviteByToken,
  getAssessmentInviteResultsWithRecommendations,
  listAssessmentInvites,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

export function createAssessmentInvitesRouter(requireFeatureFlag: (key: string) => any) {
  const router = Router();
  const appContext = createAppContextWithInfrastructure();

  // Create assessment invite
  router.post("/", requireSubscription, requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const { assessmentId, patientEmail, patientName } = req.body;
      const result = await createAssessmentInvite(appContext, buildAuditRequestContext(req), {
        clinician: req.user!,
        assessmentId,
        patientEmail,
        patientName,
      });
      res.status(201).json(result.invite);
    } catch (error) {
      next(error);
    }
  });

  // Get all invites for clinician
  router.get("/", requireSubscription, requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const invites = await listAssessmentInvites(appContext, buildAuditRequestContext(req), { clinician: req.user! });
      res.json(invites);
    } catch (error) {
      next(error);
    }
  });

  // Get invite by token (public - for patients)
  router.get("/token/:token", requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const result = await getAssessmentInviteByToken(appContext, { token: req.params.token });
      if (!result) {
        return res.status(404).send("Invite not found");
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Complete assessment invite (public - for patients)
  router.post("/:inviteId/complete", requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const { answers } = req.body;
      const result = await completeAssessmentInvite(appContext, {
        auditContext: buildAuditRequestContext(req),
        inviteId: req.params.inviteId,
        answers,
      });

      res.json({ success: true, result: result.result });
    } catch (error) {
      if (error instanceof AppError) {
        if (typeof error.body === "string") {
          return res.status(error.status).send(error.body);
        }
        return res.status(error.status).json(error.body ?? { error: error.message });
      }
      next(error);
    }
  });

  // Get assessment results with recommendations
  router.get("/:inviteId/results", requireSubscription, requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const results = await getAssessmentInviteResultsWithRecommendations(appContext, {
        auditContext: buildAuditRequestContext(req),
        clinician: req.user!,
        inviteId: req.params.inviteId,
      });
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
