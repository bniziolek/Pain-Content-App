/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { requireSuperAdmin } from "../rbac";
import type { User } from "@shared/schema";
import {
  clearPersona,
  createAppContextWithInfrastructure,
  grantUserPermission,
  listAccessibleFeatureFlags,
  listFeatureFlagHistory,
  listFeatureFlagHistoryByKey,
  listFeatureFlags,
  listPersonaHistory,
  listUserPermissions,
  removeUserPermission,
  revokeUserPermission,
  switchPersona,
  updateFeatureFlagAdmin,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Get all feature flags (for current user based on tier)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const flags = await listAccessibleFeatureFlags(appContext, { user: req.user! });
    res.json(flags);
  } catch (error) {
    next(error);
  }
});

// ====== Admin Feature Flags Routes ======

router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const flags = await listFeatureFlags(appContext);
    res.json(flags);
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/:key", requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { isEnabled, value, payload, name, description, category } = req.body;
    const updated = await updateFeatureFlagAdmin(appContext, buildAuditRequestContext(req), {
      admin: req.user!,
      key,
      updates: { isEnabled, value, payload, name, description, category },
    });
    if (!updated) {
      return res.status(404).json({ error: "Feature flag not found" });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get feature flag history
router.get("/admin/history/all", requireAdmin, async (req, res, next) => {
  try {
    const history = await listFeatureFlagHistory(appContext);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/:key/history", requireAdmin, async (req, res, next) => {
  try {
    const history = await listFeatureFlagHistoryByKey(appContext, { key: req.params.key });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ====== Super Admin Routes ======

router.post("/super-admin/switch-persona", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const { toPersona } = req.body;
    if (!['clinician', 'admin'].includes(toPersona)) {
      return res.status(400).json({ message: "Invalid persona" });
    }
    const switchLog = await switchPersona(appContext, buildAuditRequestContext(req), { admin: user, toPersona });
    res.json({ 
      message: `Switched to ${toPersona} persona`,
      activePersona: toPersona,
      switchLog
    });
  } catch (error) {
    next(error);
  }
});

router.post("/super-admin/clear-persona", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    await clearPersona(appContext, buildAuditRequestContext(req), { admin: user });
    res.json({ message: "Persona cleared, back to super admin view" });
  } catch (error) {
    next(error);
  }
});

router.get("/super-admin/persona-history", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const history = await listPersonaHistory(appContext, { admin: user });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Permission management
router.get("/super-admin/users/:userId/permissions", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const permissions = await listUserPermissions(appContext, { userId: req.params.userId });
    res.json(permissions);
  } catch (error) {
    next(error);
  }
});

router.post("/super-admin/users/:userId/permissions/grant", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const { userId } = req.params;
    const { permissionName, reason, expiresAt } = req.body;

    if (!permissionName) {
      return res.status(400).json({ message: "Permission name required" });
    }

    const grant = await grantUserPermission(appContext, buildAuditRequestContext(req), {
      admin: user,
      userId,
      permissionName,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    res.json(grant);
  } catch (error) {
    next(error);
  }
});

router.post("/super-admin/users/:userId/permissions/revoke", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const { userId } = req.params;
    const { permissionName, reason } = req.body;

    if (!permissionName) {
      return res.status(400).json({ message: "Permission name required" });
    }

    const revoke = await revokeUserPermission(appContext, buildAuditRequestContext(req), {
      admin: user,
      userId,
      permissionName,
      reason,
    });
    res.json(revoke);
  } catch (error) {
    next(error);
  }
});

router.delete("/super-admin/users/:userId/permissions/:id", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const { userId, id } = req.params;
    await removeUserPermission(appContext, buildAuditRequestContext(req), {
      admin: user,
      userId,
      permissionOverrideId: id,
    });
    res.json({ message: "Permission override removed" });
  } catch (error) {
    next(error);
  }
});

export { router as featureFlagsRouter };
