/**
 * Architecture: Application service layer. Cancels a user's subscription (admin action).
 */

import type { AppContext } from "../context";

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
  // Get user from storage
  const user = await ctx.storage.getUser(input.userId);

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
    
    // Get subscription info before canceling
    let periodEnd: Date | undefined;
    try {
      const subscription = await ctx.payment.getSubscription(user.stripeSubscriptionId);
      if (subscription && subscription.current_period_end) {
        periodEnd = new Date(subscription.current_period_end * 1000);
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error);
    }
    
    // Cancel the subscription
    await ctx.payment.cancelSubscription({
      subscriptionId: user.stripeSubscriptionId,
      cancelAtPeriodEnd,
    });

    // Update user in database
    const newStatus = input.immediate ? "canceled" : user.subscriptionStatus;
    await ctx.storage.updateUserSubscription(user.id, {
      subscriptionStatus: newStatus,
    });

    return {
      success: true,
      message: input.immediate 
        ? "Subscription canceled immediately" 
        : "Subscription will be canceled at period end",
      canceledAt: new Date(),
      endsAt: periodEnd,
    };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel subscription",
    };
  }
}
