# Render Migration Guide

This document outlines the steps required to migrate DriverPath from Replit hosting to Render.

## Overview

The application currently uses several Replit-specific features that need to be replaced with platform-agnostic alternatives:

| Component | Current (Replit) | Target (Render) |
|-----------|-----------------|-----------------|
| Stripe Integration | Replit Connectors API | Standard Stripe SDK with env vars |
| Email Service | Gmail via Replit Connectors OAuth | Resend API or standard Gmail OAuth |
| Stripe Data Sync | stripe-replit-sync package | Standard Stripe webhooks |
| Database | Replit PostgreSQL | Render PostgreSQL |
| Environment | Replit-specific env vars | Standard env vars |

---

## 1. Stripe Integration Migration

### Current Implementation
The Stripe client in `server/infrastructure/payment/stripe-client.ts` uses Replit Connectors to dynamically fetch Stripe credentials:

```typescript
// Current: Uses REPLIT_CONNECTORS_HOSTNAME to fetch Stripe keys
const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
// Fetches from: https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe
```

### Required Changes

**File: `server/infrastructure/payment/stripe-client.ts`**

Replace the entire credential fetching logic with standard environment variables:

```typescript
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export function getUncachableStripeClient() {
  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-11-17.clover' as const,
  });
}

export function getStripePublishableKey() {
  return stripePublishableKey;
}

export function getStripeSecretKey() {
  return stripeSecretKey;
}
```

### stripe-replit-sync Replacement

The `stripe-replit-sync` package is a Replit-specific library that syncs Stripe data (products, prices, subscriptions) to the local database. This needs to be replaced with:

1. **Standard Stripe Webhooks** - Handle `product.created`, `product.updated`, `price.created`, `price.updated` events
2. **Manual sync on startup** - Fetch products/prices from Stripe API on server start

**Files to modify:**
- `server/infrastructure/payment/stripe-client.ts` - Remove `getStripeSync()` function
- `server/application/context-helpers.ts` - Replace StripeSync usage with direct Stripe API calls
- Create new `server/infrastructure/payment/stripe-sync.ts` for sync logic

---

## 2. Email Service Migration

### Current Implementation
Gmail integration uses Replit Connectors for OAuth token management in `server/infrastructure/email/gmail.service.ts`:

```typescript
// Current: Fetches OAuth tokens from Replit Connectors
const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
// Fetches from: https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-mail
```

### Option A: Use Resend (Recommended)
Resend is already integrated as a fallback. Make it the primary email provider:

**File: `server/infrastructure/email/index.ts`**

Update to use Resend by default and remove Gmail as an option:

```typescript
import { ResendEmailService } from './resend.service';

export function createEmailService() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  return new ResendEmailService();
}
```

### Option B: Standard Gmail OAuth
If Gmail is required, implement standard Google OAuth2:

1. Set up OAuth credentials in Google Cloud Console
2. Store refresh token in environment variable
3. Implement token refresh logic manually

**Required environment variables:**
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL`

---

## 3. Environment Variables

### Variables to Remove (Replit-specific)
These are provided by Replit and won't exist on Render:
- `REPLIT_CONNECTORS_HOSTNAME`
- `REPL_IDENTITY`
- `WEB_REPL_RENEWAL`
- `REPLIT_DEPLOYMENT`
- `REPL_ID`
- `REPLIT_DOMAINS`
- `REPLIT_DEV_DOMAIN`

### Variables to Add
Configure these in Render dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | Random 32+ char string |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `CONTENTFUL_SPACE_ID` | Contentful space ID | Your space ID |
| `CONTENTFUL_ACCESS_TOKEN` | Contentful access token | Your token |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port (Render sets this) | `10000` |
| `APP_BASE_URL` | Application base URL | `https://driverpath.onrender.com` |

---

## 4. Base URL Strategy (CRITICAL)

The application currently builds URLs using Replit-specific environment variables. This must be replaced with a standard `APP_BASE_URL` approach.

### Files That Build URLs from Replit Environment

| File | Current Usage | Required Change |
|------|---------------|-----------------|
| `server/application/subscription/create-checkout-session-flow.ts` | `REPLIT_DEV_DOMAIN` for success/cancel URLs | Use `APP_BASE_URL` |
| `server/application/assessment-invites/create-assessment-invite.ts` | `REPLIT_DEV_DOMAIN` for invite links | Use `APP_BASE_URL` |
| `server/application/messaging/send-content-email.ts` | `REPLIT_DEV_DOMAIN` for email links | Use `APP_BASE_URL` |
| `server/application/messaging/resend-content-email.ts` | `REPLIT_DEV_DOMAIN` for email links | Use `APP_BASE_URL` |
| `server/application/background-jobs/start-background-jobs.ts` | `REPLIT_DOMAINS` for webhook setup | Use `APP_BASE_URL` |

### Implementation

Create a utility function for base URL:

```typescript
// server/utils/url.ts
export function getBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_BASE_URL is required in production');
  }
  return 'http://localhost:5000';
}
```

Then replace all occurrences of `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` with calls to `getBaseUrl()`.

---

## 5. External Provider Updates

