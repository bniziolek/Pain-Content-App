/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import {
  createAppContextWithInfrastructure,
  createRecommendationConfig,
  createRecommendationRule,
  deleteRecommendationConfig,
  deleteRecommendationRule,
  generateRecommendations,
  getPatientRecommendation,
  listPatientRecommendations,
  listRecommendationConfigs,
  listRecommendationRules,
  previewRecommendations,
  updateRecommendationConfig,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// ====== Recommendation Rules Routes ======

// Get recommendation rules
router.get("/rules", requireSubscription, async (req, res, next) => {
  try {
    const rules = await listRecommendationRules(appContext, { clinician: req.user! });
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

// Create recommendation rule
router.post("/rules", requireSubscription, async (req, res, next) => {
  try {
    const { tag, minScore, maxScore, contentId, priority, rationale } = req.body;
    const rule = await createRecommendationRule(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data: {
        tag,
        minScore,
        maxScore,
        priority,
        contentId,
        rationale,
      },
    });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// Delete recommendation rule
router.delete("/rules/:id", requireSubscription, async (req, res, next) => {
  try {
    await deleteRecommendationRule(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      ruleId: req.params.id,
    });
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
    const recommendations = await generateRecommendations(appContext, {
      clinician: req.user!,
      tagScores,
      assessmentId,
      pathwayId,
      pathwayWeek,
    });
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// Preview recommendations
router.post("/preview", requireSubscription, async (req, res, next) => {
  try {
    const { tagScores, assessmentId, pathwayId, pathwayWeek } = req.body;
    const preview = await previewRecommendations(appContext, {
      clinician: req.user!,
      tagScores,
      assessmentId,
      pathwayId,
      pathwayWeek,
    });
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
    const configs = await listRecommendationConfigs(appContext, {
      clinician: req.user!,
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
    
    const config = await createRecommendationConfig(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data: {
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
      },
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
    const config = await updateRecommendationConfig(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      configId: req.params.id,
      updates: {
        name,
        tag,
        minScore,
        maxScore,
        priority,
        contentIds,
        rationale,
        isActive,
      },
    });
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Delete recommendation config
router.delete("/configs/:id", requireSubscription, async (req, res, next) => {
  try {
    await deleteRecommendationConfig(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      configId: req.params.id,
    });
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
      const recommendations = await listPatientRecommendations(appContext, {
        clinician: req.user!,
        patientEmail: patientEmail as string,
        status: status as string,
      });
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  });

  // Get single patient recommendation
  patientRouter.get("/:id", requireSubscription, requireFeatureFlag('patient_messaging_enabled'), async (req, res, next) => {
    try {
      const recommendation = await getPatientRecommendation(appContext, {
        recommendationId: req.params.id,
      });
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
