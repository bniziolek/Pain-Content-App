import type { Express, NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { logPatientAction } from "../audit";
import { getContentByIdFromContentful, isContentfulConfigured } from "../contentful";
import {
  checkLockoutStatus,
  calculateLockoutUpdate,
  verifyEmailMatch,
  createSuccessLockoutReset,
  calculateSessionExpiry,
} from "../domain/patient";

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
      
      // Check lockout status using domain service
      const lockoutState = {
        failedAttempts: emailLog.failedAttempts || 0,
        lockedUntil: emailLog.lockedUntil,
        permanentlyLocked: emailLog.permanentlyLocked || false,
      };
      
      const lockoutCheck = checkLockoutStatus(lockoutState);
      if (lockoutCheck.isLocked) {
        const statusCode = lockoutCheck.lockType === 'permanent' ? 403 : 403;
        return res.status(statusCode).json({ 
          error: lockoutCheck.message,
          ...(lockoutCheck.lockType === 'permanent' && { permanentlyLocked: true }),
          ...(lockoutCheck.lockType === 'temporary' && { 
            lockedUntil: lockoutState.lockedUntil,
            minutesRemaining: lockoutCheck.minutesRemaining,
          }),
        });
      }
      
      // Verify email matches using domain service
      if (!verifyEmailMatch(emailLog.patientEmail, email)) {
        const lockoutResult = calculateLockoutUpdate(lockoutState.failedAttempts);
        await storage.updateEmailLogLockout(emailLog.id, lockoutResult.lockoutUpdate);
        
        const { statusCode, ...responseBody } = lockoutResult.response;
        return res.status(statusCode).json(responseBody);
      }
      
      // Success! Reset failed attempts using domain service
      if (lockoutState.failedAttempts > 0) {
        await storage.updateEmailLogLockout(emailLog.id, createSuccessLockoutReset());
      }
      
      // Generate a secure session token (UUID) 
      const sessionToken = crypto.randomUUID();
      const expiresAt = calculateSessionExpiry();
      
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
