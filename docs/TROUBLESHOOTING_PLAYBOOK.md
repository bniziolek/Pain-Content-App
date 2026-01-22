# Troubleshooting Playbook

Use this playbook for first-response troubleshooting. It is designed for non-technical operators.

## First Response Checklist

1. Confirm the app is up: `GET /api/health`.
2. Confirm database access: verify `DATABASE_URL`.
3. Reproduce the issue in a fresh browser session.
4. Check server logs for errors.
5. Identify whether the issue is UI, API, database, or external integration.

## Common Issues

### Login Fails

- **Symptoms**: "Invalid email or password" or session doesn't persist.
- **Check**: `SESSION_SECRET` is set and stable across restarts.
- **Check**: Database connectivity.

### Content Not Loading

- **Symptoms**: Empty or error content list.
- **Check**: If using Contentful, verify `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`.
- **Check**: Database connectivity for local content fallback.

### Stripe Subscription Problems

- **Symptoms**: Checkout fails, billing status not updating.
- **Check**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Check**: Webhook endpoint `POST /api/stripe/webhook` is reachable.
- **Check**: Background jobs not disabled (`STRIPE_SYNC_ENABLED`).

### Emails Not Sending

- **Symptoms**: Send email action fails.
- **Check**: Email provider connector is authorized (Gmail/Resend).
- **Check**: `REPLIT_CONNECTORS_HOSTNAME` and `REPL_IDENTITY` are present.

### Patient Portal Access Errors

- **Symptoms**: "No content found" or access code invalid.
- **Check**: Ensure email log was created.
- **Check**: Access code was not expired or re-sent.

### PDF Generation Fails

- **Symptoms**: PDF endpoint errors.
- **Check**: Puppeteer dependencies and runtime compatibility.
- **Check**: Validate the content being rendered.

## Escalation

If the issue persists after first-response steps:

1. Capture logs and timestamps.
2. Note the affected user and endpoint.
3. Create a ticket with reproduction steps.

For more detailed troubleshooting notes, see `docs/troubleshooting-guide.md`.
