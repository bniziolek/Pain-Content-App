/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface GetSubscriptionOverviewInput {
  user: User;
}

export interface SubscriptionOverview {
  status: string | null;
  tier: string | null;
  periodEnd: Date | null;
  stripeCustomerId: string | null;
}

export async function getSubscriptionOverview(
  _ctx: AppContext,
  input: GetSubscriptionOverviewInput
): Promise<SubscriptionOverview> {
  const user = input.user;
  return {
    status: user.subscriptionStatus ?? null,
    tier: user.subscriptionTier ?? null,
    periodEnd: user.subscriptionPeriodEnd ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
  };
}
