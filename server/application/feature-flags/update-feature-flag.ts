import type { Request } from "express";
import type { AppContext } from "../context";
import type { User, FeatureFlag } from "@shared/schema";

export interface UpdateFeatureFlagInput {
  admin: User;
  key: string;
  isEnabled: boolean;
}

export async function updateFeatureFlag(
  ctx: AppContext,
  req: Request,
  input: UpdateFeatureFlagInput
): Promise<FeatureFlag | null> {
  const flag = await ctx.storage.getFeatureFlagByKey(input.key);
  if (!flag) {
    return null;
  }
  
  const updated = await ctx.storage.updateFeatureFlag(input.key, { isEnabled: input.isEnabled });
  
  await ctx.audit.logClinicianAction(req, input.admin, 'feature_flag_update', {
    details: { key: input.key, isEnabled: input.isEnabled },
  });
  
  return updated ?? null;
}
