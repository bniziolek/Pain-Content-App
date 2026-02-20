/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ChangeSubscriptionTierInput {
  user: User;
  newTier: string;
}

export async function changeSubscriptionTier(
  ctx: AppContext,
  input: ChangeSubscriptionTierInput
): Promise<void> {
  await ctx.storage.updateSubscriptionTier(input.user.id, input.newTier);
}
