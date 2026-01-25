/**
 * Architecture: Application service layer. Cancels a user's subscription (admin action).
 */

import type { AppContext } from "../context";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

export interface CancelUserSubscriptionInput {
  userId: string;
  immediate?: boolean; // If true, cancel immediately. Otherwise, cancel at period end.
}

export interface CancelUserSubscriptionResult {
  success: boolean;
  message: string;
  canceledAt?: Date;
  endsAt?: Date;
}

export async function cancelUserSubscription(
  ctx: AppContext,
  input: CancelUserSubscriptionInput
): Promise<CancelUserSubscriptionResult> {
  // Get user from database
  const [user] = await ctx.db
    .select()
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  if (!user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  if (!user.stripeSubscriptionId) {
    return {
      success: false,
      message: "User does not have an active Stripe subscription",
    };
  }

  if (!ctx.payment) {
    return {
      success: false,
      message: "Payment service not available",
    };
  }

  try {
    const cancelAtPeriodEnd = !input.immediate;
    const subscription = await ctx.payment.cancelSubscription(
      user.stripeSubscriptionId,
      cancelAtPeriodEnd
    );

    // Update user in database
    const newStatus = input.immediate ? "canceled" : user.subscriptionStatus;
    await ctx.db
      .update(users)
      .set({ 
        subscriptionStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    return {
      success: true,
      message: input.immediate 
        ? "Subscription canceled immediately" 
        : "Subscription will be canceled at period end",
      canceledAt: new Date(),
      endsAt: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : undefined,
    };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel subscription",
    };
  }
}
