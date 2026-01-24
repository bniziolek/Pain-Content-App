/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface AdminUpdateUserSubscriptionInput {
  userId: string;
  status: string;
  periodEnd?: Date;
}

export async function adminUpdateUserSubscription(
  ctx: AppContext,
  input: AdminUpdateUserSubscriptionInput
): Promise<void> {
  await ctx.storage.updateUserSubscription(input.userId, {
    subscriptionStatus: input.status,
    subscriptionPeriodEnd: input.periodEnd,
  });
}
