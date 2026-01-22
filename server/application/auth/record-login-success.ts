/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface RecordLoginSuccessInput {
  user: User;
}

export async function recordLoginSuccess(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: RecordLoginSuccessInput
): Promise<void> {
  await ctx.storage.updateLastLogin(input.user.id);

  await ctx.audit.logClinicianAction(auditContext, input.user, "login", {
    details: { method: "password" },
  });

  try {
    await ctx.storage.createLoginHistory({
      userId: input.user.id,
      ipAddress: auditContext.ipAddress || "unknown",
      userAgent: auditContext.userAgent || "unknown",
      outcome: "success",
    });
  } catch (error) {
    console.error("Failed to log login history:", error);
  }
}
