/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface DeleteRecommendationRuleInput {
  auditContext: AuditRequestContext;
  clinician: User;
  ruleId: string;
}

export async function deleteRecommendationRule(
  ctx: AppContext,
  input: DeleteRecommendationRuleInput
): Promise<void> {
  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'settings_change', {
    resourceType: 'settings',
    details: { action: 'delete_recommendation_rule', ruleId: input.ruleId },
  });

  await ctx.storage.deleteContentRecommendation(input.ruleId);
}
