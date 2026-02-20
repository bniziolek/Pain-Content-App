/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface ClearPersonaInput {
  admin: User;
}

export async function clearPersona(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: ClearPersonaInput
): Promise<void> {
  await ctx.storage.clearPersona(input.admin.id);

  await ctx.audit.logClinicianAction(auditContext, input.admin, "settings_change", {
    resourceType: "user",
    resourceId: input.admin.id,
    details: { action: "persona_clear" },
    outcome: "success",
  });
}
