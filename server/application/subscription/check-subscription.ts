import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CheckSubscriptionInput {
  user: User;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: string | null;
  expiresAt: Date | null;
}

export async function checkSubscription(
  ctx: AppContext,
  input: CheckSubscriptionInput
): Promise<SubscriptionStatus> {
  const { user } = input;
  
  const isActive = user.subscriptionStatus === 'active' || 
                   user.subscriptionStatus === 'trialing';
  
  return {
    isActive,
    tier: user.subscriptionTier,
    expiresAt: user.subscriptionPeriodEnd,
  };
}