### Stripe Webhook Endpoint
After deploying to Render:
1. Go to Stripe Dashboard > Developers > Webhooks
2. Update or add endpoint: `https://your-app.onrender.com/api/webhooks/stripe`
3. Copy new webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Gmail OAuth Redirect URIs (if keeping Gmail)
If Gmail integration is retained:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Update OAuth 2.0 Client redirect URIs to include new Render domain
3. Re-authorize the Gmail connection with new redirect URI

### Contentful Webhooks (if applicable)
If Contentful webhooks are configured:
1. Update webhook URLs in Contentful dashboard

---

## 6. Code Changes Required

### Files to Modify

| File | Change Required |
|------|-----------------|
| `server/utils/url.ts` | **NEW** - Create base URL utility |
| `server/infrastructure/payment/stripe-client.ts` | Replace Replit Connectors with env vars |
| `server/infrastructure/email/gmail.service.ts` | Replace with Resend or standard OAuth |
| `server/application/context-helpers.ts` | Remove stripe-replit-sync usage |
| `server/application/subscription/create-checkout-session-flow.ts` | Use `getBaseUrl()` instead of `REPLIT_DEV_DOMAIN` |
| `server/application/assessment-invites/create-assessment-invite.ts` | Use `getBaseUrl()` instead of `REPLIT_DEV_DOMAIN` |
| `server/application/messaging/send-content-email.ts` | Use `getBaseUrl()` instead of `REPLIT_DEV_DOMAIN` |
| `server/application/messaging/resend-content-email.ts` | Use `getBaseUrl()` instead of `REPLIT_DEV_DOMAIN` |
| `server/application/background-jobs/start-background-jobs.ts` | Use `getBaseUrl()` instead of `REPLIT_DOMAINS` |
| `vite.config.ts` | Remove Replit plugins (already conditional) |
| `server/application/subscription/create-checkout-session-flow.ts` | Update success/cancel URLs |
| `server/routes/webhooks.ts` | Use `STRIPE_WEBHOOK_SECRET` env var |
| `scripts/create-github-issue.ts` | Replace with standard GitHub API auth |

### Files That Reference Replit Environment

Run this to find all files:
```bash
grep -r "REPL_ID\|REPLIT\|REPL_IDENTITY" --include="*.ts" .
```

Current files:
- `vite.config.ts` - Conditional Replit plugins (no change needed)
- `server/infrastructure/payment/stripe-client.ts`
- `server/infrastructure/email/gmail.service.ts`
- `server/application/subscription/create-checkout-session-flow.ts`
- `server/application/messaging/*.ts`
- `scripts/*.ts`

---

## 7. Render Configuration

### render.yaml (Blueprint)

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: driverpath
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: driverpath-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: CONTENTFUL_SPACE_ID
        sync: false
      - key: CONTENTFUL_ACCESS_TOKEN
        sync: false
      - key: APP_BASE_URL
        sync: false
    healthCheckPath: /api/health

databases:
  - name: driverpath-db
    plan: starter
    databaseName: driverpath
    user: driverpath
```

### Health Check Endpoint

Add to `server/routes/index.ts`:

```typescript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

## 8. Database Migration

### Export from Replit
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Import to Render
```bash
psql $RENDER_DATABASE_URL < backup.sql
```

Or use Drizzle migrations:
```bash
npm run db:push
```

---

## 9. Stripe Webhook Configuration

After deploying to Render:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-app.onrender.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `product.created`, `product.updated`
   - `price.created`, `price.updated`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

---

## 10. Migration Checklist

### Pre-Migration
- [ ] Export database backup
- [ ] Note all current environment variable values
- [ ] Set up Render account and create new web service
- [ ] Create Render PostgreSQL database

### Code Changes
- [ ] Create `server/utils/url.ts` with `getBaseUrl()` utility
- [ ] Update all files using `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` to use `getBaseUrl()`
- [ ] Update `stripe-client.ts` to use env vars
- [ ] Update email service to use Resend
- [ ] Remove `stripe-replit-sync` dependency
- [ ] Create `render.yaml` configuration
- [ ] Add health check endpoint

### Deployment
- [ ] Push code to GitHub (Render deploys from Git)
- [ ] Configure environment variables in Render
- [ ] Import database
- [ ] Run database migrations
- [ ] Configure Stripe webhooks for new domain
- [ ] Test all payment flows
- [ ] Test email delivery
- [ ] Update DNS (if using custom domain)

### Post-Migration
- [ ] Monitor logs for errors
- [ ] Test all user flows
- [ ] Update Stripe webhook endpoints
- [ ] Remove old Replit deployment

---

## 11. Estimated Effort

| Task | Effort |
|------|--------|
| Stripe client refactor | 2-3 hours |
| Email service migration | 2-4 hours |
| Remove stripe-replit-sync | 4-6 hours |
| Base URL strategy implementation | 1-2 hours |
| Environment configuration | 1 hour |
| Database migration | 1-2 hours |
| Testing & debugging | 4-8 hours |
| **Total** | **15-26 hours** |

---

## 12. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Take full database backup before starting |
| Stripe webhook failures | Test webhooks thoroughly in staging first |
| Email delivery issues | Have fallback email service ready |
| Session invalidation | Users will need to log in again after migration |
| Domain/SSL issues | Use Render's managed SSL; plan for DNS propagation time |
