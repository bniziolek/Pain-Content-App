import type { Express, NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { logPatientAction } from "../audit";
import { getContentByIdFromContentful, isContentfulConfigured } from "../contentful";

type FeatureFlagMiddleware = (flagKey: string) => (req: Request, res: Response, next: NextFunction) => void;

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "unknown";
}

export function registerPatientPortalRoutes(app: Express, requireFeatureFlag: FeatureFlagMiddleware) {
  app.post("/api/patient-portal/auth", requireFeatureFlag("patient_portal_enabled"), async (req, res, next) => {
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
        await logPatientAction(req, email.toLowerCase(), "patient_portal_auth_failed", {
          details: { reason: "invalid_code" },
          outcome: "failure",
        });
        return res.status(401).json({ 
          error: "Invalid email or access code",
          attemptsRemaining: null,
        });
      }
      
      // Check if permanently locked
      if (emailLog.permanentlyLocked) {
        return res.status(403).json({ 
          error: "This access code has been permanently locked due to too many failed attempts. Please contact your healthcare provider to request new access.",
          permanentlyLocked: true,
        });
      }
      
      // Check if temporarily locked
      const now = new Date();
      if (emailLog.lockedUntil && emailLog.lockedUntil > now) {
        const minutesRemaining = Math.ceil((emailLog.lockedUntil.getTime() - now.getTime()) / 60000);
        return res.status(403).json({ 
          error: `Too many failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}.`,
          lockedUntil: emailLog.lockedUntil,
          minutesRemaining,
        });
      }
      
      // Verify email matches (case-insensitive)
      if (emailLog.patientEmail.toLowerCase() !== email.toLowerCase()) {
        // Increment failed attempts
        const newAttempts = (emailLog.failedAttempts || 0) + 1;
        let lockoutUpdate: { failedAttempts: number; lockedUntil?: Date | null; permanentlyLocked?: boolean } = { 
          failedAttempts: newAttempts,
        };
        
        // Determine lockout tier
        if (newAttempts >= 9) {
          // Permanent lockout after 9 attempts
          lockoutUpdate.permanentlyLocked = true;
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(403).json({ 
            error: "This access code has been permanently locked due to too many failed attempts. Please contact your healthcare provider to request new access.",
            permanentlyLocked: true,
          });
        } else if (newAttempts >= 6) {
          // 1 hour lockout after 6 attempts
          lockoutUpdate.lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(401).json({ 
            error: "Invalid email or access code. You have been locked out for 1 hour. 3 more failed attempts will permanently lock this access code.",
            attemptsRemaining: 9 - newAttempts,
            lockedFor: 60,
          });
        } else if (newAttempts >= 3) {
          // 5 minute lockout after 3 attempts
          lockoutUpdate.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(401).json({ 
            error: "Invalid email or access code. You have been locked out for 5 minutes. 3 more failed attempts will result in a 1-hour lockout.",
            attemptsRemaining: 6 - newAttempts,
            lockedFor: 5,
          });
        } else {
          // Just increment attempts, warn user
          await storage.updateEmailLogLockout(emailLog.id, lockoutUpdate);
          return res.status(401).json({ 
            error: "Invalid email or access code.",
            attemptsRemaining: 3 - newAttempts,
            warning: newAttempts === 2 ? "Warning: 1 more failed attempt will result in a 5-minute lockout." : undefined,
          });
        }
      }
      
      // Success! Reset failed attempts
      if ((emailLog.failedAttempts || 0) > 0) {
        await storage.updateEmailLogLockout(emailLog.id, { 
          failedAttempts: 0, 
          lockedUntil: null,
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
        userAgent: req.headers["user-agent"] || "unknown",
        expiresAt,
      });
      
      // Audit log: successful patient portal login
      await logPatientAction(req, email.toLowerCase(), "patient_portal_auth", {
        resourceType: "session",
        resourceId: emailLog.id,
        phiAccessed: true,
        phiScope: "patient email, session created",
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

  app.get("/api/patient-portal/content", requireFeatureFlag("patient_portal_enabled"), async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
      await logPatientAction(req, session.patientEmail, "content_view", {
        resourceType: "content",
        phiAccessed: true,
        phiScope: "patient educational content",
        sessionId: sessionToken,
      });
      
      res.json({
        content: Object.values(contentMap),
        assessments: assessmentInvites.map((invite) => ({
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
}
