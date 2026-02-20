/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface CreateCheckoutSessionInput {
  user: User;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResult {
  sessionUrl: string | null;
}

export async function createCheckoutSession(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  if (!ctx.payment) {
    throw new Error("Payment service not configured");
  }
  
  const session = await ctx.payment.createCheckoutSession({
    userId: input.user.id,
    userEmail: input.user.email,
    customerId: input.user.stripeCustomerId,
    priceId: input.priceId,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  });

  if (!input.user.stripeCustomerId) {
    await ctx.storage.updateUserSubscription(input.user.id, { stripeCustomerId: session.customerId });
  }
  
  await ctx.audit.logClinicianAction(auditContext, input.user, 'subscription_checkout', {
    details: { priceId: input.priceId },
  });
  
  return { sessionUrl: session.url };
}
