/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 * Branding routes for managing clinic branding settings (Pro/Enterprise feature).
 */

import { Router } from "express";
import { requireAuth, requireTier } from "../auth";
import {
  getClinicBranding,
  saveClinicBranding,
  deleteClinicBranding,
  createMinimalContext,
} from "../application";
import { insertClinicBrandingSchema } from "@shared/schema";

const requireProOrEnterprise = requireTier(['pro', 'enterprise']);

const router = Router();
const appContext = createMinimalContext();

router.get("/", requireAuth, requireProOrEnterprise, async (req, res, next) => {
  try {
    const branding = await getClinicBranding(appContext, { clinician: req.user! });
    res.json(branding || null);
  } catch (error) {
    next(error);
  }
});

router.put("/", requireAuth, requireProOrEnterprise, async (req, res, next) => {
  try {
    const parseResult = insertClinicBrandingSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid branding data", details: parseResult.error.issues });
    }

    const branding = await saveClinicBranding(appContext, {
      clinician: req.user!,
      branding: parseResult.data,
    });
    res.json(branding);
  } catch (error) {
    next(error);
  }
});

router.delete("/", requireAuth, requireProOrEnterprise, async (req, res, next) => {
  try {
    await deleteClinicBranding(appContext, { clinician: req.user! });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as brandingRouter };
