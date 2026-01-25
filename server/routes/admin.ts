/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAdmin } from "../auth";
import {
  applyCoupon,
  cancelUserSubscription,
  createAdminNote,
  createAppContext,
  createAppContextWithInfrastructure,
  createTrialUser,
  createUser,
  deleteAdminNote,
  deleteUser,
  exportUserData,
  extendSubscription,
  getAdminStats,
  getEnhancedAdminStats,
  getSubscriptionDetails,
  getUser,
  listAdminNotes,
  listAllRecommendationConfigs,
  listLoginHistory,
  listSubscriptions,
  listUserContentActivity,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserSubscription,
} from "../application";
import { toPublicUser, toPublicUsers } from "../serializers/user";

const router = Router();
const appContext = createAppContext();
const appContextWithInfrastructure = createAppContextWithInfrastructure();

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
    const user = await updateUser(appContext, {
      userId: req.params.id,
      updates: { name, email, role },
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
    const { days } = req.body;
    const user = await extendSubscription(appContext, {
      userId: req.params.id,
      days,
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

// ====== Subscription Management Admin ======

// List all subscriptions with filters
router.get("/subscriptions", requireAdmin, async (req, res, next) => {
  try {
    const { status, tier, startDate, endDate, searchQuery } = req.query;
    
    const subscriptions = await listSubscriptions(appContextWithInfrastructure, {
      status: status as any,
      tier: tier as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      searchQuery: searchQuery as string,
    });
    
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
});

// Get detailed subscription information
router.get("/subscriptions/:userId", requireAdmin, async (req, res, next) => {
  try {
    const details = await getSubscriptionDetails(appContextWithInfrastructure, {
      userId: req.params.userId,
    });
    
    if (!details) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(details);
  } catch (error) {
    next(error);
  }
});

// Apply coupon to subscription
router.post("/subscriptions/:userId/apply-coupon", requireAdmin, async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    
    if (!couponCode) {
      return res.status(400).json({ error: "Coupon code is required" });
    }
    
    const result = await applyCoupon(appContextWithInfrastructure, {
      userId: req.params.userId,
      couponCode,
    });
    
    // Return appropriate status code based on result
    if (!result.success) {
      const isNotFound = /not found/i.test(result.message);
      const statusCode = isNotFound ? 404 : 400;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Cancel user subscription (admin)
router.post("/subscriptions/:userId/cancel", requireAdmin, async (req, res, next) => {
  try {
    const { immediate } = req.body;
    
    const result = await cancelUserSubscription(appContextWithInfrastructure, {
      userId: req.params.userId,
      immediate: immediate === true,
    });
    
    // Return appropriate status code based on result
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };
