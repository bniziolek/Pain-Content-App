/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface AccessibleFeatureFlags {
  [key: string]: { isEnabled: boolean; value: string | null };
}

export interface ListAccessibleFeatureFlagsInput {
  user: User;
}

export async function listAccessibleFeatureFlags(
  ctx: AppContext,
  input: ListAccessibleFeatureFlagsInput
): Promise<AccessibleFeatureFlags> {
  const flags = await ctx.storage.getFeatureFlags();
  const userTier = input.user.subscriptionTier || "basic";

  const accessibleFlags = flags.filter((flag) => {
    if (!flag.tiersAllowed || flag.tiersAllowed.length === 0) return true;
    return flag.tiersAllowed.includes(userTier);
  });

  return accessibleFlags.reduce((acc, flag) => {
    acc[flag.key] = {
      isEnabled: flag.isEnabled,
      value: flag.value,
    };
    return acc;
  }, {} as AccessibleFeatureFlags);
}
