import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { setupAuth, requireAuth, requireSubscription, requireAdmin, hashPassword } from "./auth";
import { storage } from "./storage";
import { 
  insertContentItemSchema, 
  insertAssessmentInviteSchema,
  insertInternalScreeningSchema,
  insertEmailLogSchema 
} from "@shared/schema";
import { getAllContentFromContentful, getContentByIdFromContentful, getAllPathwaysFromContentful, getPathwayByIdFromContentful, isContentfulConfigured, ContentfulError } from "./contentful";
import { sendContentEmail, sendAssessmentInviteEmail, sendPatientPortalEmail } from "./gmail";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // ====== Public Content View Routes (for patient email links) ======
  app.get("/api/public/content-view/:token", async (req, res, next) => {
    try {
      const view = await storage.getContentViewByToken(req.params.token);
      if (!view) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      // Mark as viewed if first time and update email log status to clicked
      if (!view.viewedAt) {
        await storage.updateContentView(view.id, { viewedAt: new Date() });
        await storage.updateEmailLogStatus(view.emailLogId, 'clicked');
      }
      
      // Fetch the content
      let content = null;
      if (isContentfulConfigured()) {
        try {
          content = await getContentByIdFromContentful(view.contentId);
        } catch (e) {
          console.warn("Contentful fetch failed:", e);
        }
      }
      if (!content) {
        content = await storage.getContentById(view.contentId);
      }
      
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json({
        ...content,
        viewToken: view.token,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Update time spent on content
  app.post("/api/public/content-view/:token/time", async (req, res, next) => {
    try {
      const view = await storage.getContentViewByToken(req.params.token);
      if (!view) {
        return res.status(404).json({ error: "View not found" });
      }
      
      const { timeSpentSeconds } = req.body;
      if (typeof timeSpentSeconds === 'number' && timeSpentSeconds > 0) {
        await storage.updateContentView(view.id, { timeSpentSeconds });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // In-memory patient portal sessions with expiration (24 hours)
  const patientSessions = new Map<string, { email: string; emailLogIds: string[]; clinicianId: string; expiresAt: Date }>();
  
  // Clean up expired sessions every hour
  setInterval(() => {
    const now = new Date();
    for (const [token, session] of patientSessions.entries()) {
      if (session.expiresAt < now) {
        patientSessions.delete(token);
      }
    }
  }, 60 * 60 * 1000);

  // ====== Patient Portal Authentication ======
  app.post("/api/patient-portal/auth", async (req, res, next) => {
    try {
      const { email, accessCode } = req.body;
      
      if (!email || !accessCode) {
        return res.status(400).json({ error: "Email and access code are required" });
      }
      
      // Find email logs with matching email and access code
      const emailLogs = await storage.getEmailLogsByPatientEmailAndAccessCode(email.toLowerCase(), accessCode);
      
      if (emailLogs.length === 0) {
        return res.status(401).json({ error: "Invalid email or access code" });
      }
      
      // Generate a secure session token (UUID) 
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store session with scoped access - only email logs matching this access code
      patientSessions.set(sessionToken, {
        email: email.toLowerCase(),
        emailLogIds: emailLogs.map(l => l.id),
        clinicianId: emailLogs[0].clinicianUserId, // Scope to the clinician who sent content
        expiresAt,
      });
      
      res.json({ 
        success: true, 
        patientEmail: email.toLowerCase(),
        sessionToken,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get patient's assigned content and assessments
  app.get("/api/patient-portal/content", async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Authorization required" });
      }
      
      const sessionToken = authHeader.slice(7);
      const session = patientSessions.get(sessionToken);
      
      if (!session) {
        return res.status(401).json({ error: "Session expired or invalid" });
      }
      
      // Check session expiration
      if (session.expiresAt < new Date()) {
        patientSessions.delete(sessionToken);
        return res.status(401).json({ error: "Session expired" });
      }
      
      // Get content views ONLY from the scoped email log IDs
      const contentMap: Record<string, any> = {};
      
      for (const emailLogId of session.emailLogIds) {
        const views = await storage.getContentViewsByEmailLogId(emailLogId);
        const emailLog = await storage.getEmailLogById(emailLogId);
        
        for (const view of views) {
          // Fetch content details
          let content = null;
          if (isContentfulConfigured()) {
            try {
              content = await getContentByIdFromContentful(view.contentId);
            } catch (e) {
              console.warn("Contentful fetch failed:", e);
            }
          }
          if (!content) {
            content = await storage.getContentById(view.contentId);
          }
          
          if (content && !contentMap[view.contentId]) {
            contentMap[view.contentId] = {
              id: content.id,
              title: content.title,
              summary: content.summary,
              readTime: content.readTime,
              viewToken: view.token,
              viewedAt: view.viewedAt,
              assignedAt: emailLog?.sentAt,
              providerNote: emailLog?.providerNote,
            };
          }
        }
      }
      
      // Get assessment invites ONLY from the same clinician
      const assessmentInvites = await storage.getAssessmentInvitesByPatientEmail(session.clinicianId, session.email);
      
      res.json({
        content: Object.values(contentMap),
        assessments: assessmentInvites.map(invite => ({
          id: invite.id,
          token: invite.token,
          status: invite.status,
          createdAt: invite.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

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
      // Generate a 6-digit access code for patient portal
      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const validated = insertEmailLogSchema.parse({
        ...req.body,
        clinicianUserId: req.user!.id,
        accessCode,
      });
      
      const log = await storage.createEmailLog(validated);
      
      // Create content view tracking entries for each content item
      const contentItemsWithLinks: Array<{
        title: string; 
        summary: string; 
        readTime: string | null; 
        imageUrl: string | null;
        viewUrl: string;
      }> = [];
      
      if (validated.contentIds && validated.contentIds.length > 0) {
        for (const contentId of validated.contentIds) {
          try {
            let content = null;
            if (isContentfulConfigured()) {
              content = await getContentByIdFromContentful(contentId);
            }
            if (!content) {
              content = await storage.getContentById(contentId);
            }
            
            if (content) {
              // Create a tracking entry for this content
              const contentView = await storage.createContentView({
                emailLogId: log.id,
                contentId: contentId,
                patientEmail: validated.patientEmail,
              });
              
              // Build the tracking URL - using the token for tracking
              const baseUrl = process.env.REPLIT_DEV_DOMAIN 
                ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
                : process.env.REPLIT_DOMAINS 
                  ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
                  : 'http://localhost:5000';
              
              contentItemsWithLinks.push({
                title: content.title,
                summary: content.summary,
                readTime: content.readTime,
                imageUrl: content.imageUrl,
                viewUrl: `${baseUrl}/view/${contentView.token}`,
              });
            }
          } catch (e) {
            console.error('[Email] Error processing content:', contentId, e);
          }
        }
      }
      
      // Build the portal URL
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'http://localhost:5000';
      
      // Send email via Gmail with patient portal access
      const emailResult = await sendPatientPortalEmail({
        toEmail: validated.patientEmail,
        subject: validated.subject,
        accessCode: accessCode,
        portalUrl: `${baseUrl}/patient-portal`,
        contentCount: validated.contentIds?.length || 0,
        providerNote: validated.providerNote || undefined,
        clinicianName: req.user!.name || undefined,
      });
      
      if (!emailResult.success) {
        console.error('[Email] Failed to send patient portal email:', emailResult.error);
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

  app.get("/api/email-logs/:id/content-views", requireSubscription, async (req, res, next) => {
    try {
      const views = await storage.getContentViewsByEmailLogId(req.params.id);
      res.json(views);
    } catch (error) {
      next(error);
    }
  });

  // ====== Patient Summary / EMR Documentation ======
  app.get("/api/patient-summary/:email", requireSubscription, async (req, res, next) => {
    try {
      const patientEmail = decodeURIComponent(req.params.email);
      const clinicianId = req.user!.id;
      
      // Gather all data for this patient
      const emailLogs = await storage.getEmailLogsByPatientEmail(clinicianId, patientEmail);
      const assessmentInvites = await storage.getAssessmentInvitesByPatientEmail(clinicianId, patientEmail);
      
      // Get content views for all email logs
      const contentViewsPromises = emailLogs.map(log => storage.getContentViewsByEmailLogId(log.id));
      const contentViewsArrays = await Promise.all(contentViewsPromises);
      const allContentViews = contentViewsArrays.flat();
      
      // Get content details for viewed items
      const contentIds = Array.from(new Set(allContentViews.map(v => v.contentId)));
      const contentDetails: Record<string, { title: string; tags: string[] }> = {};
      for (const id of contentIds) {
        const content = await storage.getContentById(id);
        if (content) {
          contentDetails[id] = { title: content.title, tags: content.tags };
        }
      }
      
      // Calculate engagement stats
      const totalContentSent = emailLogs.reduce((sum, log) => sum + (log.contentIds?.length || 0), 0);
      const viewedContent = allContentViews.filter(v => v.viewedAt).length;
      const totalTimeSpent = allContentViews.reduce((sum, v) => sum + (v.timeSpentSeconds || 0), 0);
      
      // Build summary
      const summary = {
        patientEmail,
        generatedAt: new Date().toISOString(),
        clinicianName: req.user!.name || 'Unknown',
        
        // Overview stats
        stats: {
          totalEmailsSent: emailLogs.length,
          totalContentSent,
          contentViewed: viewedContent,
          engagementRate: totalContentSent > 0 ? Math.round((viewedContent / totalContentSent) * 100) : 0,
          totalReadingTimeMinutes: Math.round(totalTimeSpent / 60),
          assessmentsSent: assessmentInvites.length,
          assessmentsCompleted: assessmentInvites.filter(a => a.status === 'completed').length,
        },
        
        // Content engagement details
        contentEngagement: allContentViews.map(view => ({
          contentTitle: contentDetails[view.contentId]?.title || 'Unknown Content',
          tags: contentDetails[view.contentId]?.tags || [],
          sentAt: emailLogs.find(l => l.id === view.emailLogId)?.sentAt,
          viewedAt: view.viewedAt,
          timeSpentSeconds: view.timeSpentSeconds || 0,
        })),
        
        // Email history
        emailHistory: emailLogs.map(log => ({
          date: log.sentAt,
          subject: log.subject,
          type: log.type,
          status: log.status,
          contentCount: log.contentIds?.length || 0,
        })),
        
        // Assessment history
        assessmentHistory: assessmentInvites.map(invite => ({
          sentAt: invite.createdAt,
          status: invite.status,
          completedAt: invite.completedAt,
        })),
      };
      
      res.json(summary);
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
      const recentActivity: { email: string; action: string; status: string; time: Date }[] = [];
      
      emailLogs.slice(0, 10).forEach(log => {
        recentActivity.push({
          email: log.patientEmail,
          action: log.type === 'content_bundle' ? 'Content Bundle' : 
                  log.type === 'assessment_invite' ? 'Assessment Invite' : 'Email',
          status: log.status || 'sent',
          time: log.sentAt,
        });
      });
      
      invites.filter(inv => inv.status === 'completed').slice(0, 5).forEach(inv => {
        recentActivity.push({
          email: inv.patientEmail,
          action: 'Assessment',
          status: 'completed',
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
      
      // Calculate content read rate (emails that have been clicked/viewed)
      const contentBundleLogs = emailLogs.filter(log => log.type === 'content_bundle');
      const clickedLogs = contentBundleLogs.filter(log => log.status === 'clicked');
      const contentReadRate = contentBundleLogs.length > 0 
        ? Math.round((clickedLogs.length / contentBundleLogs.length) * 100) 
        : 0;
      
      // Build action needed list (emails that haven't been opened/clicked)
      const actionNeeded: { email: string; subject: string; daysSinceSent: number; id: string }[] = [];
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      contentBundleLogs
        .filter(log => log.status === 'sent' && log.sentAt < threeDaysAgo)
        .slice(0, 5)
        .forEach(log => {
          const daysSinceSent = Math.floor((now.getTime() - new Date(log.sentAt).getTime()) / 86400000);
          actionNeeded.push({
            email: log.patientEmail,
            subject: log.subject,
            daysSinceSent,
            id: log.id,
          });
        });
      
      res.json({
        sendsThisWeek,
        sendsGrowth,
        contentReadRate: `${contentReadRate}%`,
        completionRate: `${completionRate}%`,
        topTags: topTags.length > 0 ? topTags : ["No data yet"],
        chartData,
        recentActivity: topRecentActivity,
        actionNeeded,
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
      const stats = await storage.getAdminStats();
      const users = await storage.getAllUsers();
      const content = await storage.getAllContent();
      
      res.json({
        ...stats,
        totalContent: content.length,
        recentSignups: users.slice(0, 5),
      });
    } catch (error) {
      next(error);
    }
  });

  // ====== Follow-up Rules Routes ======
  app.get("/api/follow-up-rules", requireSubscription, async (req, res, next) => {
    try {
      const rules = await storage.getFollowUpRulesByClinicianId(req.user!.id);
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/follow-up-rules", requireSubscription, async (req, res, next) => {
    try {
      const rule = await storage.createFollowUpRule({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/follow-up-rules/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.updateFollowUpRule(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/follow-up-rules/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.deleteFollowUpRule(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/scheduled-follow-ups", requireSubscription, async (req, res, next) => {
    try {
      const followUps = await storage.getScheduledFollowUpsByClinicianId(req.user!.id);
      res.json(followUps);
    } catch (error) {
      next(error);
    }
  });

  // ====== Care Pathways Routes ======
  app.get("/api/pathways", requireSubscription, async (req, res, next) => {
    try {
      // Get custom pathways from database
      const customPathways = await storage.getCarePathways(req.user!.id);
      
      // Try to get template pathways from Contentful first
      let templatePathways: any[] = [];
      if (isContentfulConfigured()) {
        try {
          const contentfulPathways = await getAllPathwaysFromContentful();
          templatePathways = contentfulPathways;
        } catch (error) {
          if (error instanceof ContentfulError) {
            console.warn("Contentful pathway fetch failed, falling back to database:", error.message);
          }
          templatePathways = await storage.getCarePathways();
        }
      } else {
        templatePathways = await storage.getCarePathways();
      }
      
      res.json({ custom: customPathways, templates: templatePathways });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/pathways/:id", requireSubscription, async (req, res, next) => {
    try {
      // Try Contentful first for pathway templates
      if (isContentfulConfigured()) {
        try {
          const contentfulPathway = await getPathwayByIdFromContentful(req.params.id);
          if (contentfulPathway) {
            res.json(contentfulPathway);
            return;
          }
        } catch (error) {
          if (error instanceof ContentfulError) {
            console.warn("Contentful pathway fetch failed, falling back to database:", error.message);
          }
        }
      }
      
      // Fallback to database
      const pathway = await storage.getCarePathwayById(req.params.id);
      if (!pathway) {
        return res.status(404).json({ error: "Pathway not found" });
      }
      const milestones = await storage.getMilestonesByPathwayId(req.params.id);
      res.json({ ...pathway, milestones });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/pathways", requireSubscription, async (req, res, next) => {
    try {
      const pathway = await storage.createCarePathway({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      res.status(201).json(pathway);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/pathways/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.updateCarePathway(req.params.id, req.body);
      const updated = await storage.getCarePathwayById(req.params.id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/pathways/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.deleteCarePathway(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Pathway milestones
  app.post("/api/pathways/:id/milestones", requireSubscription, async (req, res, next) => {
    try {
      const milestone = await storage.createPathwayMilestone({
        ...req.body,
        pathwayId: req.params.id,
      });
      res.status(201).json(milestone);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/milestones/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.updatePathwayMilestone(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/milestones/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.deletePathwayMilestone(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Patient pathway enrollments
  app.get("/api/patient-pathways", requireSubscription, async (req, res, next) => {
    try {
      const enrollments = await storage.getPatientPathwaysByClinicianId(req.user!.id);
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/patient-pathways", requireSubscription, async (req, res, next) => {
    try {
      const enrollment = await storage.createPatientPathway({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/patient-pathways/:id", requireSubscription, async (req, res, next) => {
    try {
      await storage.updatePatientPathway(req.params.id, req.body);
      const updated = await storage.getPatientPathwayById(req.params.id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // ====== Content Recommendations Routes ======
  app.get("/api/recommendations", requireSubscription, async (req, res, next) => {
    try {
      const recommendations = await storage.getContentRecommendations();
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recommendations/for-scores", requireSubscription, async (req, res, next) => {
    try {
      const { tagScores } = req.body;
      const recommendations = await storage.getRecommendationsForScores(tagScores);
      
      // Get actual content for each recommendation
      const contentPromises = recommendations.map(async rec => {
        const content = await storage.getContentById(rec.contentId);
        return { ...rec, content };
      });
      const withContent = await Promise.all(contentPromises);
      
      res.json(withContent);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Manage content recommendations
  app.post("/api/admin/recommendations", requireAdmin, async (req, res, next) => {
    try {
      const rec = await storage.createContentRecommendation(req.body);
      res.status(201).json(rec);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/recommendations/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteContentRecommendation(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ====== Audit Logs Routes ======
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res, next) => {
    try {
      const { userId, action, limit } = req.query;
      const logs = await storage.getAuditLogs({
        userId: userId as string,
        action: action as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // ====== Admin Analytics Routes ======
  app.get("/api/admin/analytics", requireAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      const stats = await storage.getAdminStats();
      
      // Subscription health metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const activeUsers = users.filter(u => u.subscriptionStatus === 'active');
      const canceledLastMonth = users.filter(u => 
        u.subscriptionStatus === 'canceled' && 
        u.updatedAt && 
        new Date(u.updatedAt) >= thirtyDaysAgo
      ).length;
      
      const newSubscriptionsLastMonth = users.filter(u => 
        u.subscriptionStatus === 'active' && 
        new Date(u.createdAt) >= thirtyDaysAgo
      ).length;
      
      // Churn rate (canceled / total active at start of period)
      const churnRate = activeUsers.length > 0 
        ? Math.round((canceledLastMonth / activeUsers.length) * 100) 
        : 0;
      
      // Usage analytics
      const clinicians = users.filter(u => u.role === 'clinician');
      const activeLastWeek = clinicians.filter(u => 
        u.lastLogin && new Date(u.lastLogin) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      res.json({
        subscriptionHealth: {
          totalActive: activeUsers.length,
          mrr: stats.mrr,
          newThisMonth: newSubscriptionsLastMonth,
          canceledThisMonth: canceledLastMonth,
          churnRate: `${churnRate}%`,
          averageRevenue: activeUsers.length > 0 ? Math.round(stats.mrr / activeUsers.length) : 0,
        },
        usageMetrics: {
          totalClinicians: clinicians.length,
          activeLastWeek,
          totalContentSent: stats.totalContentSent,
          totalAssessments: stats.totalAssessments,
          engagementRate: stats.totalContentSent > 0 ? Math.round((stats.totalAssessments / stats.totalContentSent) * 100) : 0,
        },
        growth: {
          signupsLast30Days: stats.recentSignups,
          previousPeriod: users.filter(u => 
            new Date(u.createdAt) >= sixtyDaysAgo && 
            new Date(u.createdAt) < thirtyDaysAgo
          ).length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
