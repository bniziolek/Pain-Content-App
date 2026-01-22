import type { Request } from "express";
import crypto from "crypto";
import type { AppContext } from "../context";
import { AppError } from "../errors";
import {
  calculateLockoutUpdate,
  calculateSessionExpiry,
  checkLockoutStatus,
  createSuccessLockoutReset,
  verifyEmailMatch,
} from "../../domain/patient";

export interface AuthenticatePatientInput {
  email: string;
  accessCode: string;
}

export interface AuthenticatePatientResult {
  sessionToken: string;
  patientEmail: string;
}

export async function authenticatePatient(
  ctx: AppContext,
  req: Request,
  input: AuthenticatePatientInput
): Promise<AuthenticatePatientResult> {
  if (!input.email || !input.accessCode) {
    throw new AppError(400, "Email and access code are required", {
      error: "Email and access code are required",
    });
  }

  const normalizedEmail = input.email.toLowerCase();
  const emailLog = await ctx.storage.getEmailLogByAccessCode(input.accessCode);

  if (!emailLog) {
    await ctx.audit.logPatientAction(req, normalizedEmail, "patient_portal_auth_failed", {
      details: { reason: "invalid_code" },
      outcome: "failure",
    });
    throw new AppError(401, "Invalid email or access code", {
      error: "Invalid email or access code",
      attemptsRemaining: null,
    });
  }

  const lockoutState = {
    failedAttempts: emailLog.failedAttempts || 0,
    lockedUntil: emailLog.lockedUntil,
    permanentlyLocked: emailLog.permanentlyLocked || false,
  };

  const lockoutCheck = checkLockoutStatus(lockoutState);
  if (lockoutCheck.isLocked) {
    throw new AppError(403, lockoutCheck.message || "Access code locked", {
      error: lockoutCheck.message || "Access code locked",
      ...(lockoutCheck.lockType === "permanent" && { permanentlyLocked: true }),
      ...(lockoutCheck.lockType === "temporary" && {
        lockedUntil: lockoutState.lockedUntil,
        minutesRemaining: lockoutCheck.minutesRemaining,
      }),
    });
  }

  if (!verifyEmailMatch(emailLog.patientEmail, normalizedEmail)) {
    const lockoutResult = calculateLockoutUpdate(lockoutState.failedAttempts);
    await ctx.storage.updateEmailLogLockout(emailLog.id, lockoutResult.lockoutUpdate);

    throw new AppError(lockoutResult.response.statusCode, lockoutResult.response.error, {
      error: lockoutResult.response.error,
      attemptsRemaining: lockoutResult.response.attemptsRemaining,
      lockedFor: lockoutResult.response.lockedFor,
      permanentlyLocked: lockoutResult.response.permanentlyLocked,
      warning: lockoutResult.response.warning,
    });
  }

  if (lockoutState.failedAttempts > 0) {
    await ctx.storage.updateEmailLogLockout(emailLog.id, createSuccessLockoutReset());
  }

  const sessionToken = crypto.randomUUID();
  const expiresAt = calculateSessionExpiry();

  await ctx.storage.createPatientSession({
    token: sessionToken,
    patientEmail: normalizedEmail,
    emailLogId: emailLog.id,
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"] || "unknown",
    expiresAt,
  });

  await ctx.audit.logPatientAction(req, normalizedEmail, "patient_portal_auth", {
    resourceType: "session",
    resourceId: emailLog.id,
    phiAccessed: true,
    phiScope: "patient email, session created",
    sessionId: sessionToken,
  });

  return { sessionToken, patientEmail: normalizedEmail };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "unknown";
}
