import { Router } from "express";
import { requireAuth } from "../auth";
import { storage } from "../storage";

const router = Router();

// Update onboarding progress
router.patch("/", requireAuth, async (req, res, next) => {
  try {
    const { step, completed } = req.body;
    
    const updates: any = {};
    if (step !== undefined) updates.onboardingStep = step;
    if (completed !== undefined) updates.onboardingCompleted = completed;
    
    await storage.updateUser(req.user!.id, updates);
    
    const user = await storage.getUser(req.user!.id);
    res.json({
      onboardingStep: user?.onboardingStep,
      onboardingCompleted: user?.onboardingCompleted,
    });
  } catch (error) {
    next(error);
  }
});

// Skip onboarding
router.post("/skip", requireAuth, async (req, res, next) => {
  try {
    await storage.updateUser(req.user!.id, {
      onboardingCompleted: true,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as onboardingRouter };
