/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

import { getUncachableStripeClient } from './stripe-client';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@shared/schema';

export class StripeService {
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId },
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'subscription'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getSubscription(subscriptionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    const stripe = await getUncachableStripeClient();
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  async resumeSubscription(subscriptionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async updateSubscription(subscriptionId: string, newPriceId: string) {
    const stripe = await getUncachableStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  async getInvoices(customerId: string, limit: number = 10) {
    const stripe = await getUncachableStripeClient();
    return await stripe.invoices.list({
      customer: customerId,
      limit,
    });
  }

  async getPaymentMethods(customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }
}

export const stripeService = new StripeService();
