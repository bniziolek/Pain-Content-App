/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ExtendSubscriptionInput {
  userId: string;
  days?: number;
}

export async function extendSubscription(
  ctx: AppContext,
  input: ExtendSubscriptionInput
): Promise<User | null> {
  const user = await ctx.storage.getUser(input.userId);
  if (!user) {
    return null;
  }

  const currentEnd = user.subscriptionPeriodEnd || new Date();
  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + (input.days || 30));

  await ctx.storage.updateUserSubscription(input.userId, {
    subscriptionStatus: "active",
    subscriptionPeriodEnd: newEnd,
  });

  return (await ctx.storage.getUser(input.userId)) ?? null;
}
