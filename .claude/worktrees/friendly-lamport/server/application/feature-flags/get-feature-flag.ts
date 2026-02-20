/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { FeatureFlag } from "@shared/schema";

export interface GetFeatureFlagInput {
  key: string;
}

export async function getFeatureFlag(
  ctx: AppContext,
  input: GetFeatureFlagInput
): Promise<FeatureFlag | null> {
  const flag = await ctx.storage.getFeatureFlagByKey(input.key);
  return flag ?? null;
}
