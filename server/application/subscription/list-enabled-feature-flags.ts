/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { FeatureFlag } from "@shared/schema";

export async function listEnabledFeatureFlags(ctx: AppContext): Promise<FeatureFlag[]> {
  const flags = await ctx.storage.getFeatureFlags();
  return flags.filter((flag) => flag.isEnabled);
}
