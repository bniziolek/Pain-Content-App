/**
 * Architecture: Application service layer. Applies a coupon/discount to a user's subscription.
 */

import type { AppContext } from "../context";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

export interface ApplyCouponInput {
  userId: string;
  couponCode: string;
}

export interface ApplyCouponResult {
  success: boolean;
  message: string;
}

export async function applyCoupon(
  ctx: AppContext,
  input: ApplyCouponInput
): Promise<ApplyCouponResult> {
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
    // Apply the coupon to the subscription
    await ctx.payment.applyCoupon(user.stripeSubscriptionId, input.couponCode);

    return {
      success: true,
      message: `Coupon "${input.couponCode}" applied successfully`,
    };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to apply coupon",
    };
  }
}
