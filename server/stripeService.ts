// Re-export from infrastructure for backwards compatibility
// All payment service functionality is now in server/infrastructure/payment/
export {
  StripeService,
  stripeService,
} from './infrastructure/payment/stripe.service';
