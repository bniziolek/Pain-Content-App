/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ExtendSubscriptionInput {
  userId: string;
  /** Number of calendar months to add to the subscription end date. */
  months?: number;
  /** Number of days to add to the subscription end date (applied after months). */
  days?: number;
}

/**
 * Maximum safe subscription end date. PostgreSQL supports timestamps beyond year 9999,
 * but JS Date arithmetic becomes unreliable past this point. We cap here to prevent
 * "time zone displacement out of range" errors from overflowed or miscalculated timestamps.
 */
const MAX_SUBSCRIPTION_DATE = new Date("9999-12-31T23:59:59Z");

export async function extendSubscription(
  ctx: AppContext,
  input: ExtendSubscriptionInput
): Promise<User | null> {
  const user = await ctx.storage.getUser(input.userId);
  if (!user) {
    return null;
  }

  // Start from the current subscription end, or now if none is set.
  const base = user.subscriptionPeriodEnd
    ? new Date(user.subscriptionPeriodEnd)
    : new Date();

  const newEnd = new Date(base);

  if (input.months) {
    newEnd.setMonth(newEnd.getMonth() + input.months);
  }

  if (input.days) {
    newEnd.setDate(newEnd.getDate() + input.days);
  }

  // Default to 30 days if neither months nor days was provided.
  if (!input.months && !input.days) {
    newEnd.setDate(newEnd.getDate() + 30);
  }

  // Guard against NaN or out-of-range dates (e.g. from setMonth overflow on edge dates).
  const safeEnd =
    isNaN(newEnd.getTime()) || newEnd > MAX_SUBSCRIPTION_DATE
      ? MAX_SUBSCRIPTION_DATE
      : newEnd;

  await ctx.storage.updateUserSubscription(input.userId, {
    subscriptionStatus: "active",
    subscriptionPeriodEnd: safeEnd,
  });

  return (await ctx.storage.getUser(input.userId)) ?? null;
}
