/**
 * Architecture: Application service layer. Lists all user subscriptions with filtering.
 */

import type { AppContext } from "../context";
import { eq, and, gte, lte, sql, or, like } from "drizzle-orm";
import { users } from "@shared/schema";

export interface ListSubscriptionsInput {
  status?: "active" | "inactive" | "past_due" | "canceled" | "trial";
  tier?: "free" | "basic" | "pro" | "enterprise";
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export interface SubscriptionListItem {
  userId: string;
  email: string;
  name: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  subscriptionPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  lastLogin: Date | null;
}

export async function listSubscriptions(
  ctx: AppContext,
  input: ListSubscriptionsInput
): Promise<SubscriptionListItem[]> {
  const conditions = [];

  // Filter by status
  if (input.status) {
    if (input.status === "trial") {
      // Trial users have active status and period end within next 14 days
      conditions.push(
        and(
          eq(users.subscriptionStatus, "active"),
          lte(users.subscriptionPeriodEnd, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
        )
      );
    } else {
      conditions.push(eq(users.subscriptionStatus, input.status));
    }
  }

  // Filter by tier
  if (input.tier) {
    conditions.push(eq(users.subscriptionTier, input.tier));
  }

  // Filter by date range (subscription period end)
  if (input.startDate) {
    conditions.push(gte(users.subscriptionPeriodEnd, input.startDate));
  }
  if (input.endDate) {
    conditions.push(lte(users.subscriptionPeriodEnd, input.endDate));
  }

  // Filter by search query (email or name)
  if (input.searchQuery && input.searchQuery.trim()) {
    const searchPattern = `%${input.searchQuery.trim()}%`;
    conditions.push(
      or(
        like(users.email, searchPattern),
        like(users.name, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await ctx.db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionTier: users.subscriptionTier,
      subscriptionPeriodEnd: users.subscriptionPeriodEnd,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin,
    })
    .from(users)
    .where(whereClause)
    .orderBy(users.subscriptionPeriodEnd);

  return results;
}
