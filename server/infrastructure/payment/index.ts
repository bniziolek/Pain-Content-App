/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

export * from './stripe.service';
export { 
  getUncachableStripeClient, 
  getStripePublishableKey,
  getStripeSecretKey, 
  getStripeSync 
} from './stripe-client';
