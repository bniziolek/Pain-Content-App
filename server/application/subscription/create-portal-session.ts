import type { Request } from "express";
import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CreatePortalSessionInput {
  user: User;
  returnUrl: string;
}

export interface CreatePortalSessionResult {
  portalUrl: string;
}

export async function createPortalSession(
  ctx: AppContext,
  req: Request,
  input: CreatePortalSessionInput
): Promise<CreatePortalSessionResult> {
  if (!ctx.payment) {
    throw new Error("Payment service not configured");
  }
  
  if (!input.user.stripeCustomerId) {
    throw new Error("No Stripe customer ID found for user");
  }
  
  const session = await ctx.payment.createPortalSession({
    customerId: input.user.stripeCustomerId,
    returnUrl: input.returnUrl,
  });
  
  await ctx.audit.logClinicianAction(req, input.user, 'subscription_portal', {
    details: {},
  });
  
  return { portalUrl: session.url };
}
