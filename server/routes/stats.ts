/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import { createAppContext, getDashboardStats } from "../application";

const router = Router();
const appContext = createAppContext();

// Get dashboard stats for clinician
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const stats = await getDashboardStats(appContext, { clinician: req.user! });
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export { router as statsRouter };
