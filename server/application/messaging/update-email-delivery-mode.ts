/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface UpdateEmailDeliveryModeInput {
  clinician: User;
  mode: "central" | "personal";
}

export async function updateEmailDeliveryMode(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: UpdateEmailDeliveryModeInput
): Promise<void> {
  await ctx.storage.updateEmailDeliveryMode(input.clinician.id, input.mode);
  
  await ctx.audit.logClinicianAction(auditContext, input.clinician, 'settings_change', {
    details: { setting: 'emailDeliveryMode', newValue: input.mode },
  });
}
