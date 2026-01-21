import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";
import { logClinicianAction } from "../audit";
import { getAllPathwaysFromContentful, getPathwayByIdFromContentful, isContentfulConfigured, ContentfulError } from "../contentful";

const router = Router();

// Get all care pathways
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    // Try Contentful first
    if (isContentfulConfigured()) {
      try {
        const pathways = await getAllPathwaysFromContentful();
        res.json(pathways);
        return;
      } catch (error) {
        if (error instanceof ContentfulError) {
          console.warn("Contentful pathways fetch failed, falling back to database:", error.message);
        }
      }
    }
    
    const pathways = await storage.getCarePathways(req.user!.id);
    res.json(pathways);
  } catch (error) {
    next(error);
  }
});

// Get single pathway
router.get("/:id", requireSubscription, async (req, res, next) => {
  try {
    let pathway = null;
    
    if (isContentfulConfigured()) {
      try {
        pathway = await getPathwayByIdFromContentful(req.params.id);
      } catch (error) {
        if (error instanceof ContentfulError) {
          console.warn("Contentful pathway fetch failed, falling back to database:", error.message);
        }
      }
    }
    
    if (!pathway) {
      pathway = await storage.getCarePathwayById(req.params.id);
    }
    
    if (!pathway) {
      return res.status(404).send("Pathway not found");
    }
    
    // Get milestones
    const milestones = await storage.getPathwayMilestones(req.params.id);
    
    res.json({ ...pathway, milestones });
  } catch (error) {
    next(error);
  }
});

// Create pathway
router.post("/", requireSubscription, async (req, res, next) => {
  try {
    const { name, description, condition, durationWeeks, isTemplate } = req.body;
    const pathway = await storage.createCarePathway({
      clinicianUserId: req.user!.id,
      name,
      description,
      condition,
      durationWeeks,
      isTemplate: isTemplate || false,
      isActive: true,
    });
    
    await logClinicianAction(req, req.user!, 'content_create', {
      resourceType: 'content',
      resourceId: pathway.id,
      details: { type: 'care_pathway', name },
    });
    
    res.status(201).json(pathway);
  } catch (error) {
    next(error);
  }
});

// Update pathway
router.patch("/:id", requireSubscription, async (req, res, next) => {
  try {
    const pathway = await storage.updateCarePathway(req.params.id, req.body);
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
    await storage.deleteCarePathway(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Pathway Milestones ======

router.get("/:id/milestones", requireSubscription, async (req, res, next) => {
  try {
    const milestones = await storage.getPathwayMilestones(req.params.id);
    res.json(milestones);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/milestones", requireSubscription, async (req, res, next) => {
  try {
    const { weekNumber, title, description, contentIds, assessmentId } = req.body;
    const milestone = await storage.createPathwayMilestone({
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
    const milestone = await storage.updatePathwayMilestone(req.params.id, req.body);
    res.json(milestone);
  } catch (error) {
    next(error);
  }
});

router.delete("/:pathwayId/milestones/:id", requireSubscription, async (req, res, next) => {
  try {
    await storage.deletePathwayMilestone(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Patient Pathways ======

router.get("/patients/active", requireSubscription, async (req, res, next) => {
  try {
    const patientPathways = await storage.getPatientPathways(req.user!.id);
    res.json(patientPathways);
  } catch (error) {
    next(error);
  }
});

router.post("/patients", requireSubscription, async (req, res, next) => {
  try {
    const { pathwayId, patientEmail, patientName, startDate, notes } = req.body;
    const patientPathway = await storage.createPatientPathway({
      clinicianUserId: req.user!.id,
      pathwayId,
      patientEmail,
      patientName,
      startDate: new Date(startDate),
      notes,
      status: 'active',
      currentWeek: 1,
    });
    
    await logClinicianAction(req, req.user!, 'content_create', {
      resourceType: 'patient',
      resourceId: patientPathway.id,
      phiAccessed: true,
      phiScope: 'patient pathway enrollment',
      details: { patientEmail, pathwayId },
    });
    
    res.status(201).json(patientPathway);
  } catch (error) {
    next(error);
  }
});

router.patch("/patients/:id", requireSubscription, async (req, res, next) => {
  try {
    const patientPathway = await storage.updatePatientPathway(req.params.id, req.body);
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
    const rules = await storage.getFollowUpRulesByClinicianId(req.user!.id);
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

followUpRouter.post("/", requireSubscription, async (req, res, next) => {
  try {
    const { name, triggerType, triggerDays, action, contentIds, message, isTemplate } = req.body;
    const rule = await storage.createFollowUpRule({
      clinicianUserId: req.user!.id,
      name,
      triggerType,
      triggerDays,
      action,
      contentIds,
      message,
      isActive: true,
      isTemplate: isTemplate || false,
    });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

followUpRouter.patch("/:id", requireSubscription, async (req, res, next) => {
  try {
    const rule = await storage.updateFollowUpRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

followUpRouter.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await storage.deleteFollowUpRule(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { followUpRouter };
