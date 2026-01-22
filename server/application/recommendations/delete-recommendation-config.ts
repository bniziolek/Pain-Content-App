/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface DeleteRecommendationConfigInput {
  auditContext: AuditRequestContext;
  clinician: User;
  configId: string;
}

export async function deleteRecommendationConfig(
  ctx: AppContext,
  input: DeleteRecommendationConfigInput
): Promise<void> {
  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'settings_change', {
    resourceType: 'settings',
    details: { action: 'delete_recommendation_config', configId: input.configId },
  });

  await ctx.storage.deleteRecommendationConfig(input.configId);
}
