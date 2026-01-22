/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { RecommendationConfig, InsertRecommendationConfig, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface UpdateRecommendationConfigInput {
  auditContext: AuditRequestContext;
  clinician: User;
  configId: string;
  updates: Partial<InsertRecommendationConfig> & { isActive?: boolean };
}

export async function updateRecommendationConfig(
  ctx: AppContext,
  input: UpdateRecommendationConfigInput
): Promise<RecommendationConfig | null> {
  const config = await ctx.storage.updateRecommendationConfig(input.configId, input.updates);
  if (!config) {
    return null;
  }

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'settings_change', {
    resourceType: 'settings',
    details: { action: 'update_recommendation_config', configId: input.configId },
  });

  return config;
}
