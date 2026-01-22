import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";
import { logClinicianAction } from "../audit";
import { 
  getRecommendationsWithFallback, 
  createRecommendationRule, 
  getRecommendationRules, 
  deleteRecommendationRule,
  createRecommendationConfig,
  getRecommendationConfigs,
  updateRecommendationConfig,
  deleteRecommendationConfig,
  previewRecommendations,
  generateRecommendations,
  savePatientRecommendation
} from "../recommendation";

const router = Router();

// ====== Recommendation Rules Routes ======

// Get recommendation rules
router.get("/rules", requireSubscription, async (req, res, next) => {
  try {
    const rules = await getRecommendationRules(req.user!.id);
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

// Create recommendation rule
router.post("/rules", requireSubscription, async (req, res, next) => {
  try {
    const { tag, minScore, maxScore, contentId, priority, rationale } = req.body;
    const rule = await createRecommendationRule({
      clinicianUserId: req.user!.id,
      tag,
      minScore,
      maxScore,
      priority,
      contentId,
      rationale,
    });
    
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'settings',
      details: { action: 'create_recommendation_rule', ruleId: rule.id, tag },
    });
    
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// Delete recommendation rule
router.delete("/rules/:id", requireSubscription, async (req, res, next) => {
  try {
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'settings',
      details: { action: 'delete_recommendation_rule', ruleId: req.params.id },
    });
    
    await deleteRecommendationRule(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Recommendations (generate) ======

// Generate recommendations from tag scores
router.post("/", requireSubscription, async (req, res, next) => {
  try {
    const { tagScores, assessmentId, pathwayId, pathwayWeek } = req.body;
    const recommendations = await getRecommendationsWithFallback(
      tagScores,
      assessmentId,
      pathwayId,
      pathwayWeek
    );
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// Preview recommendations
router.post("/preview", requireSubscription, async (req, res, next) => {
  try {
    const { tagScores, assessmentId, pathwayId, pathwayWeek } = req.body;
    const preview = await previewRecommendations(tagScores, assessmentId, pathwayId, pathwayWeek);
    res.json(preview);
  } catch (error) {
    next(error);
  }
});

// ====== Recommendation Configs (Advanced Rules) ======

// Get recommendation configs
router.get("/configs", requireSubscription, async (req, res, next) => {
  try {
    const { assessmentId, pathwayId } = req.query;
    const configs = await getRecommendationConfigs({
      clinicianId: req.user!.id,
      assessmentId: assessmentId as string,
      pathwayId: pathwayId as string,
    });
    res.json(configs);
  } catch (error) {
    next(error);
  }
});

// Create recommendation config
router.post("/configs", requireSubscription, async (req, res, next) => {
  try {
    const { 
      name, assessmentId, pathwayId, pathwayWeek, tag, 
      minScore, maxScore, priority, contentIds, rationale,
      questionName, questionType, matchOperator, matchValues
    } = req.body;
    
    const config = await createRecommendationConfig({
      clinicianUserId: req.user!.id,
      name,
      assessmentId,
      pathwayId,
      pathwayWeek,
      tag: tag || '',
      minScore: minScore ?? 0,
      maxScore: maxScore ?? 100,
      priority: priority ?? 1,
      contentIds,
      rationale,
      questionName,
      questionType,
      matchOperator: matchOperator || 'equals',
      matchValues,
    });
    
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'settings',
      details: { action: 'create_recommendation_config', configId: config.id, name },
    });
    
    res.status(201).json(config);
  } catch (error) {
    next(error);
  }
});

// Update recommendation config
router.put("/configs/:id", requireSubscription, async (req, res, next) => {
  try {
    const { name, tag, minScore, maxScore, priority, contentIds, rationale, isActive } = req.body;
    const config = await updateRecommendationConfig(req.params.id, {
      name,
      tag,
      minScore,
      maxScore,
      priority,
      contentIds,
      rationale,
      isActive,
    });
    
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'settings',
      details: { action: 'update_recommendation_config', configId: req.params.id },
    });
    
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Delete recommendation config
router.delete("/configs/:id", requireSubscription, async (req, res, next) => {
  try {
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'settings',
      details: { action: 'delete_recommendation_config', configId: req.params.id },
    });
    
    await deleteRecommendationConfig(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as recommendationsRouter };

// Patient Recommendations Router (requires feature flag)
export function createPatientRecommendationsRouter(requireFeatureFlag: (key: string) => any) {
  const patientRouter = Router();

  // Get patient recommendations history
  patientRouter.get("/", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const { patientEmail, status } = req.query;
      const recommendations = await storage.getPatientRecommendations(
        req.user!.id,
        patientEmail as string,
        status as string
      );
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  });

  // Get single patient recommendation
  patientRouter.get("/:id", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const recommendation = await storage.getPatientRecommendationById(req.params.id);
      if (!recommendation) {
        return res.status(404).send("Recommendation not found");
      }
      res.json(recommendation);
    } catch (error) {
      next(error);
    }
  });

  return patientRouter;
}
