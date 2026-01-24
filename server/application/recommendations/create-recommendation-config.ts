/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { RecommendationConfig, InsertRecommendationConfig, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface CreateRecommendationConfigInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: InsertRecommendationConfig;
}

export async function createRecommendationConfig(
  ctx: AppContext,
  input: CreateRecommendationConfigInput
): Promise<RecommendationConfig> {
  const config = await ctx.storage.createRecommendationConfig(input.data);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'settings_change', {
    resourceType: 'settings',
    details: { action: 'create_recommendation_config', configId: config.id, name: config.name },
  });

  return config;
}
