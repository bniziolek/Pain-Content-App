import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";
import { logClinicianAction } from "../audit";

const router = Router();

// Get content recommendations (tag-based matching)
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const { tag, minScore, maxScore } = req.query;
    const recommendations = await storage.getContentRecommendations({
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
    const recommendation = await storage.createContentRecommendation({
      clinicianUserId: req.user!.id,
      tag,
      minScore,
      maxScore,
      contentId,
      priority,
      rationale,
    });
    
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'settings',
      details: { action: 'create_content_recommendation', tag, contentId },
    });
    
    res.status(201).json(recommendation);
  } catch (error) {
    next(error);
  }
});

// Delete content recommendation
router.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await storage.deleteContentRecommendation(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as contentRecommendationsRouter };
