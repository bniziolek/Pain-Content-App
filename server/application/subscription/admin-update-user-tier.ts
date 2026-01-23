/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface AdminUpdateUserTierInput {
  userId: string;
  tier: string;
}

export async function adminUpdateUserTier(
  ctx: AppContext,
  input: AdminUpdateUserTierInput
): Promise<void> {
  await ctx.storage.updateSubscriptionTier(input.userId, input.tier);
}
