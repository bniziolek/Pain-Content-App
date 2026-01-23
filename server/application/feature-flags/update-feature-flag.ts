/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User, FeatureFlag } from "@shared/schema";

export interface UpdateFeatureFlagInput {
  admin: User;
  key: string;
  isEnabled: boolean;
}

export async function updateFeatureFlag(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: UpdateFeatureFlagInput
): Promise<FeatureFlag | null> {
  const flag = await ctx.storage.getFeatureFlagByKey(input.key);
  if (!flag) {
    return null;
  }
  
  const updated = await ctx.storage.updateFeatureFlag(input.key, { isEnabled: input.isEnabled });
  
  await ctx.audit.logClinicianAction(auditContext, input.admin, 'feature_flag_update', {
    details: { key: input.key, isEnabled: input.isEnabled },
  });
  
  return updated ?? null;
}
