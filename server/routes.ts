import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireSubscription, requireAdmin, hashPassword } from "./auth";
import { storage } from "./storage";
import { 
  insertContentItemSchema, 
  insertAssessmentInviteSchema,
  insertInternalScreeningSchema,
  insertEmailLogSchema 
} from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // ====== Content Library Routes ======
  app.get("/api/content", requireSubscription, async (req, res, next) => {
    try {
      const content = await storage.getAllContent();
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/content/:id", requireSubscription, async (req, res, next) => {
    try {
      const content = await storage.getContentById(req.params.id);
      if (!content) {
        return res.status(404).send("Content not found");
      }
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/content", requireAuth, async (req, res, next) => {
    try {
      const validated = insertContentItemSchema.parse(req.body);
      const content = await storage.createContent(validated);
      res.status(201).json(content);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/content/:id", requireAuth, async (req, res, next) => {
    try {
      const content = await storage.updateContent(req.params.id, req.body);
      if (!content) {
        return res.status(404).send("Content not found");
      }
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/content/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteContent(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ====== Assessment Invite Routes (Patient-facing) ======
  app.post("/api/assessment-invites", requireSubscription, async (req, res, next) => {
    try {
      const validated = insertAssessmentInviteSchema.parse({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      
      // Get default assessment if not specified
      if (!validated.assessmentId) {
        const defaultAssessment = await storage.getDefaultAssessment();
        if (!defaultAssessment) {
          return res.status(400).send("No assessment configured");
        }
        validated.assessmentId = defaultAssessment.id;
      }

      const invite = await storage.createAssessmentInvite(validated);
      
      // TODO: Send email via Resend here
      // await sendAssessmentInvite(invite.patientEmail, invite.token);

      res.status(201).json(invite);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/assessment-invites", requireSubscription, async (req, res, next) => {
    try {
      const invites = await storage.getAssessmentInvitesByClinicianId(req.user!.id);
      res.json(invites);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/assessment-invites/token/:token", async (req, res, next) => {
    try {
      const invite = await storage.getAssessmentInviteByToken(req.params.token);
      if (!invite) {
        return res.status(404).send("Invite not found");
      }
      
      // Mark as opened if still in sent status
      if (invite.status === "sent") {
        await storage.updateAssessmentInviteStatus(invite.id, "opened");
      }
      
      res.json(invite);
    } catch (error) {
      next(error);
    }
  });

  // ====== Internal Screening Routes ======
  app.post("/api/internal-screenings", requireSubscription, async (req, res, next) => {
    try {
      const validated = insertInternalScreeningSchema.parse({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      
      // Get default assessment if not specified
      if (!validated.assessmentId) {
        const defaultAssessment = await storage.getDefaultAssessment();
        if (!defaultAssessment) {
          return res.status(400).send("No assessment configured");
        }
        validated.assessmentId = defaultAssessment.id;
      }

      const screening = await storage.createInternalScreening(validated);
      res.status(201).json(screening);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/internal-screenings", requireSubscription, async (req, res, next) => {
    try {
      const screenings = await storage.getInternalScreeningsByClinicianId(req.user!.id);
      res.json(screenings);
    } catch (error) {
      next(error);
    }
  });

  // ====== Email Log Routes ======
  app.post("/api/email-logs", requireSubscription, async (req, res, next) => {
    try {
      const validated = insertEmailLogSchema.parse({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      
      const log = await storage.createEmailLog(validated);
      
      // TODO: Actually send email via Resend here
      // await sendContentEmail(log);
      
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/email-logs", requireSubscription, async (req, res, next) => {
    try {
      const logs = await storage.getEmailLogsByClinicianId(req.user!.id);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // ====== Subscription Routes (Stripe integration will come later) ======
  app.post("/api/subscription/create", requireAuth, async (req, res, next) => {
    try {
      // TODO: Create Stripe checkout session
      // For now, simulate activation
      await storage.updateUserSubscription(req.user!.id, {
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/subscription/cancel", requireAuth, async (req, res, next) => {
    try {
      // TODO: Cancel via Stripe
      await storage.updateUserSubscription(req.user!.id, {
        subscriptionStatus: "canceled",
      });
      
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  // ====== Stats/Dashboard Routes ======
  app.get("/api/stats", requireSubscription, async (req, res, next) => {
    try {
      const emailLogs = await storage.getEmailLogsByClinicianId(req.user!.id);
      const invites = await storage.getAssessmentInvitesByClinicianId(req.user!.id);
      
      // Calculate stats
      const sendsThisWeek = emailLogs.filter(log => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return log.sentAt >= weekAgo;
      }).length;
      
      const completedInvites = invites.filter(inv => inv.status === "completed").length;
      const completionRate = invites.length > 0 
        ? Math.round((completedInvites / invites.length) * 100) 
        : 0;
      
      res.json({
        sendsThisWeek,
        sendsGrowth: "+12%", // Mock
        activeAssessments: invites.filter(inv => inv.status !== "completed").length,
        completionRate: `${completionRate}%`,
        topTags: ["Central Sensitivity", "Sleep Hygiene", "Movement Confidence"], // Mock
      });
    } catch (error) {
      next(error);
    }
  });

  // ====== Admin Routes ======
  app.post("/api/admin/create-trial-user", requireAdmin, async (req, res, next) => {
    try {
      const { email, name } = req.body;
      
      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update existing user to have trial access
        await storage.updateUserSubscription(user.id, {
          subscriptionStatus: "active",
          subscriptionPeriodEnd: new Date("9999-12-31"),
        });
        user = await storage.getUser(user.id);
      } else {
        // Create new user with trial access
        const hashedPassword = await hashPassword("changeme123"); // Default password
        user = await storage.createUser({
          email,
          name: name || email.split("@")[0],
          password: hashedPassword,
          role: "clinician",
          subscriptionStatus: "active",
          subscriptionPeriodEnd: new Date("9999-12-31"),
        });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id/subscription", requireAdmin, async (req, res, next) => {
    try {
      const { subscriptionStatus, subscriptionPeriodEnd } = req.body;
      await storage.updateUserSubscription(req.params.id, {
        subscriptionStatus,
        subscriptionPeriodEnd: subscriptionPeriodEnd ? new Date(subscriptionPeriodEnd) : undefined,
      });
      const user = await storage.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      const content = await storage.getAllContent();
      
      const activeSubscriptions = users.filter(u => u.subscriptionStatus === "active").length;
      const totalRevenue = activeSubscriptions * 29; // $29/user
      
      res.json({
        totalUsers: users.length,
        activeSubscriptions,
        totalRevenue,
        totalContent: content.length,
        recentSignups: users.slice(0, 5),
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
