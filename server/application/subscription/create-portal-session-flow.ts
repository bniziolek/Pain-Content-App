/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CreatePortalSessionFlowInput {
  user: User;
  returnUrl?: string;
}

export interface CreatePortalSessionFlowResult {
  url: string;
}

export async function createPortalSessionFlow(
  ctx: AppContext,
  input: CreatePortalSessionFlowInput
): Promise<CreatePortalSessionFlowResult> {
  if (!ctx.payment) {
    throw new Error("Stripe not configured");
  }

  if (!input.user.stripeCustomerId) {
    throw new Error("No subscription found");
  }
  const session = await ctx.payment.createPortalSession({
    customerId: input.user.stripeCustomerId,
    returnUrl: input.returnUrl || `${process.env.APP_URL}/settings`,
  });

  return { url: session.url };
}
