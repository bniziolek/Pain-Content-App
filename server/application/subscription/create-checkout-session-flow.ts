/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CreateCheckoutSessionFlowInput {
  user: User;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutSessionFlowResult {
  sessionId: string;
  url: string | null;
}

export async function createCheckoutSessionFlow(
  ctx: AppContext,
  input: CreateCheckoutSessionFlowInput
): Promise<CreateCheckoutSessionFlowResult> {
  if (!ctx.payment) {
    throw new Error("Stripe not configured");
  }

  const successUrl = input.successUrl || `${process.env.APP_URL}/settings?success=true`;
  const cancelUrl = input.cancelUrl || `${process.env.APP_URL}/settings?canceled=true`;
  const session = await ctx.payment.createCheckoutSession({
    userId: input.user.id,
    userEmail: input.user.email,
    customerId: input.user.stripeCustomerId,
    priceId: input.priceId,
    successUrl,
    cancelUrl,
  });

  if (!input.user.stripeCustomerId) {
    await ctx.storage.updateUserSubscription(input.user.id, { stripeCustomerId: session.customerId });
  }

  return { sessionId: session.sessionId, url: session.url };
}
