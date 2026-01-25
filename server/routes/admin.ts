/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAdmin } from "../auth";
import {
  createAdminNote,
  createAppContext,
  createTrialUser,
  createUser,
  deleteAdminNote,
  deleteUser,
  exportUserData,
  extendSubscription,
  getAdminStats,
  getEnhancedAdminStats,
  getHealthOverview,
  getUser,
  getUserSupportOverview,
  getUserSupportTimeline,
  listAdminNotes,
  listAllRecommendationConfigs,
  listLoginHistory,
  listUserContentActivity,
  listUserPermissions,
  listUsers,
  resetUserPassword,
  unlockUserAccount,
  updateUser,
  updateUserSubscription,
} from "../application";
import { toPublicUser, toPublicUsers } from "../serializers/user";

const router = Router();
const appContext = createAppContext();

// Create user
router.post("/users", requireAdmin, async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;
    const user = await createUser(appContext, {
      email,
      name,
      password,
      role,
    });
    res.status(201).json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
});

// Create trial user
router.post("/create-trial-user", requireAdmin, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const user = await createTrialUser(appContext, { email, name });
    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get("/users", requireAdmin, async (req, res, next) => {
  try {
    const users = await listUsers(appContext);
    res.json(toPublicUsers(users));
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const user = await getUser(appContext, { userId: req.params.id });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
});

// Update user
router.patch("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const { phone, clinicName, credentials, address } = req.body;
    const user = await updateUser(appContext, {
      userId: req.params.id,
      updates: { name, email, role, phone, clinicName, credentials, address },
    });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
});

// Update user subscription
router.patch("/users/:id/subscription", requireAdmin, async (req, res, next) => {
  try {
    const { subscriptionStatus, subscriptionTier, subscriptionPeriodEnd } = req.body;
    const user = await updateUserSubscription(appContext, {
      userId: req.params.id,
      updates: {
        subscriptionStatus,
        subscriptionTier,
        subscriptionPeriodEnd: subscriptionPeriodEnd ? new Date(subscriptionPeriodEnd) : undefined,
      },
    });
    res.json(user ? toPublicUser(user) : null);
  } catch (error) {
    next(error);
  }
});

// Extend subscription
router.post("/users/:id/extend-subscription", requireAdmin, async (req, res, next) => {
  try {
    const { months, days } = req.body;
    let daysToAdd: number;

    if (months) {
      // Determine the base date from which to extend: current subscription end if available, otherwise now.
      let baseDate = new Date();
      try {
        const existingUser = await getUser(appContext, { userId: req.params.id });
        if (existingUser?.subscriptionPeriodEnd) {
          baseDate = new Date(existingUser.subscriptionPeriodEnd);
        }
      } catch {
        // If fetching the user fails for any reason, fall back to using the current date as baseDate.
      }

      const targetDate = new Date(baseDate.getTime());
      targetDate.setMonth(targetDate.getMonth() + Number(months));

      if (days) {
        targetDate.setDate(targetDate.getDate() + Number(days));
      }

      const msPerDay = 24 * 60 * 60 * 1000;
      daysToAdd = Math.max(1, Math.round((targetDate.getTime() - baseDate.getTime()) / msPerDay));
    } else {
      daysToAdd = days || 30;
    }

    const user = await extendSubscription(appContext, {
      userId: req.params.id,
      days: daysToAdd,
    });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
});

// Reset user password
router.post("/users/:id/reset-password", requireAdmin, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    await resetUserPassword(appContext, { userId: req.params.id, newPassword });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    await deleteUser(appContext, { userId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get admin stats
router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const stats = await getAdminStats(appContext);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get enhanced stats
router.get("/enhanced-stats", requireAdmin, async (req, res, next) => {
  try {
    const stats = await getEnhancedAdminStats(appContext);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ====== Admin Notes Routes ======

router.get("/users/:userId/notes", requireAdmin, async (req, res, next) => {
  try {
    const notes = await listAdminNotes(appContext, { userId: req.params.userId });
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

router.post("/users/:userId/notes", requireAdmin, async (req, res, next) => {
  try {
    const { note } = req.body;
    const adminNote = await createAdminNote(appContext, {
      admin: req.user!,
      userId: req.params.userId,
      note,
    });
    res.status(201).json(adminNote);
  } catch (error) {
    next(error);
  }
});

router.delete("/notes/:id", requireAdmin, async (req, res, next) => {
  try {
    await deleteAdminNote(appContext, { noteId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Login History Routes ======

router.get("/users/:userId/login-history", requireAdmin, async (req, res, next) => {
  try {
    const history = await listLoginHistory(appContext, { userId: req.params.userId });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ====== User Content Activity ======

router.get("/users/:userId/content-activity", requireAdmin, async (req, res, next) => {
  try {
    const activity = await listUserContentActivity(appContext, { userId: req.params.userId });
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

// ====== User Data Export ======

router.get("/users/:userId/export", requireAdmin, async (req, res, next) => {
  try {
    const exportData = await exportUserData(appContext, { userId: req.params.userId });
    if (!exportData) {
      return res.status(404).send("User not found");
    }
    res.json({
      user: toPublicUser(exportData.user),
      notes: exportData.notes,
      loginHistory: exportData.loginHistory,
      contentActivity: exportData.contentActivity,
      exportedAt: exportData.exportedAt,
    });
  } catch (error) {
    next(error);
  }
});

// ====== Content Recommendations Admin ======

router.get("/recommendation-configs", requireAdmin, async (req, res, next) => {
  try {
    const configs = await listAllRecommendationConfigs(appContext);
    res.json(configs);
  } catch (error) {
    next(error);
  }
});

<<<<<<< HEAD
// ====== System Health ======

router.get("/health/overview", requireAdmin, async (req, res, next) => {
  try {
    const health = await getHealthOverview(appContext);
    res.json(health);
=======
// ====== User Support Dashboard ======

router.get("/users/:userId/support-overview", requireAdmin, async (req, res, next) => {
  try {
    const overview = await getUserSupportOverview(appContext, { userId: req.params.userId });
    if (!overview) {
      return res.status(404).send("User not found");
    }
    res.json({
      ...overview,
      user: toPublicUser(overview.user),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:userId/support-timeline", requireAdmin, async (req, res, next) => {
  try {
    const daysParam = req.query.days ? parseInt(req.query.days as string) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
      return res.status(400).json({ 
        error: "Invalid days parameter. Must be a positive integer between 1 and 365." 
      });
    }
    
    const timeline = await getUserSupportTimeline(appContext, { 
      userId: req.params.userId,
      days: daysParam,
    });
    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

router.post("/users/:userId/unlock", requireAdmin, async (req, res, next) => {
  try {
    const result = await unlockUserAccount(appContext, {
      userId: req.params.userId,
      adminId: req.user!.id,
    });
    if (!result) {
      return res.status(404).send("User not found");
    }
    res.json({
      success: true,
      user: toPublicUser(result.user),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:userId/permissions", requireAdmin, async (req, res, next) => {
  try {
    const permissions = await listUserPermissions(appContext, { userId: req.params.userId });
    res.json(permissions);
  } catch (error) {
    next(error);
  }
});

router.get("/users/:userId/feature-flags", requireAdmin, async (req, res, next) => {
  try {
    const user = await appContext.storage.getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const allFlags = await appContext.storage.getFeatureFlags();
    const userOverrides = await appContext.storage.getUserFeatureOverrides(req.params.userId);
    const userTier = user.subscriptionTier || "basic";

    const overrideMap = new Map(userOverrides.map(o => [o.featureFlagId, o]));

    const userFlags = allFlags.map((flag) => {
      const override = overrideMap.get(flag.id);
      const tierAllowed = !flag.tiersAllowed || flag.tiersAllowed.length === 0 || flag.tiersAllowed.includes(userTier);
      const defaultEnabled = flag.isEnabled && tierAllowed;
      const enabled = override ? override.isEnabled : defaultEnabled;
      
      return {
        id: flag.id,
        name: flag.name,
        key: flag.key,
        enabled,
        defaultEnabled,
        hasOverride: !!override,
        description: flag.description,
        category: flag.category,
      };
    });

    res.json(userFlags);
  } catch (error) {
    next(error);
  }
});

router.post("/users/:userId/feature-flags/:flagId/toggle", requireAdmin, async (req, res, next) => {
  try {
    const { enabled, reason } = req.body;
    const adminId = req.user?.id;
    const { userId, flagId } = req.params;
    
    // Get existing override to record previous value
    const existingOverrides = await appContext.storage.getUserFeatureOverrides(userId);
    const existingOverride = existingOverrides.find(o => o.featureFlagId === flagId);
    const previousValue = existingOverride?.isEnabled ?? null;
    
    await appContext.storage.setUserFeatureOverride(
      userId,
      flagId,
      enabled,
      adminId,
      reason || `Set by admin`
    );
    
    // Log the change to audit trail
    if (adminId) {
      await appContext.storage.createFeatureFlagAuditLog({
        userId,
        featureFlagId: flagId,
        adminId,
        action: enabled ? 'enable' : 'disable',
        previousValue,
        newValue: enabled,
        reason: reason || null,
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:userId/feature-flags/:flagId/override", requireAdmin, async (req, res, next) => {
  try {
    const adminId = req.user?.id;
    const { userId, flagId } = req.params;
    
    // Get existing override to record previous value
    const existingOverrides = await appContext.storage.getUserFeatureOverrides(userId);
    const existingOverride = existingOverrides.find(o => o.featureFlagId === flagId);
    const previousValue = existingOverride?.isEnabled ?? null;
    
    await appContext.storage.deleteUserFeatureOverride(userId, flagId);
    
    // Log the reset to audit trail
    if (adminId && previousValue !== null) {
      await appContext.storage.createFeatureFlagAuditLog({
        userId,
        featureFlagId: flagId,
        adminId,
        action: 'reset',
        previousValue,
        newValue: null,
        reason: 'Reset to default',
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get feature flag audit log for a user
router.get("/users/:userId/feature-flags/audit", requireAdmin, async (req, res, next) => {
  try {
    const auditLog = await appContext.storage.getFeatureFlagAuditLog(req.params.userId);
    res.json(auditLog);
>>>>>>> replit/issue-38
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };
