/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ResumeSubscriptionInput {
  user: User;
}

export async function resumeSubscription(
  ctx: AppContext,
  input: ResumeSubscriptionInput
): Promise<void> {
  if (!ctx.payment) {
    throw new Error("Stripe not configured");
  }

  if (!input.user.stripeSubscriptionId) {
    throw new Error("No active subscription");
  }

  await ctx.payment.resumeSubscription({
    subscriptionId: input.user.stripeSubscriptionId,
  });
}
