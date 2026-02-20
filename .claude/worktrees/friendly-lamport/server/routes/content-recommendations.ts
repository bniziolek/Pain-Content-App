/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import {
  createAppContextWithInfrastructure,
  createContentRecommendation,
  deleteContentRecommendation,
  listContentRecommendations,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Get content recommendations (tag-based matching)
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const { tag, minScore, maxScore } = req.query;
    const recommendations = await listContentRecommendations(appContext, {
      tag: tag as string,
      minScore: minScore ? parseInt(minScore as string) : undefined,
      maxScore: maxScore ? parseInt(maxScore as string) : undefined,
    });
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// Create content recommendation
router.post("/", requireSubscription, async (req, res, next) => {
  try {
    const { tag, minScore, maxScore, contentId, priority, rationale } = req.body;
    const recommendation = await createContentRecommendation(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data: {
        tag,
        minScore,
        maxScore,
        contentId,
        priority,
        rationale,
      },
    });
    res.status(201).json(recommendation);
  } catch (error) {
    next(error);
  }
});

// Delete content recommendation
router.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await deleteContentRecommendation(appContext, { recommendationId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as contentRecommendationsRouter };
