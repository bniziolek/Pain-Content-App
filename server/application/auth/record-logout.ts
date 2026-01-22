/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface RecordLogoutInput {
  user: User;
}

export async function recordLogout(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: RecordLogoutInput
): Promise<void> {
  await ctx.audit.logClinicianAction(auditContext, input.user, "logout", {});
}
