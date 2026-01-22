/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth } from "../auth";
import { createAppContext, skipOnboarding, updateOnboarding } from "../application";

const router = Router();
const appContext = createAppContext();

// Update onboarding progress
router.patch("/", requireAuth, async (req, res, next) => {
  try {
    const { step, completed } = req.body;

    const status = await updateOnboarding(appContext, {
      user: req.user!,
      step,
      completed,
    });
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Skip onboarding
router.post("/skip", requireAuth, async (req, res, next) => {
  try {
    await skipOnboarding(appContext, { user: req.user! });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as onboardingRouter };
