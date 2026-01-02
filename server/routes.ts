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
import { getAllContentFromContentful, getContentByIdFromContentful, isContentfulConfigured, ContentfulError } from "./contentful";
import { sendContentEmail, sendAssessmentInviteEmail } from "./resend";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // ====== Content Library Routes (Contentful Integration with Database Fallback) ======
  app.get("/api/content", requireSubscription, async (req, res, next) => {
    try {
      if (isContentfulConfigured()) {
        try {
          const content = await getAllContentFromContentful();
          res.json(content);
          return;
        } catch (error) {
          if (error instanceof ContentfulError) {
            console.warn("Contentful fetch failed, falling back to database:", error.message);
          }
        }
      }
      const content = await storage.getAllContent();
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/content/:id", requireSubscription, async (req, res, next) => {
    try {
      if (isContentfulConfigured()) {
        try {
          const content = await getContentByIdFromContentful(req.params.id);
          if (content) {
            res.json(content);
            return;
          }
        } catch (error) {
          if (error instanceof ContentfulError) {
            console.warn("Contentful fetch failed, falling back to database:", error.message);
          }
        }
      }
      const content = await storage.getContentById(req.params.id);
      if (!content) {
        return res.status(404).send("Content not found");
      }
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/content/status", requireAuth, async (req, res, next) => {
    try {
      res.json({ 
        source: isContentfulConfigured() ? "contentful" : "database",
        configured: isContentfulConfigured() 
      });
    } catch (error) {
      next(error);
    }
  });

  // Database content management routes (for when Contentful is not used or for local backup)
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
      
      // Send assessment invite email via Resend
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';
      const assessmentLink = `${baseUrl}/assessment/${invite.token}`;
      
      const emailResult = await sendAssessmentInviteEmail({
        toEmail: invite.patientEmail,
        assessmentLink,
        clinicianName: req.user!.name || undefined,
      });
      
      if (!emailResult.success) {
        console.error('[Email] Failed to send assessment invite:', emailResult.error);
      }

      res.status(201).json({ ...invite, emailSent: emailResult.success });
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
      
      // Fetch content items to include in email
      let contentItems: Array<{title: string; summary: string; body: string; imageUrl: string | null; readTime: string | null}> = [];
      if (validated.contentIds && validated.contentIds.length > 0) {
        for (const contentId of validated.contentIds) {
          try {
            if (isContentfulConfigured()) {
              const content = await getContentByIdFromContentful(contentId);
              if (content) {
                contentItems.push({
                  title: content.title,
                  summary: content.summary,
                  body: content.body,
                  imageUrl: content.imageUrl,
                  readTime: content.readTime,
                });
              }
            } else {
              const content = await storage.getContentById(contentId);
              if (content) {
                contentItems.push({
                  title: content.title,
                  summary: content.summary,
                  body: content.body,
                  imageUrl: content.imageUrl,
                  readTime: content.readTime,
                });
              }
            }
          } catch (e) {
            // If Contentful fails, try database
            const content = await storage.getContentById(contentId);
            if (content) {
              contentItems.push({
                title: content.title,
                summary: content.summary,
                body: content.body,
                imageUrl: content.imageUrl,
                readTime: content.readTime,
              });
            }
          }
        }
      }
      
      // Send email via Resend
      const emailResult = await sendContentEmail({
        toEmail: validated.patientEmail,
        subject: validated.subject,
        contentItems,
        providerNote: validated.providerNote || undefined,
        clinicianName: req.user!.name || undefined,
      });
      
      if (!emailResult.success) {
        console.error('[Email] Failed to send content email:', emailResult.error);
      }
      
      res.status(201).json({ ...log, emailSent: emailResult.success });
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
      
      // Calculate sends this week and last week for growth comparison
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const sendsThisWeek = emailLogs.filter(log => log.sentAt >= weekAgo).length;
      const sendsLastWeek = emailLogs.filter(log => log.sentAt >= twoWeeksAgo && log.sentAt < weekAgo).length;
      
      let sendsGrowth = "+0%";
      if (sendsLastWeek > 0) {
        const growth = Math.round(((sendsThisWeek - sendsLastWeek) / sendsLastWeek) * 100);
        sendsGrowth = growth >= 0 ? `+${growth}%` : `${growth}%`;
      } else if (sendsThisWeek > 0) {
        sendsGrowth = "+100%";
      }
      
      // Build chart data for last 7 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData: { name: string; sends: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const sends = emailLogs.filter(log => log.sentAt >= dayStart && log.sentAt < dayEnd).length;
        chartData.push({ name: dayNames[day.getDay()], sends });
      }
      
      // Build recent activity (last 10 items combining email logs and invites)
      const recentActivity: { email: string; action: string; time: Date }[] = [];
      
      emailLogs.slice(0, 10).forEach(log => {
        recentActivity.push({
          email: log.patientEmail,
          action: log.type === 'content_bundle' ? 'Content sent' : 
                  log.type === 'assessment_invite' ? 'Assessment invite sent' : 'Email sent',
          time: log.sentAt,
        });
      });
      
      invites.filter(inv => inv.status === 'completed').slice(0, 5).forEach(inv => {
        recentActivity.push({
          email: inv.patientEmail,
          action: 'Completed assessment',
          time: inv.completedAt || inv.createdAt,
        });
      });
      
      // Sort by time descending and take top 5
      recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      const topRecentActivity = recentActivity.slice(0, 5).map(item => ({
        ...item,
        timeAgo: getTimeAgo(item.time),
      }));
      
      // Calculate top tags from content sent
      const tagCounts: Record<string, number> = {};
      for (const log of emailLogs) {
        if (log.contentIds && log.contentIds.length > 0) {
          for (const contentId of log.contentIds) {
            const content = await storage.getContentById(contentId);
            if (content?.tags) {
              for (const tag of content.tags) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              }
            }
          }
        }
      }
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);
      
      const completedInvites = invites.filter(inv => inv.status === "completed").length;
      const completionRate = invites.length > 0 
        ? Math.round((completedInvites / invites.length) * 100) 
        : 0;
      
      res.json({
        sendsThisWeek,
        sendsGrowth,
        activeAssessments: invites.filter(inv => inv.status !== "completed").length,
        completionRate: `${completionRate}%`,
        topTags: topTags.length > 0 ? topTags : ["No data yet"],
        chartData,
        recentActivity: topRecentActivity,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Helper function for relative time
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  // ====== Admin Routes ======
  app.post("/api/admin/users", requireAdmin, async (req, res, next) => {
    try {
      const { email, name, password, subscriptionMonths } = req.body;
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Create new user
      const hashedPassword = await hashPassword(password || "changeme123");
      const periodEnd = subscriptionMonths 
        ? new Date(Date.now() + subscriptionMonths * 30 * 24 * 60 * 60 * 1000)
        : null;
      
      const user = await storage.createUser({
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        role: "clinician",
        subscriptionStatus: subscriptionMonths ? "active" : "inactive",
        subscriptionPeriodEnd: periodEnd,
      });
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

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

  app.get("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const { name, email, role } = req.body;
      await storage.updateUser(req.params.id, { name, email, role });
      const updatedUser = await storage.getUser(req.params.id);
      res.json(updatedUser);
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

  app.post("/api/admin/users/:id/extend-subscription", requireAdmin, async (req, res, next) => {
    try {
      const { months } = req.body;
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentEnd = user.subscriptionPeriodEnd || new Date();
      const newEnd = new Date(currentEnd.getTime() + months * 30 * 24 * 60 * 60 * 1000);
      
      await storage.updateUserSubscription(req.params.id, {
        subscriptionStatus: "active",
        subscriptionPeriodEnd: newEnd,
      });
      
      const updatedUser = await storage.getUser(req.params.id);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res, next) => {
    try {
      const { password } = req.body;
      const hashedPassword = await hashPassword(password || "changeme123");
      await storage.updateUserPassword(req.params.id, hashedPassword);
      res.json({ success: true, message: "Password reset successfully" });
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
      
      // Calculate monthly revenue - only count subscriptions that will bill this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthlyRevenue = users.filter(u => {
        if (u.subscriptionStatus !== "active" || !u.subscriptionPeriodEnd) return false;
        const endDate = new Date(u.subscriptionPeriodEnd);
        // Include if subscription is active and end date is beyond this month
        return endDate > monthEnd;
      }).length * 29; // $29/user
      
      res.json({
        totalUsers: users.length,
        activeSubscriptions,
        monthlyRevenue,
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
