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
  baseUrl?: string;
}

export interface CreateCheckoutSessionFlowResult {
  sessionId: string;
  url: string | null;
}

function getBaseUrl(inputBaseUrl?: string): string {
  if (inputBaseUrl) return inputBaseUrl;
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  return "https://localhost:5000";
}

export async function createCheckoutSessionFlow(
  ctx: AppContext,
  input: CreateCheckoutSessionFlowInput
): Promise<CreateCheckoutSessionFlowResult> {
  if (!ctx.payment) {
    throw new Error("Stripe not configured");
  }

  const baseUrl = getBaseUrl(input.baseUrl);
  const successUrl = input.successUrl || `${baseUrl}/dashboard?subscription=success`;
  const cancelUrl = input.cancelUrl || `${baseUrl}/subscription?canceled=true`;
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
