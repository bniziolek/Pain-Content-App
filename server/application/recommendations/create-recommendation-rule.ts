/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { ContentRecommendation, InsertContentRecommendation, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface CreateRecommendationRuleInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: InsertContentRecommendation;
}

export async function createRecommendationRule(
  ctx: AppContext,
  input: CreateRecommendationRuleInput
): Promise<ContentRecommendation> {
  const rule = await ctx.storage.createContentRecommendation(input.data);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'settings_change', {
    resourceType: 'settings',
    details: { action: 'create_recommendation_rule', ruleId: rule.id, tag: rule.tag },
  });

  return rule;
}
