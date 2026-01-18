import { getStripeSync } from './stripeClient';
import { storage } from './storage';
import type { SubscriptionTier } from '@shared/schema';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }

  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const currentPeriodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000) 
      : undefined;

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.log(`No user found for Stripe customer ${customerId}`);
      return;
    }

    let tier: SubscriptionTier = 'basic';
    if (priceId) {
      const tierFromPrice = await storage.getTierFromPriceId(priceId);
      if (tierFromPrice && ['free', 'basic', 'pro', 'enterprise'].includes(tierFromPrice)) {
        tier = tierFromPrice as SubscriptionTier;
      }
    }

    const subscriptionStatus = status === 'active' || status === 'trialing' 
      ? 'active' 
      : status === 'past_due' 
        ? 'past_due' 
        : status === 'canceled' 
          ? 'canceled' 
          : 'inactive';

    await storage.updateUserSubscription(user.id, {
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus,
      subscriptionPeriodEnd: currentPeriodEnd,
    });

    // Update subscription tier separately if needed
    await storage.updateSubscriptionTier(user.id, tier);

    console.log(`Updated user ${user.id} subscription: tier=${tier}, status=${subscriptionStatus}`);
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const customerId = subscription.customer;

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.log(`No user found for Stripe customer ${customerId}`);
      return;
    }

    await storage.updateUserSubscription(user.id, {
      subscriptionStatus: 'canceled',
    });

    console.log(`Canceled subscription for user ${user.id}`);
  }
}
