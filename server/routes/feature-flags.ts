import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { requireSuperAdmin } from "../rbac";
import { storage } from "../storage";
import { logClinicianAction } from "../audit";
import type { User } from "@shared/schema";

const router = Router();

// Get all feature flags (for current user based on tier)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const flags = await storage.getFeatureFlags();
    const user = req.user!;
    
    // Filter flags based on user tier
    const userTier = user.subscriptionTier || 'basic';
    const accessibleFlags = flags.filter(flag => {
      if (!flag.tiersAllowed || flag.tiersAllowed.length === 0) return true;
      return flag.tiersAllowed.includes(userTier);
    });
    
    res.json(accessibleFlags.reduce((acc, flag) => {
      acc[flag.key] = {
        isEnabled: flag.isEnabled,
        value: flag.value,
      };
      return acc;
    }, {} as Record<string, { isEnabled: boolean; value: string | null }>));
  } catch (error) {
    next(error);
  }
});

// ====== Admin Feature Flags Routes ======

router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const flags = await storage.getFeatureFlags();
    res.json(flags);
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/:key", requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { isEnabled, value, payload, name, description, category } = req.body;
    
    const currentFlag = await storage.getFeatureFlagByKey(key);
    
    const updated = await storage.updateFeatureFlag(key, { isEnabled, value, payload, name, description, category });
    
    if (!updated) {
      return res.status(404).json({ error: "Feature flag not found" });
    }
    
    await logClinicianAction(req, req.user!, 'settings_change', {
      resourceType: 'feature_flag',
      resourceId: key,
      details: { 
        action: 'updated_feature_flag', 
        flagKey: key,
        previousValue: currentFlag?.value,
        newValue: value !== undefined ? value : currentFlag?.value,
        previousEnabled: currentFlag?.isEnabled,
        isEnabled: isEnabled !== undefined ? isEnabled : currentFlag?.isEnabled,
        changedFields: Object.keys(req.body),
      },
    });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get feature flag history
router.get("/admin/history/all", requireAdmin, async (req, res, next) => {
  try {
    const history = await storage.getFeatureFlagHistory();
    res.json(history);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/:key/history", requireAdmin, async (req, res, next) => {
  try {
    const history = await storage.getFeatureFlagHistoryByKey(req.params.key);
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

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const switchLog = await storage.switchPersona(user.id, toPersona, ipAddress, userAgent);

    await logClinicianAction(req, user, 'settings_change', {
      resourceType: 'user',
      resourceId: user.id,
      details: { action: 'persona_switch', toPersona },
      outcome: 'success'
    });

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
    await storage.clearPersona(user.id);

    await logClinicianAction(req, user, 'settings_change', {
      resourceType: 'user',
      resourceId: user.id,
      details: { action: 'persona_clear' },
      outcome: 'success'
    });

    res.json({ message: "Persona cleared, back to super admin view" });
  } catch (error) {
    next(error);
  }
});

router.get("/super-admin/persona-history", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const user = req.user as User;
    const history = await storage.getPersonaSwitchHistory(user.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Permission management
router.get("/super-admin/users/:userId/permissions", requireAuth, requireSuperAdmin(), async (req, res, next) => {
  try {
    const permissions = await storage.getUserPermissions(req.params.userId);
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

    const grant = await storage.grantUserPermission(
      userId, 
      permissionName, 
      user.id, 
      reason,
      expiresAt ? new Date(expiresAt) : undefined
    );

    await logClinicianAction(req, user, 'settings_change', {
      resourceType: 'user',
      resourceId: userId,
      details: { action: 'permission_grant', permissionName, targetUserId: userId },
      outcome: 'success'
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

    const revoke = await storage.revokeUserPermission(userId, permissionName, user.id, reason);

    await logClinicianAction(req, user, 'settings_change', {
      resourceType: 'user',
      resourceId: userId,
      details: { action: 'permission_revoke', permissionName, targetUserId: userId },
      outcome: 'success'
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
    await storage.removeUserPermission(id);

    await logClinicianAction(req, user, 'settings_change', {
      resourceType: 'user',
      resourceId: userId,
      details: { action: 'permission_remove', permissionOverrideId: id, targetUserId: userId },
      outcome: 'success'
    });

    res.json({ message: "Permission override removed" });
  } catch (error) {
    next(error);
  }
});

export { router as featureFlagsRouter };
