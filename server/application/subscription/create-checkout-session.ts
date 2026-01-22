import type { Request } from "express";
import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CreateCheckoutSessionInput {
  user: User;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResult {
  sessionUrl: string;
}

export async function createCheckoutSession(
  ctx: AppContext,
  req: Request,
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  if (!ctx.payment) {
    throw new Error("Payment service not configured");
  }
  
  const session = await ctx.payment.createCheckoutSession({
    userId: input.user.id,
    priceId: input.priceId,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  });
  
  await ctx.audit.logClinicianAction(req, input.user, 'subscription_checkout', {
    details: { priceId: input.priceId },
  });
  
  return { sessionUrl: session.url };
}
