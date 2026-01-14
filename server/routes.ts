import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { setupAuth, requireAuth, requireSubscription, requireAdmin, hashPassword } from "./auth";
import { storage } from "./storage";
import { 
  insertContentItemSchema, 
  insertAssessmentSchema,
  insertAssessmentInviteSchema,
  insertInternalScreeningSchema,
  insertEmailLogSchema 
} from "@shared/schema";
import { getAllContentFromContentful, getContentByIdFromContentful, getAllPathwaysFromContentful, getPathwayByIdFromContentful, isContentfulConfigured, ContentfulError } from "./contentful";
import { sendContentEmail, sendAssessmentInviteEmail, sendPatientPortalEmail, sendPasswordResetEmail } from "./gmail";
import { logClinicianAction, logPatientAction } from "./audit";
import { scoreAssessmentResponse } from "./scoring";
import { 
  getRecommendationsWithFallback, 
  createRecommendationRule, 
  getRecommendationRules, 
  deleteRecommendationRule,
  createRecommendationConfig,
  getRecommendationConfigs,
  updateRecommendationConfig,
  deleteRecommendationConfig,
  previewRecommendations,
  generateRecommendations,
  savePatientRecommendation
} from "./recommendation";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // ====== Password Reset Routes ======
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Always return success to prevent email enumeration attacks
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (user) {
        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // Store the token
        await storage.createPasswordResetToken(user.id, token, expiresAt);
        
        // Send the reset email
        const baseUrl = req.headers.origin || `https://${req.headers.host}`;
        const resetLink = `${baseUrl}/forgot-password?token=${token}`;
        
        await sendPasswordResetEmail({
          toEmail: email,
          resetLink,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
      }
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
      }
      if (!/\d/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one number" });
      }
      
      // Find the token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      
      if (resetToken.usedAt) {
        return res.status(400).json({ error: "This reset link has already been used" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "This reset link has expired" });
      }
      
      // Update the password
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

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

  // Clean up expired patient sessions every hour (from database)
  setInterval(async () => {
    try {
      const count = await storage.invalidateExpiredSessions();
      if (count > 0) {
        console.log(`[Session cleanup] Invalidated ${count} expired patient sessions`);
      }
    } catch (error) {
      console.error('[Session cleanup] Error:', error);
    }
  }, 60 * 60 * 1000);

  // Helper to get client IP
  const getClientIp = (req: any): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    if (Array.isArray(forwarded)) return forwarded[0];
    return req.socket?.remoteAddress || 'unknown';
  };

  // ====== Patient Portal Authentication ======
  app.post("/api/patient-portal/auth", async (req, res, next) => {
    try {
      const { email, accessCode } = req.body;
      
      if (!email || !accessCode) {
        return res.status(400).json({ error: "Email and access code are required" });
      }
      
      // First, find email log by access code to check lockout status
      const emailLog = await storage.getEmailLogByAccessCode(accessCode);
      
      // If no email log found with this code, return generic error (don't reveal if code exists)
      if (!emailLog) {
        // Audit log: failed auth attempt (code not found)
        await logPatientAction(req, email.toLowerCase(), 'patient_portal_auth_failed', {
          details: { reason: 'invalid_code' },
          outcome: 'failure',
        });
        return res.status(401).json({ 
          error: "Invalid email or access code",
          attemptsRemaining: null 
        });
      }
      
      // Check if permanently locked
      if (emailLog.permanentlyLocked) {
        return res.status(403).json({ 
          error: "This access code has been permanently locked due to too many failed attempts. Please contact your healthcare provider to request new access.",
          permanentlyLocked: true
        });
      }
      
      // Check if temporarily locked
      const now = new Date();
      if (emailLog.lockedUntil && emailLog.lockedUntil > now) {
        const minutesRemaining = Math.ceil((emailLog.lockedUntil.getTime() - now.getTime()) / 60000);
        return res.status(403).json({ 
          error: `Too many failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
          lockedUntil: emailLog.lockedUntil,
          minutesRemaining
        });
      }
      
      // Verify email matches (case-insensitive)
      if (emailLog.patientEmail.toLowerCase() !== email.toLowerCase()) {
        // Increment failed attempts
        const newAttempts = (emailLog.failedAttempts || 0) + 1;
        let lockoutUpdate: { failedAttempts: number; lockedUntil?: Date | null; permanentlyLocked?: boolean } = { 
          failedAttempts: newAttempts 
        };
        
        // Determine lockout tier
        if (newAttempts >= 9) {
          // Permanent lockout after 9 attempts
          lockoutUpdate.permanentlyLocked = true;
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(403).json({ 
            error: "This access code has been permanently locked due to too many failed attempts. Please contact your healthcare provider to request new access.",
            permanentlyLocked: true
          });
        } else if (newAttempts >= 6) {
          // 1 hour lockout after 6 attempts
          lockoutUpdate.lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(401).json({ 
            error: "Invalid email or access code. You have been locked out for 1 hour. 3 more failed attempts will permanently lock this access code.",
            attemptsRemaining: 9 - newAttempts,
            lockedFor: 60
          });
        } else if (newAttempts >= 3) {
          // 5 minute lockout after 3 attempts
          lockoutUpdate.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(401).json({ 
            error: "Invalid email or access code. You have been locked out for 5 minutes. 3 more failed attempts will result in a 1-hour lockout.",
            attemptsRemaining: 6 - newAttempts,
            lockedFor: 5
          });
        } else {
          // Just increment attempts, warn user
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(401).json({ 
            error: "Invalid email or access code.",
            attemptsRemaining: 3 - newAttempts,
            warning: newAttempts === 2 ? "Warning: 1 more failed attempt will result in a 5-minute lockout." : undefined
          });
        }
      }
      
      // Success! Reset failed attempts
      if ((emailLog.failedAttempts || 0) > 0) {
        await storage.updateEmailLogLockout(emailLog.id, { 
          failedAttempts: 0, 
          lockedUntil: null 
        });
      }
      
      // Generate a secure session token (UUID) 
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store session in database (persistent, trackable)
      await storage.createPatientSession({
        token: sessionToken,
        patientEmail: email.toLowerCase(),
        emailLogId: emailLog.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt,
      });
      
      // Audit log: successful patient portal login
      await logPatientAction(req, email.toLowerCase(), 'patient_portal_auth', {
        resourceType: 'session',
        resourceId: emailLog.id,
        phiAccessed: true,
        phiScope: 'patient email, session created',
        sessionId: sessionToken,
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
      const session = await storage.getPatientSessionByToken(sessionToken);
      
      if (!session) {
        return res.status(401).json({ error: "Session expired or invalid" });
      }
      
      // Check session expiration
      if (session.expiresAt < new Date()) {
        await storage.invalidatePatientSession(sessionToken);
        return res.status(401).json({ error: "Session expired" });
      }
      
      // Update session activity (sliding window)
      await storage.updatePatientSessionActivity(sessionToken);
      
      // Get email log for this session
      const emailLog = await storage.getEmailLogById(session.emailLogId);
      
      // Get content views from the scoped email log
      const contentMap: Record<string, any> = {};
      const views = await storage.getContentViewsByEmailLogId(session.emailLogId);
      
      for (const view of views) {
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
      
      // Get assessment invites from the same clinician
      const clinicianId = emailLog?.clinicianUserId;
      const assessmentInvites = clinicianId 
        ? await storage.getAssessmentInvitesByPatientEmail(clinicianId, session.patientEmail)
        : [];
      
      // Audit log: patient viewing content (PHI access)
      await logPatientAction(req, session.patientEmail, 'content_view', {
        resourceType: 'content',
        phiAccessed: true,
        phiScope: 'patient educational content',
        sessionId: sessionToken,
      });
      
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
      let content = null;
      if (isContentfulConfigured()) {
        try {
          content = await getContentByIdFromContentful(req.params.id);
        } catch (error) {
          if (error instanceof ContentfulError) {
            console.warn("Contentful fetch failed, falling back to database:", error.message);
          }
        }
      }
      if (!content) {
        content = await storage.getContentById(req.params.id);
      }
      if (!content) {
        return res.status(404).send("Content not found");
      }
      
      await logClinicianAction(req, req.user!, 'content_access', {
        resourceType: 'content',
        resourceId: req.params.id,
        details: { title: content.title },
      });
      
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
      
      await logClinicianAction(req, req.user!, 'content_create', {
        resourceType: 'content',
        resourceId: content.id,
        details: { title: content.title },
      });
      
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
      
      await logClinicianAction(req, req.user!, 'content_update', {
        resourceType: 'content',
        resourceId: req.params.id,
        details: { title: content.title },
      });
      
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/content/:id", requireAuth, async (req, res, next) => {
    try {
      await logClinicianAction(req, req.user!, 'content_delete', {
        resourceType: 'content',
        resourceId: req.params.id,
      });
      
      await storage.deleteContent(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ====== Assessment CRUD Routes (Clinician-facing) ======
  app.get("/api/assessments", requireSubscription, async (req, res, next) => {
    try {
      const typeFilter = req.query.type as string | undefined;
      const publishedOnly = req.query.published === "true";
      
      let assessments = await storage.getAssessmentsByClinicianId(req.user!.id);
      let templates = await storage.getTemplateAssessments();
      
      // Filter by type if specified
      if (typeFilter) {
        assessments = assessments.filter(a => a.assessmentType === typeFilter);
        templates = templates.filter(t => t.assessmentType === typeFilter);
      }
      
      // Filter to published only if specified
      if (publishedOnly) {
        assessments = assessments.filter(a => a.isPublished);
        templates = templates.filter(t => t.isPublished);
      }
      
      await logClinicianAction(req, req.user!, 'assessment_access', {
        resourceType: 'assessment',
        details: { count: assessments.length + templates.length, typeFilter },
      });
      
      res.json([...assessments, ...templates.filter(t => t.clinicianUserId !== req.user!.id)]);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/assessments/:id", requireSubscription, async (req, res, next) => {
    try {
      const assessment = await storage.getAssessmentById(req.params.id);
      if (!assessment) {
        return res.status(404).send("Assessment not found");
      }
      
      await logClinicianAction(req, req.user!, 'assessment_access', {
        resourceType: 'assessment',
        resourceId: req.params.id,
        details: { name: assessment.name },
      });
      
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  });

  // Get question names/tags from an assessment's surveyJson with full metadata for answer pickers
  app.get("/api/assessments/:id/questions", requireSubscription, async (req, res, next) => {
    try {
      const assessment = await storage.getAssessmentById(req.params.id);
      if (!assessment) {
        return res.status(404).send("Assessment not found");
      }
      
      interface SurveyElement {
        name?: string;
        title?: string;
        type?: string;
        choices?: Array<{ value: string | number; text: string } | string | number>;
        rateMax?: number;
        rateMin?: number;
        rateCount?: number;
        elements?: SurveyElement[];
      }
      
      const surveyJson = assessment.surveyJson as { pages?: Array<{ elements?: SurveyElement[] }> } | null;
      const questions: Array<{
        name: string;
        title: string;
        type: string;
        choices?: Array<{ value: string | number; text: string }>;
        rateMax?: number;
        rateMin?: number;
      }> = [];
      
      if (surveyJson?.pages) {
        for (const page of surveyJson.pages) {
          if (page.elements) {
            const extractQuestions = (elements: SurveyElement[]) => {
              for (const element of elements) {
                if (element.name && element.type !== 'panel' && element.type !== 'html') {
                  // Normalize choices to { value, text } format
                  let choices: Array<{ value: string | number; text: string }> | undefined;
                  if (element.choices) {
                    choices = element.choices.map(c => {
                      if (typeof c === 'object' && c !== null) {
                        return { value: c.value, text: c.text };
                      }
                      return { value: c, text: String(c) };
                    });
                  }
                  
                  questions.push({
                    name: element.name,
                    title: typeof element.title === 'string' ? element.title : element.name,
                    type: element.type || 'unknown',
                    choices,
                    rateMax: element.rateMax || element.rateCount,
                    rateMin: element.rateMin || 1,
                  });
                }
                // Handle nested elements in panels
                if (element.elements) {
                  extractQuestions(element.elements);
                }
              }
            };
            extractQuestions(page.elements);
          }
        }
      }
      
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/assessments", requireSubscription, async (req, res, next) => {
    try {
      const validated = insertAssessmentSchema.parse({
        ...req.body,
        clinicianUserId: req.user!.id,
      });
      
      const assessment = await storage.createAssessment(validated);
      
      await logClinicianAction(req, req.user!, 'assessment_create', {
        resourceType: 'assessment',
        resourceId: assessment.id,
        details: { name: assessment.name },
      });
      
      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/assessments/:id", requireSubscription, async (req, res, next) => {
    try {
      const existing = await storage.getAssessmentById(req.params.id);
      if (!existing) {
        return res.status(404).send("Assessment not found");
      }
      
      if (existing.clinicianUserId !== req.user!.id && !existing.isTemplate) {
        return res.status(403).send("Cannot edit assessments you don't own");
      }
      
      const assessment = await storage.updateAssessment(req.params.id, req.body);
      
      await logClinicianAction(req, req.user!, 'assessment_update', {
        resourceType: 'assessment',
        resourceId: req.params.id,
        details: { name: assessment?.name },
      });
      
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/assessments/:id", requireSubscription, async (req, res, next) => {
    try {
      const existing = await storage.getAssessmentById(req.params.id);
      if (!existing) {
        return res.status(404).send("Assessment not found");
      }
      
      if (existing.clinicianUserId !== req.user!.id) {
        return res.status(403).send("Cannot delete assessments you don't own");
      }
      
      await logClinicianAction(req, req.user!, 'assessment_delete', {
        resourceType: 'assessment',
        resourceId: req.params.id,
      });
      
      await storage.deleteAssessment(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Score an assessment (for clinician-conducted assessments)
  app.post("/api/assessments/score", requireSubscription, async (req, res, next) => {
    try {
      const { assessmentId, answers } = req.body;
      
      if (!assessmentId || !answers) {
        return res.status(400).json({ error: "assessmentId and answers are required" });
      }
      
      const result = await scoreAssessmentResponse(assessmentId, answers);
      
      await logClinicianAction(req, req.user!, 'assessment_score', {
        resourceType: 'assessment',
        resourceId: assessmentId,
        details: { tagCount: result.tagScores.length },
      });
      
      res.json(result);
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
      
      // Audit log: assessment invite created (PHI action)
      await logClinicianAction(req, req.user!, 'assessment_create', {
        resourceType: 'assessment',
        resourceId: invite.id,
        phiAccessed: true,
        phiScope: 'patient email, assessment invite',
        details: { patientEmail: invite.patientEmail },
      });
      
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
      
      // Audit log: viewing assessment invites (PHI list access)
      await logClinicianAction(req, req.user!, 'assessment_access', {
        resourceType: 'assessment',
        phiAccessed: true,
        phiScope: 'patient emails in assessment list',
        details: { count: invites.length },
      });
      
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

  app.post("/api/assessment-invites/:inviteId/complete", async (req, res, next) => {
    try {
      const { answers } = req.body;
      if (!answers) {
        return res.status(400).send("Answers are required");
      }
      
      const invite = await storage.getAssessmentInviteById(req.params.inviteId);
      if (!invite) {
        return res.status(404).send("Invite not found");
      }
      
      if (invite.status === "completed") {
        return res.status(400).send("Assessment already completed");
      }
      
      // Score the assessment
      const scoringResult = await scoreAssessmentResponse(invite.assessmentId, answers);
      
      // Create the assessment response with scores
      const response = await storage.createAssessmentResponse({
        inviteId: invite.id,
        answers,
        tagScores: scoringResult.tagScores,
        recommendedContentIds: scoringResult.recommendations,
      });
      
      // Update invite status to completed
      await storage.updateAssessmentInviteStatus(invite.id, "completed", new Date());
      
      // Log the patient action
      await logPatientAction(req, invite.patientEmail, 'assessment_submit', {
        resourceType: 'assessment',
        resourceId: invite.assessmentId,
        phiAccessed: true,
        phiScope: 'assessment responses',
        details: { inviteId: invite.id, responseId: response.id },
      });
      
      res.status(201).json({ success: true, responseId: response.id });
    } catch (error) {
      next(error);
    }
  });

  // ====== Assessment Results with Recommendations (Clinician View) ======
  app.get("/api/assessment-invites/:inviteId/results", requireSubscription, async (req, res, next) => {
    try {
      const invite = await storage.getAssessmentInviteById(req.params.inviteId);
      if (!invite) {
        return res.status(404).send("Invite not found");
      }
      
      // Verify clinician owns this invite
      if (invite.clinicianUserId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Access denied");
      }
      
      const response = await storage.getAssessmentResponseByInviteId(invite.id);
      if (!response) {
        return res.status(404).json({ error: "No response yet", status: invite.status });
      }
      
      // Get assessment details
      const assessment = await storage.getAssessmentById(invite.assessmentId);
      
      // Generate recommendations based on tag scores
      let recommendations: any[] = [];
      if (response.tagScores && Array.isArray(response.tagScores) && response.tagScores.length > 0) {
        const result = await generateRecommendations({
          tagScores: response.tagScores,
          assessmentId: invite.assessmentId,
          patientEmail: invite.patientEmail,
          clinicianUserId: req.user!.id,
        });
        recommendations = result.recommendations;
      }
      
      // Log the access
      await logClinicianAction(req, req.user!, 'assessment_access', {
        resourceType: 'assessment',
        resourceId: invite.id,
        phiAccessed: true,
        phiScope: 'assessment results',
        details: { inviteId: invite.id },
      });
      
      res.json({
        invite: {
          id: invite.id,
          patientEmail: invite.patientEmail,
          status: invite.status,
          sentAt: invite.createdAt,
          completedAt: invite.completedAt,
        },
        assessment: assessment ? {
          id: assessment.id,
          name: assessment.name,
        } : null,
        response: {
          id: response.id,
          tagScores: response.tagScores,
          answers: response.answers,
          createdAt: response.createdAt,
        },
        recommendations,
      });
    } catch (error) {
      next(error);
    }
  });

  // ====== Recommendation Rules Routes ======
  app.get("/api/recommendation-rules", requireSubscription, async (req, res, next) => {
    try {
      const rules = await getRecommendationRules();
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recommendation-rules", requireSubscription, async (req, res, next) => {
    try {
      const { tag, minScore, maxScore, contentId, priority, rationale } = req.body;
      
      if (!tag || !contentId) {
        return res.status(400).send("Tag and contentId are required");
      }
      
      const rule = await createRecommendationRule(
        tag,
        minScore ?? 0,
        maxScore ?? 100,
        contentId,
        priority ?? 1,
        rationale
      );
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'create_recommendation_rule', ruleId: rule.id, tag },
      });
      
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/recommendation-rules/:id", requireSubscription, async (req, res, next) => {
    try {
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'delete_recommendation_rule', ruleId: req.params.id },
      });
      
      await deleteRecommendationRule(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint to get recommendations for a set of tag scores
  app.post("/api/recommendations", requireSubscription, async (req, res, next) => {
    try {
      const { tagScores } = req.body;
      
      if (!tagScores || !Array.isArray(tagScores)) {
        return res.status(400).send("tagScores array is required");
      }
      
      const recommendations = await getRecommendationsWithFallback(tagScores);
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  });

  // Preview recommendations for given tag scores (for testing rules)
  app.post("/api/recommendations/preview", requireSubscription, async (req, res, next) => {
    try {
      const { tagScores, assessmentId, pathwayId, pathwayWeek } = req.body;
      
      if (!tagScores || !Array.isArray(tagScores)) {
        return res.status(400).send("tagScores array is required");
      }
      
      const result = await previewRecommendations(tagScores, assessmentId, pathwayId, pathwayWeek);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // ====== Recommendation Config Routes (Advanced Rules) ======
  app.get("/api/recommendation-configs", requireSubscription, async (req, res, next) => {
    try {
      const { assessmentId, pathwayId } = req.query;
      const configs = await getRecommendationConfigs({
        clinicianId: req.user!.id,
        assessmentId: assessmentId as string | undefined,
        pathwayId: pathwayId as string | undefined,
      });
      res.json(configs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recommendation-configs", requireSubscription, async (req, res, next) => {
    try {
      const { 
        name, assessmentId, pathwayId, pathwayWeek, tag, minScore, maxScore, 
        priority, contentIds, rationale, questionName, questionType, matchOperator, matchValues 
      } = req.body;
      
      // For answer-based rules, questionName is required instead of tag
      if (!name || !contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
        return res.status(400).send("name and contentIds are required");
      }
      
      // Either tag (legacy) or questionName (new) must be provided
      if (!tag && !questionName) {
        return res.status(400).send("Either tag or questionName is required");
      }
      
      const config = await createRecommendationConfig({
        clinicianUserId: req.user!.id,
        name,
        assessmentId,
        pathwayId,
        pathwayWeek,
        tag: tag || questionName || '',
        minScore: minScore ?? 0,
        maxScore: maxScore ?? 100,
        priority: priority ?? 1,
        contentIds,
        rationale,
        questionName,
        questionType,
        matchOperator: matchOperator || 'equals',
        matchValues,
      });
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'create_recommendation_config', configId: config.id, name },
      });
      
      res.status(201).json(config);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/recommendation-configs/:id", requireSubscription, async (req, res, next) => {
    try {
      // Only include fields that were explicitly provided (not undefined)
      // This prevents partial updates from wiping existing data
      const updates: Record<string, unknown> = {};
      const fields = [
        'name', 'tag', 'minScore', 'maxScore', 'priority', 'contentIds', 
        'rationale', 'isActive', 'assessmentId', 'questionName', 
        'questionType', 'matchOperator', 'matchValues'
      ];
      
      for (const field of fields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updated = await updateRecommendationConfig(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).send("Recommendation config not found");
      }
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'update_recommendation_config', configId: req.params.id },
      });
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/recommendation-configs/:id", requireSubscription, async (req, res, next) => {
    try {
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'delete_recommendation_config', configId: req.params.id },
      });
      
      await deleteRecommendationConfig(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ====== Patient Recommendations History ======
  app.get("/api/patient-recommendations", requireSubscription, async (req, res, next) => {
    try {
      const { patientEmail, source } = req.query;
      const recs = await storage.getPatientRecommendations({
        clinicianId: req.user!.id,
        patientEmail: patientEmail as string | undefined,
        source: source as string | undefined,
      });
      res.json(recs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/patient-recommendations/:id", requireSubscription, async (req, res, next) => {
    try {
      const rec = await storage.getPatientRecommendationById(req.params.id);
      if (!rec) {
        return res.status(404).send("Recommendation not found");
      }
      res.json(rec);
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
      
      // Audit log: internal screening created (PHI action)
      await logClinicianAction(req, req.user!, 'screening_create', {
        resourceType: 'screening',
        resourceId: screening.id,
        phiAccessed: true,
        phiScope: 'patient name/identifier, screening responses',
        details: { patientName: validated.patientName },
      });
      
      res.status(201).json(screening);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/internal-screenings", requireSubscription, async (req, res, next) => {
    try {
      const screenings = await storage.getInternalScreeningsByClinicianId(req.user!.id);
      
      // Audit log: viewing screenings list (PHI access)
      await logClinicianAction(req, req.user!, 'screening_access', {
        resourceType: 'screening',
        phiAccessed: true,
        phiScope: 'patient identifiers in screening list',
        details: { count: screenings.length },
      });
      
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
      
      // Audit log: email sent to patient (PHI action)
      await logClinicianAction(req, req.user!, 'email_sent', {
        resourceType: 'email_log',
        resourceId: log.id,
        phiAccessed: true,
        phiScope: 'patient email address, content delivery',
        details: { 
          patientEmail: validated.patientEmail, 
          contentCount: validated.contentIds?.length || 0,
          emailSent: emailResult.success,
        },
      });
      
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

  // Resend content to patient with new access code
  app.post("/api/email-logs/:id/resend", requireSubscription, async (req, res, next) => {
    try {
      const clinicianId = req.user!.id;
      
      // Get the original email log
      const originalLog = await storage.getEmailLogById(req.params.id);
      if (!originalLog) {
        return res.status(404).json({ error: "Email log not found" });
      }
      
      // Verify this belongs to the current clinician
      if (originalLog.clinicianUserId !== clinicianId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate new 6-digit access code
      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Determine base URL for patient portal
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'http://localhost:5000';
      
      // Send new email via Gmail
      const emailResult = await sendPatientPortalEmail({
        toEmail: originalLog.patientEmail,
        subject: `[Resent] ${originalLog.subject}`,
        accessCode: accessCode,
        portalUrl: `${baseUrl}/patient-portal`,
        contentCount: originalLog.contentIds?.length || 0,
        providerNote: originalLog.providerNote || undefined,
      });
      
      if (!emailResult.success) {
        return res.status(500).json({ error: emailResult.error || "Failed to send email" });
      }
      
      // Create new email log with the same content but new access code
      const newEmailLog = await storage.createEmailLog({
        clinicianUserId: clinicianId,
        patientEmail: originalLog.patientEmail,
        subject: `[Resent] ${originalLog.subject}`,
        type: originalLog.type,
        contentIds: originalLog.contentIds,
        providerNote: originalLog.providerNote,
        accessCode: accessCode,
        status: "sent",
      });
      
      // Create content view entries for tracking (only for content_bundle type)
      if (originalLog.type === 'content_bundle' && originalLog.contentIds && originalLog.contentIds.length > 0) {
        for (const contentId of originalLog.contentIds) {
          await storage.createContentView({
            emailLogId: newEmailLog.id,
            contentId,
            patientEmail: originalLog.patientEmail,
          });
        }
      }
      
      res.json(newEmailLog);
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

  // ====== Onboarding Routes ======
  app.patch("/api/onboarding", requireAuth, async (req, res, next) => {
    try {
      const { onboardingStep, onboardingCompleted } = req.body;
      
      await storage.updateOnboardingStatus(req.user!.id, {
        onboardingStep,
        onboardingCompleted,
      });
      
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/onboarding/skip", requireAuth, async (req, res, next) => {
    try {
      await storage.updateOnboardingStatus(req.user!.id, {
        onboardingCompleted: true,
      });
      
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  // ====== Email Settings Routes ======
  app.get("/api/email-settings", requireAuth, async (req, res, next) => {
    try {
      const emailConnection = await storage.getEmailConnectionByUserId(req.user!.id);
      res.json({
        emailDeliveryMode: req.user!.emailDeliveryMode || 'central',
        connection: emailConnection ? {
          email: emailConnection.email,
          status: emailConnection.status,
          lastError: emailConnection.lastError,
          provider: emailConnection.provider,
        } : null,
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/email-settings/mode", requireAuth, async (req, res, next) => {
    try {
      const { mode } = req.body;
      if (mode !== 'central' && mode !== 'personal') {
        return res.status(400).json({ error: "Invalid email delivery mode" });
      }

      // If switching to personal, check if connection exists
      if (mode === 'personal') {
        const connection = await storage.getEmailConnectionByUserId(req.user!.id);
        if (!connection) {
          return res.status(400).json({ error: "Please connect your Gmail account first" });
        }
        if (connection.status !== 'active') {
          return res.status(400).json({ error: "Your Gmail connection has an issue. Please reconnect." });
        }
      }

      await storage.updateEmailDeliveryMode(req.user!.id, mode);
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/email-settings/connection", requireAuth, async (req, res, next) => {
    try {
      // Fetch fresh user data to avoid stale session issues
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // If using personal email, switch back to central
      if (currentUser.emailDeliveryMode === 'personal') {
        await storage.updateEmailDeliveryMode(req.user!.id, 'central');
      }
      await storage.deleteEmailConnection(req.user!.id);
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
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
      const normalizedEmail = email.toLowerCase();
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Create new user
      const hashedPassword = await hashPassword(password || "changeme123");
      const periodEnd = subscriptionMonths 
        ? new Date(Date.now() + subscriptionMonths * 30 * 24 * 60 * 60 * 1000)
        : null;
      
      const user = await storage.createUser({
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        password: hashedPassword,
        role: "clinician",
        subscriptionStatus: subscriptionMonths ? "active" : "inactive",
        subscriptionPeriodEnd: periodEnd,
      });
      
      // Audit log: admin created user
      await logClinicianAction(req, req.user!, 'user_create', {
        resourceType: 'user',
        resourceId: user.id,
        details: { targetEmail: email, createdByAdmin: true },
      });
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/create-trial-user", requireAdmin, async (req, res, next) => {
    try {
      const { email, name } = req.body;
      const normalizedEmail = email.toLowerCase();
      
      // Check if user already exists
      let user = await storage.getUserByEmail(normalizedEmail);
      
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
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
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
      
      // Audit log: admin updated user
      await logClinicianAction(req, req.user!, 'user_update', {
        resourceType: 'user',
        resourceId: req.params.id,
        details: { changes: { name, email, role } },
      });
      
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
      
      // Audit log: subscription status changed
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'user',
        resourceId: req.params.id,
        details: { subscriptionStatus, subscriptionPeriodEnd },
      });
      
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
      
      // Audit log: password reset by admin
      await logClinicianAction(req, req.user!, 'password_change', {
        resourceType: 'user',
        resourceId: req.params.id,
        details: { resetByAdmin: true },
      });
      
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      // Audit log: user deletion by admin
      await logClinicianAction(req, req.user!, 'user_delete', {
        resourceType: 'user',
        resourceId: req.params.id,
      });
      
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

  // ====== Admin Recommendation Config Routes ======
  app.get("/api/admin/recommendation-configs", requireAdmin, async (req, res, next) => {
    try {
      const { assessmentId, pathwayId } = req.query;
      const configs = await getRecommendationConfigs({
        assessmentId: assessmentId as string | undefined,
        pathwayId: pathwayId as string | undefined,
      });
      res.json(configs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/recommendation-configs", requireAdmin, async (req, res, next) => {
    try {
      const { 
        name, assessmentId, pathwayId, pathwayWeek, tag, minScore, maxScore, 
        priority, contentIds, rationale, questionName, questionType, matchOperator, matchValues 
      } = req.body;
      
      if (!name || !contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
        return res.status(400).send("name and contentIds are required");
      }
      
      if (!tag && !questionName) {
        return res.status(400).send("Either tag or questionName is required");
      }
      
      const config = await createRecommendationConfig({
        clinicianUserId: undefined,
        name,
        assessmentId,
        pathwayId,
        pathwayWeek,
        tag: tag || questionName || '',
        minScore: minScore ?? 0,
        maxScore: maxScore ?? 100,
        priority: priority ?? 1,
        contentIds,
        rationale,
        questionName,
        questionType,
        matchOperator: matchOperator || 'equals',
        matchValues,
      });
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'create_recommendation_config', configId: config.id },
      });
      
      res.status(201).json(config);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/recommendation-configs/:id", requireAdmin, async (req, res, next) => {
    try {
      const updates: Record<string, unknown> = {};
      const fields = [
        'name', 'tag', 'minScore', 'maxScore', 'priority', 'contentIds', 
        'rationale', 'isActive', 'assessmentId', 'questionName', 
        'questionType', 'matchOperator', 'matchValues'
      ];
      
      for (const field of fields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updated = await updateRecommendationConfig(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).send("Recommendation config not found");
      }
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'update_recommendation_config', configId: req.params.id },
      });
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/recommendation-configs/:id", requireAdmin, async (req, res, next) => {
    try {
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'settings',
        details: { action: 'delete_recommendation_config', configId: req.params.id },
      });
      
      await deleteRecommendationConfig(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ====== Follow-up Rules Routes ======
  app.get("/api/follow-up-rules", requireSubscription, async (req, res, next) => {
    try {
      const customRules = await storage.getFollowUpRulesByClinicianId(req.user!.id);
      const templates = await storage.getTemplateFollowUpRules();
      const userPrefs = await storage.getUserTemplatePreferences(req.user!.id);
      
      const templatesWithStatus = templates.map(t => ({
        ...t,
        isEnabled: userPrefs.find(p => p.templateRuleId === t.id)?.isEnabled ?? false,
      }));
      
      res.json({ custom: customRules, templates: templatesWithStatus });
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

  app.post("/api/follow-up-templates/:id/toggle", requireSubscription, async (req, res, next) => {
    try {
      const { isEnabled } = req.body;
      const pref = await storage.setUserTemplatePreference(req.user!.id, req.params.id, isEnabled);
      res.json(pref);
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

  // ====== Data Inventory Routes (HIPAA Compliance) ======
  app.get("/api/admin/data-inventory", requireAdmin, async (req, res, next) => {
    try {
      const inventory = await storage.getDataInventory();
      res.json(inventory);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/data-inventory", requireAdmin, async (req, res, next) => {
    try {
      const item = await storage.createDataInventoryItem(req.body);
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'user',
        details: { action: 'created_data_inventory_item', itemName: item.dataAssetName },
      });
      
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/data-inventory/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.updateDataInventoryItem(req.params.id, req.body);
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'user',
        details: { action: 'updated_data_inventory_item', itemId: req.params.id },
      });
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/data-inventory/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteDataInventoryItem(req.params.id);
      
      await logClinicianAction(req, req.user!, 'settings_change', {
        resourceType: 'user',
        details: { action: 'deleted_data_inventory_item', itemId: req.params.id },
      });
      
      res.sendStatus(204);
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

  // ====== Feature Flags Routes (Admin Only) ======
  app.get("/api/admin/feature-flags", requireAdmin, async (req, res, next) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/feature-flags/:key", requireAdmin, async (req, res, next) => {
    try {
      const { key } = req.params;
      const { isEnabled, value, payload, name, description, category } = req.body;
      
      // Fetch current state to record in audit log
      const currentFlags = await storage.getFeatureFlags();
      const currentFlag = currentFlags.find(f => f.key === key);
      
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

  app.get("/api/admin/feature-flags/:key/history", requireAdmin, async (req, res, next) => {
    try {
      const { key } = req.params;
      const logs = await storage.getAuditLogs({
        action: 'settings_change',
        limit: 50,
      });
      
      // Filter for feature flag changes for this specific key
      const flagHistory = logs.filter(log => {
        const details = log.details as Record<string, unknown> | null;
        return details?.action === 'updated_feature_flag' && details?.flagKey === key;
      });
      
      res.json(flagHistory);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/feature-flags/history/all", requireAdmin, async (req, res, next) => {
    try {
      const logs = await storage.getAuditLogs({
        action: 'settings_change',
        limit: 100,
      });
      
      // Filter for all feature flag changes
      const flagHistory = logs.filter(log => {
        const details = log.details as Record<string, unknown> | null;
        return details?.action === 'updated_feature_flag';
      });
      
      res.json(flagHistory);
    } catch (error) {
      next(error);
    }
  });

  // Public endpoint for clients to get feature flags (doesn't require admin)
  app.get("/api/feature-flags", requireAuth, async (req, res, next) => {
    try {
      const flags = await storage.getFeatureFlags();
      // Return a simplified object for the frontend
      const flagsMap = flags.reduce((acc, flag) => {
        acc[flag.key] = {
          isEnabled: flag.isEnabled,
          value: flag.value,
        };
        return acc;
      }, {} as Record<string, { isEnabled: boolean; value: string | null }>);
      res.json(flagsMap);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
