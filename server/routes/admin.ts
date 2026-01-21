import { Router } from "express";
import { requireAdmin, hashPassword } from "../auth";
import { storage } from "../storage";
import { toPublicUser, toPublicUsers } from "../serializers/user";
import { logClinicianAction } from "../audit";

const router = Router();

// Create user
router.post("/users", requireAdmin, async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;
    const hashedPassword = await hashPassword(password || "changeme123");
    
    const user = await storage.createUser({
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      role: role || "clinician",
      subscriptionStatus: "inactive",
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
    const normalizedEmail = email.toLowerCase();
    
    let user = await storage.getUserByEmail(normalizedEmail);
    
    if (user) {
      await storage.updateUserSubscription(user.id, {
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date("9999-12-31"),
      });
      const updatedUser = await storage.getUser(user.id);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to retrieve updated user" });
      }
      res.json(toPublicUser(updatedUser));
    } else {
      const hashedPassword = await hashPassword("changeme123");
      const newUser = await storage.createUser({
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        password: hashedPassword,
        role: "clinician",
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date("9999-12-31"),
      });
      res.json(toPublicUser(newUser));
    }
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get("/users", requireAdmin, async (req, res, next) => {
  try {
    const users = await storage.getAllUsers();
    res.json(toPublicUsers(users));
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const user = await storage.getUser(req.params.id);
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
    const user = await storage.updateUser(req.params.id, { name, email, role });
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
    await storage.updateUserSubscription(req.params.id, {
      subscriptionStatus,
      subscriptionTier,
      subscriptionPeriodEnd: subscriptionPeriodEnd ? new Date(subscriptionPeriodEnd) : undefined,
    });
    const user = await storage.getUser(req.params.id);
    res.json(user ? toPublicUser(user) : null);
  } catch (error) {
    next(error);
  }
});

// Extend subscription
router.post("/users/:id/extend-subscription", requireAdmin, async (req, res, next) => {
  try {
    const { days } = req.body;
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    const currentEnd = user.subscriptionPeriodEnd || new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + (days || 30));
    
    await storage.updateUserSubscription(req.params.id, {
      subscriptionStatus: "active",
      subscriptionPeriodEnd: newEnd,
    });
    
    const updatedUser = await storage.getUser(req.params.id);
    res.json(updatedUser ? toPublicUser(updatedUser) : null);
  } catch (error) {
    next(error);
  }
});

// Reset user password
router.post("/users/:id/reset-password", requireAdmin, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const hashedPassword = await hashPassword(newPassword || "changeme123");
    await storage.updateUserPassword(req.params.id, hashedPassword);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete("/users/:id", requireAdmin, async (req, res, next) => {
  try {
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get admin stats
router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get enhanced stats
router.get("/enhanced-stats", requireAdmin, async (req, res, next) => {
  try {
    const stats = await storage.getEnhancedAdminStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ====== Admin Notes Routes ======

router.get("/users/:userId/notes", requireAdmin, async (req, res, next) => {
  try {
    const notes = await storage.getAdminNotes(req.params.userId);
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

router.post("/users/:userId/notes", requireAdmin, async (req, res, next) => {
  try {
    const { note } = req.body;
    const adminNote = await storage.createAdminNote({
      userId: req.params.userId,
      adminUserId: req.user!.id,
      note,
    });
    res.status(201).json(adminNote);
  } catch (error) {
    next(error);
  }
});

router.delete("/notes/:id", requireAdmin, async (req, res, next) => {
  try {
    await storage.deleteAdminNote(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Login History Routes ======

router.get("/users/:userId/login-history", requireAdmin, async (req, res, next) => {
  try {
    const history = await storage.getLoginHistory(req.params.userId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ====== User Content Activity ======

router.get("/users/:userId/content-activity", requireAdmin, async (req, res, next) => {
  try {
    const activity = await storage.getUserContentActivity(req.params.userId);
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

// ====== User Data Export ======

router.get("/users/:userId/export", requireAdmin, async (req, res, next) => {
  try {
    const user = await storage.getUser(req.params.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    const notes = await storage.getAdminNotes(req.params.userId);
    const loginHistory = await storage.getLoginHistory(req.params.userId);
    const activity = await storage.getUserContentActivity(req.params.userId);
    
    res.json({
      user: toPublicUser(user),
      notes,
      loginHistory,
      contentActivity: activity,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ====== Content Recommendations Admin ======

router.get("/recommendation-configs", requireAdmin, async (req, res, next) => {
  try {
    const configs = await storage.getAllRecommendationConfigs();
    res.json(configs);
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };
