/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface SwitchPersonaInput {
  admin: User;
  toPersona: "clinician" | "admin";
}

export async function switchPersona(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: SwitchPersonaInput
): Promise<unknown> {
  const ipAddress = auditContext.ipAddress || "unknown";
  const userAgent = auditContext.userAgent || "unknown";

  const switchLog = await ctx.storage.switchPersona(input.admin.id, input.toPersona, ipAddress, userAgent);

  await ctx.audit.logClinicianAction(auditContext, input.admin, "settings_change", {
    resourceType: "user",
    resourceId: input.admin.id,
    details: { action: "persona_switch", toPersona: input.toPersona },
    outcome: "success",
  });

  return switchLog;
}
