/**
 * Architecture: Application service layer. Gets detailed subscription information for a user.
 */

import type { AppContext } from "../context";

export interface GetSubscriptionDetailsInput {
  userId: string;
}

export interface SubscriptionDetails {
  userId: string;
  email: string;
  name: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  subscriptionPeriodEnd: Date | null;
  subscriptionStartDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingHistory: BillingRecord[];
  paymentMethod: PaymentMethodInfo | null;
}

export interface BillingRecord {
  id: string;
  amount: number;
  status: string | null;
  date: number;
  pdfUrl: string | null;
}

export interface PaymentMethodInfo {
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

export async function getSubscriptionDetails(
  ctx: AppContext,
  input: GetSubscriptionDetailsInput
): Promise<SubscriptionDetails | null> {
  // Get user from storage
  const user = await ctx.storage.getUser(input.userId);

  if (!user) {
    return null;
  }

  // Initialize response
  const details: SubscriptionDetails = {
    userId: user.id,
    email: user.email,
    name: user.name,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionTier: user.subscriptionTier,
    subscriptionPeriodEnd: user.subscriptionPeriodEnd,
    subscriptionStartDate: user.createdAt, // Using createdAt as proxy for subscription start
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    billingHistory: [],
    paymentMethod: null,
  };

  // Get Stripe data if available
  if (ctx.payment && user.stripeCustomerId) {
    try {
      // Get billing history (last 12 invoices)
      const invoices = await ctx.payment.listInvoices({
        customerId: user.stripeCustomerId,
        limit: 12,
      });
      details.billingHistory = invoices;

      // Get payment method
      if (user.stripeSubscriptionId) {
        const subscription = await ctx.payment.getSubscription(user.stripeSubscriptionId);
        if (subscription && subscription.default_payment_method) {
          const paymentMethodId = subscription.default_payment_method?.id || subscription.default_payment_method;
          
          const paymentMethods = await ctx.payment.getPaymentMethods(user.stripeCustomerId);
          const defaultPM = paymentMethods.find(pm => pm.id === paymentMethodId);
          
          if (defaultPM && defaultPM.card) {
            details.paymentMethod = {
              last4: defaultPM.card.last4,
              brand: defaultPM.card.brand,
              expMonth: defaultPM.card.exp_month,
              expYear: defaultPM.card.exp_year,
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Stripe data:", error);
      // Continue without Stripe data
    }
  }

  return details;
}
