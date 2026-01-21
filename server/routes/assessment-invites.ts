import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";
import { insertAssessmentInviteSchema } from "@shared/schema";
import { logClinicianAction } from "../audit";
import { sendAssessmentInviteEmail } from "../gmail";
import { scoreAssessmentResponse } from "../scoring";
import { getRecommendationsWithFallback } from "../recommendation";
import crypto from "crypto";

export function createAssessmentInvitesRouter(requireFeatureFlag: (key: string) => any) {
  const router = Router();

  // Create assessment invite
  router.post("/", requireSubscription, requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const data = insertAssessmentInviteSchema.parse({
        ...req.body,
        clinicianUserId: req.user!.id,
        token,
      });
      
      const invite = await storage.createAssessmentInvite(data);
      const assessment = await storage.getAssessmentById(invite.assessmentId);
      
      // Send email to patient
      await sendAssessmentInviteEmail(
        invite.patientEmail,
        invite.token,
        assessment?.name || "Assessment"
      );
      
      await logClinicianAction(req, req.user!, 'assessment_create', {
        resourceType: 'assessment',
        resourceId: invite.id,
        phiAccessed: true,
        phiScope: 'patient email, assessment invite',
        details: { patientEmail: invite.patientEmail },
      });
      
      res.status(201).json(invite);
    } catch (error) {
      next(error);
    }
  });

  // Get all invites for clinician
  router.get("/", requireSubscription, requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const invites = await storage.getAssessmentInvites(req.user!.id);
      
      await logClinicianAction(req, req.user!, 'assessment_access', {
        resourceType: 'assessment',
        phiAccessed: true,
        phiScope: 'patient emails in assessment list',
        details: { count: invites.length },
      });
      
      res.json(invites);
    } catch (error) {
      next(error);
    }
  });

  // Get invite by token (public - for patients)
  router.get("/token/:token", requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const invite = await storage.getAssessmentInviteByToken(req.params.token);
      if (!invite) {
        return res.status(404).send("Invite not found");
      }
      const assessment = await storage.getAssessmentById(invite.assessmentId);
      res.json({ invite, assessment });
    } catch (error) {
      next(error);
    }
  });

  // Complete assessment invite (public - for patients)
  router.post("/:inviteId/complete", requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const { answers } = req.body;
      const invite = await storage.getAssessmentInviteById(req.params.inviteId);
      
      if (!invite) {
        return res.status(404).send("Invite not found");
      }
      
      const assessment = await storage.getAssessmentById(invite.assessmentId);
      if (!assessment) {
        return res.status(404).send("Assessment not found");
      }
      
      // Score the response
      const result = scoreAssessmentResponse(assessment, answers);
      
      // Update the invite with responses
      await storage.completeAssessmentInvite(req.params.inviteId, {
        answers,
        tagScores: result.tagScores,
        primaryOutcome: result.primaryOutcome,
      });
      
      res.json({ success: true, result });
    } catch (error) {
      next(error);
    }
  });

  // Get assessment results with recommendations
  router.get("/:inviteId/results", requireSubscription, requireFeatureFlag('patient_assessments_enabled'), async (req, res, next) => {
    try {
      const invite = await storage.getAssessmentInviteById(req.params.inviteId);
      if (!invite) {
        return res.status(404).send("Invite not found");
      }
      
      await logClinicianAction(req, req.user!, 'assessment_access', {
        resourceType: 'assessment',
        resourceId: invite.id,
        phiAccessed: true,
        phiScope: 'assessment results',
        details: { inviteId: invite.id },
      });
      
      // Get assessment for context
      const assessment = await storage.getAssessmentById(invite.assessmentId);
      
      // Get recommendations if assessment is complete
      let recommendations: any[] = [];
      if (invite.status === 'completed' && invite.tagScores) {
        recommendations = await getRecommendationsWithFallback(
          invite.tagScores as any[],
          invite.assessmentId,
          null,
          null
        );
      }
      
      res.json({
        invite,
        assessment,
        recommendations,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
