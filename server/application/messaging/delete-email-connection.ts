/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface DeleteEmailConnectionInput {
  clinician: User;
}

export async function deleteEmailConnection(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: DeleteEmailConnectionInput
): Promise<void> {
  await ctx.storage.deleteEmailConnection(input.clinician.id);
  await ctx.audit.logClinicianAction(auditContext, input.clinician, 'settings_change', {
    details: { setting: 'emailConnection', action: 'deleted' },
  });
}
