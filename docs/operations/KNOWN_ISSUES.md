# Known Issues and Workarounds

This document tracks known issues, their impact, and any workarounds. Update this as issues are discovered and resolved.

## How to Use

- Add new issues as soon as they are confirmed.
- Include a workaround if one exists.
- Link to tickets if available.

---

## Active Issues

### 1) Stripe seed script references removed module

- **Impact**: `scripts/seed-stripe-products.ts` imports `server/stripeClient`, which no longer exists in this branch.
- **Symptoms**: Script fails on import.
- **Workaround**: Update the script to use the new Stripe adapter (likely from `server/infrastructure/payment/stripe-client.ts`).
- **Status**: Open

### 2) Stripe configuration missing in local dev

- **Impact**: Subscription endpoints return HTTP 503.
- **Symptoms**: "Stripe not configured" error when calling subscription endpoints.
- **Workaround**: Provide `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` in the environment.
- **Status**: Open (environment-dependent)

---

## Recently Resolved

(Empty)

