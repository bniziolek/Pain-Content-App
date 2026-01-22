/**
 * Architecture: Webhook handlers that translate external events into application services.
 */

import { createAppContext, handleSubscriptionDeleted, handleSubscriptionUpdated, processStripeWebhook } from "./application";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    const appContext = createAppContext();
    await processStripeWebhook(appContext, payload, signature);
  }

  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const appContext = createAppContext();
    await handleSubscriptionUpdated(appContext, subscription);
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const appContext = createAppContext();
    await handleSubscriptionDeleted(appContext, subscription);
  }
}
