/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface UpdateUserSubscriptionInput {
  userId: string;
  updates: {
    subscriptionStatus?: string;
    subscriptionTier?: string;
    subscriptionPeriodEnd?: Date;
  };
}

export async function updateUserSubscription(
  ctx: AppContext,
  input: UpdateUserSubscriptionInput
): Promise<User | null> {
  await ctx.storage.updateUserSubscription(input.userId, input.updates);
  return (await ctx.storage.getUser(input.userId)) ?? null;
}
