/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface StripeConfig {
  publishableKey?: string;
}

export async function getStripeConfig(ctx: AppContext): Promise<StripeConfig> {
  if (!ctx.payment) {
    return { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY };
  }
  const publishableKey = await ctx.payment.getPublishableKey();
  return {
    publishableKey,
  };
}
