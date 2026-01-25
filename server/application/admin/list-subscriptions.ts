/**
 * Architecture: Application service layer. Lists all user subscriptions with filtering.
 */

import type { AppContext } from "../context";

// Configuration constants
const TRIAL_ENDING_SOON_DAYS = 14;

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
  // Get all users from storage
  let users = await ctx.storage.getAllUsers();

  // Apply filters in memory
  if (input.status) {
    if (input.status === "trial") {
      // Trial users have active status and period end within next TRIAL_ENDING_SOON_DAYS
      const trialEndDate = new Date(Date.now() + TRIAL_ENDING_SOON_DAYS * 24 * 60 * 60 * 1000);
      users = users.filter(u => 
        u.subscriptionStatus === "active" && 
        u.subscriptionPeriodEnd && 
        u.subscriptionPeriodEnd <= trialEndDate
      );
    } else {
      users = users.filter(u => u.subscriptionStatus === input.status);
    }
  }

  if (input.tier) {
    users = users.filter(u => u.subscriptionTier === input.tier);
  }

  if (input.startDate) {
    users = users.filter(u => u.subscriptionPeriodEnd && u.subscriptionPeriodEnd >= input.startDate!);
  }

  if (input.endDate) {
    users = users.filter(u => u.subscriptionPeriodEnd && u.subscriptionPeriodEnd <= input.endDate!);
  }

  if (input.searchQuery && input.searchQuery.trim()) {
    const searchLower = input.searchQuery.trim().toLowerCase();
    users = users.filter(u => 
      u.email.toLowerCase().includes(searchLower) ||
      (u.name && u.name.toLowerCase().includes(searchLower))
    );
  }

  // Map to SubscriptionListItem format and sort
  const results: SubscriptionListItem[] = users.map(u => ({
    userId: u.id,
    email: u.email,
    name: u.name,
    subscriptionStatus: u.subscriptionStatus,
    subscriptionTier: u.subscriptionTier,
    subscriptionPeriodEnd: u.subscriptionPeriodEnd,
    stripeCustomerId: u.stripeCustomerId,
    stripeSubscriptionId: u.stripeSubscriptionId,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  }));

  // Sort by subscription period end
  results.sort((a, b) => {
    if (!a.subscriptionPeriodEnd) return 1;
    if (!b.subscriptionPeriodEnd) return -1;
    return a.subscriptionPeriodEnd.getTime() - b.subscriptionPeriodEnd.getTime();
  });

  return results;
}
