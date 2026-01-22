/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

export * from './email';
export * from './payment';
export * from './cms';
export * from './audit';
export * from './pdf';
