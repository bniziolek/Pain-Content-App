/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 * Branding routes for managing clinic branding settings (Pro/Enterprise feature).
 */

import { Router } from "express";
import { requireAuth, requireTier } from "../auth";
import {
  getClinicBranding,
  saveClinicBrandingWithAudit,
  deleteClinicBrandingWithAudit,
  createAppContext,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";
import { brandingRequestSchema } from "@shared/schema";

const requireProOrEnterprise = requireTier(['pro', 'enterprise']);

const router = Router();

router.get("/", requireAuth, requireProOrEnterprise, async (req, res, next) => {
  try {
    const appContext = createAppContext();
    const branding = await getClinicBranding(appContext, { clinician: req.user! });
    res.json(branding || null);
  } catch (error) {
    next(error);
  }
});

router.put("/", requireAuth, requireProOrEnterprise, async (req, res, next) => {
  try {
    const parseResult = brandingRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid branding data", details: parseResult.error.issues });
    }

    const appContext = createAppContext();
    const auditContext = buildAuditRequestContext(req);
    const branding = await saveClinicBrandingWithAudit(appContext, auditContext, {
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
    const appContext = createAppContext();
    const auditContext = buildAuditRequestContext(req);
    await deleteClinicBrandingWithAudit(appContext, auditContext, { clinician: req.user! });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as brandingRouter };
