/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CancelSubscriptionInput {
  user: User;
}

export async function cancelSubscription(
  ctx: AppContext,
  input: CancelSubscriptionInput
): Promise<void> {
  if (!ctx.payment) {
    throw new Error("Stripe not configured");
  }

  if (!input.user.stripeSubscriptionId) {
    throw new Error("No active subscription");
  }

  await ctx.payment.cancelSubscription({
    subscriptionId: input.user.stripeSubscriptionId,
    cancelAtPeriodEnd: true,
  });
}
