/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";

export interface RecordLoginFailureInput {
  email?: string;
  reason?: string;
}

export async function recordLoginFailure(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: RecordLoginFailureInput
): Promise<void> {
  await ctx.audit.logAuditEvent(auditContext, {
    actorType: "clinician",
    actorEmail: input.email,
    action: "login_failed",
    details: { reason: input.reason || "invalid_credentials" },
    outcome: "failure",
  });

  if (!input.email) {
    return;
  }

  const existingUser = await ctx.storage.getUserByEmail(input.email.toLowerCase());
  if (!existingUser) {
    return;
  }

  try {
    await ctx.storage.createLoginHistory({
      userId: existingUser.id,
      ipAddress: auditContext.ipAddress || "unknown",
      userAgent: auditContext.userAgent || "unknown",
      outcome: "failure",
      failureReason: input.reason || "invalid_credentials",
    });
  } catch (error) {
    console.error("Failed to log login history:", error);
  }
}
