# Environment Variables Guide

All environment variables and secrets required to run RehabPilot.

## Required Variables

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PGHOST` | Database host | `localhost` |
| `PGPORT` | Database port | `5432` |
| `PGUSER` | Database username | `postgres` |
| `PGPASSWORD` | Database password | `your-password` |
| `PGDATABASE` | Database name | `rehabpilot` |

These are automatically set when using Replit's PostgreSQL database.

### Session Security

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `SESSION_SECRET` | Secret for session encryption | Random 32+ character string |

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Optional Integrations

### Contentful CMS

For managing content library via Contentful.

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `CONTENTFUL_SPACE_ID` | Contentful space identifier | Contentful Settings > API Keys |
| `CONTENTFUL_ACCESS_TOKEN` | Content Delivery API token | Contentful Settings > API Keys |

If not configured, content is served from the local PostgreSQL database.

### Stripe (Payment Processing)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Stripe Dashboard > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard > Webhooks |

### Gmail Integration

Gmail is configured via Replit's connector system. No manual environment variables needed.

## Auto-Generated Variables

These are set automatically by Replit:

| Variable | Description |
|----------|-------------|
| `REPLIT_DEV_DOMAIN` | Development URL (e.g., `xyz.kirk.replit.dev`) |
| `REPLIT_DOMAINS` | Comma-separated list of domains |
| `REPL_ID` | Unique Replit identifier |

## Setting Up Secrets in Replit

1. Open the **Secrets** tab in your Replit workspace
2. Click **+ New Secret**
3. Enter the key name (e.g., `SESSION_SECRET`)
4. Enter the value
5. Click **Add Secret**

Secrets are encrypted and only accessible to your Repl.

## Development vs Production

Some variables may differ between environments:

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| Base URL | `REPLIT_DEV_DOMAIN` | `REPLIT_DOMAINS` |
| Cookie secure | `false` | `true` |

## Checking Configuration

View current environment:
```bash
node -e "console.log(process.env.DATABASE_URL ? 'DB configured' : 'DB not configured')"
```

Check all configured integrations:
```typescript
// In your code
if (process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN) {
  console.log('Contentful configured');
}
```

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is set correctly
- Check the database is running in the Replit Database pane

### "Session not persisting"
- Ensure `SESSION_SECRET` is set
- Check it's the same value across restarts

### "Contentful content not loading"
- Verify both `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` are set
- Check the space ID matches your Contentful space
- Ensure the access token has read permissions

### "Emails not sending"
- Gmail integration requires OAuth setup through Replit's connector
- Check the Gmail connector is properly authorized in your Replit workspace
