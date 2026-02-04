/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User, SubscriptionTier } from "@shared/schema";

export interface UpgradeSubscriptionInput {
  user: User;
  newPriceId: string;
  newTier: SubscriptionTier;
}

export interface UpgradeSubscriptionResult {
  success: boolean;
  newTier: SubscriptionTier;
}

export async function upgradeSubscription(
  ctx: AppContext,
  input: UpgradeSubscriptionInput
): Promise<UpgradeSubscriptionResult> {
  if (!ctx.payment) {
    throw new Error("Stripe not configured");
  }

  if (!input.user.stripeSubscriptionId) {
    throw new Error("No active subscription to upgrade");
  }

  // Update the subscription in Stripe with the new price
  await ctx.payment.updateSubscription({
    subscriptionId: input.user.stripeSubscriptionId,
    newPriceId: input.newPriceId,
  });

  // Update the user's tier in the database immediately
  // The webhook will also confirm this, but we update now for immediate UI feedback
  await ctx.storage.updateSubscriptionTier(input.user.id, input.newTier);

  console.log(`Upgraded user ${input.user.id} to ${input.newTier} with price ${input.newPriceId}`);

  return {
    success: true,
    newTier: input.newTier,
  };
}
