/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import {
  createAppContextWithInfrastructure,
  createFollowUpRule,
  createPathway,
  createPathwayMilestone,
  createPatientPathway,
  deleteFollowUpRule,
  deletePathway,
  deletePathwayMilestone,
  getPathway,
  listFollowUpRules,
  listPathwayMilestones,
  listPathways,
  listPatientPathways,
  updateFollowUpRule,
  updatePathway,
  updatePathwayMilestone,
  updatePatientPathway,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Get all care pathways
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const pathways = await listPathways(appContext, { clinician: req.user! });
    res.json(pathways);
  } catch (error) {
    next(error);
  }
});

// Get single pathway
router.get("/:id", requireSubscription, async (req, res, next) => {
  try {
    const result = await getPathway(appContext, { pathwayId: req.params.id });
    if (!result) {
      return res.status(404).send("Pathway not found");
    }

    res.json({ ...result.pathway, milestones: result.milestones });
  } catch (error) {
    next(error);
  }
});

// Create pathway
router.post("/", requireSubscription, async (req, res, next) => {
  try {
    const { name, description, condition, durationWeeks, isTemplate } = req.body;
    const pathway = await createPathway(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data: {
        name,
        description,
        condition,
        durationWeeks,
        isTemplate,
      },
    });
    res.status(201).json(pathway);
  } catch (error) {
    next(error);
  }
});

// Update pathway
router.patch("/:id", requireSubscription, async (req, res, next) => {
  try {
    const pathway = await updatePathway(appContext, {
      pathwayId: req.params.id,
      updates: req.body,
    });
    if (!pathway) {
      return res.status(404).send("Pathway not found");
    }
    res.json(pathway);
  } catch (error) {
    next(error);
  }
});

// Delete pathway
router.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await deletePathway(appContext, { pathwayId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Pathway Milestones ======

router.get("/:id/milestones", requireSubscription, async (req, res, next) => {
  try {
    const milestones = await listPathwayMilestones(appContext, { pathwayId: req.params.id });
    res.json(milestones);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/milestones", requireSubscription, async (req, res, next) => {
  try {
    const { weekNumber, title, description, contentIds, assessmentId } = req.body;
    const milestone = await createPathwayMilestone(appContext, {
      pathwayId: req.params.id,
      weekNumber,
      title,
      description,
      contentIds,
      assessmentId,
    });
    res.status(201).json(milestone);
  } catch (error) {
    next(error);
  }
});

router.patch("/:pathwayId/milestones/:id", requireSubscription, async (req, res, next) => {
  try {
    const milestone = await updatePathwayMilestone(appContext, {
      milestoneId: req.params.id,
      updates: req.body,
    });
    res.json(milestone);
  } catch (error) {
    next(error);
  }
});

router.delete("/:pathwayId/milestones/:id", requireSubscription, async (req, res, next) => {
  try {
    await deletePathwayMilestone(appContext, { milestoneId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Patient Pathways ======

router.get("/patients/active", requireSubscription, async (req, res, next) => {
  try {
    const patientPathways = await listPatientPathways(appContext, { clinician: req.user! });
    res.json(patientPathways);
  } catch (error) {
    next(error);
  }
});

router.post("/patients", requireSubscription, async (req, res, next) => {
  try {
    const { pathwayId, patientEmail, patientName, startDate, notes } = req.body;
    const patientPathway = await createPatientPathway(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data: {
        pathwayId,
        patientEmail,
        patientName,
        startDate: new Date(startDate),
        notes,
      },
    });

    res.status(201).json(patientPathway);
  } catch (error) {
    next(error);
  }
});

router.patch("/patients/:id", requireSubscription, async (req, res, next) => {
  try {
    const patientPathway = await updatePatientPathway(appContext, {
      patientPathwayId: req.params.id,
      updates: req.body,
    });
    res.json(patientPathway);
  } catch (error) {
    next(error);
  }
});

export { router as pathwaysRouter };

// Follow-up Rules Router
const followUpRouter = Router();

followUpRouter.get("/", requireSubscription, async (req, res, next) => {
  try {
    const rules = await listFollowUpRules(appContext, { clinician: req.user! });
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

followUpRouter.post("/", requireSubscription, async (req, res, next) => {
  try {
    const { name, triggerType, triggerDays, action, contentIds, message, isTemplate } = req.body;
    const rule = await createFollowUpRule(appContext, {
      clinician: req.user!,
      data: {
        name,
        triggerType,
        triggerDays,
        action,
        contentIds,
        message,
        isTemplate,
      },
    });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

followUpRouter.patch("/:id", requireSubscription, async (req, res, next) => {
  try {
    const rule = await updateFollowUpRule(appContext, {
      ruleId: req.params.id,
      updates: req.body,
    });
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

followUpRouter.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await deleteFollowUpRule(appContext, { ruleId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { followUpRouter };
