import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

interface GitHubIssue {
  title: string;
  body: string;
  labels: string[];
}

const issue1Body = `## Summary
Migrate DriverPath from Replit hosting to Render for production deployment.

## Background
The application currently uses several Replit-specific features that need to be replaced with platform-agnostic alternatives to enable hosting on Render.

## Migration Documentation
See \`docs/RENDER_MIGRATION.md\` for the complete migration guide.

## Key Components to Migrate

| Component | Current (Replit) | Target (Render) |
|-----------|-----------------|-----------------|
| Stripe Integration | Replit Connectors API | Standard Stripe SDK with env vars |
| Email Service | Gmail via Replit Connectors OAuth | Resend API |
| Stripe Data Sync | stripe-replit-sync package | Standard Stripe webhooks |
| Database | Replit PostgreSQL | Render PostgreSQL |

## Related Issues
This epic tracks the overall migration. See related issues for specific components:
- [ ] Stripe Integration Migration
- [ ] Email Service Migration  
- [ ] Remove stripe-replit-sync Package
- [ ] Environment Variables & Render Configuration

## Estimated Effort
14-24 hours total

## Acceptance Criteria
- [ ] All Replit-specific dependencies removed
- [ ] Application deploys successfully on Render
- [ ] All payment flows work correctly
- [ ] Email delivery works
- [ ] Database migrated with all data intact
- [ ] Stripe webhooks configured for new domain
`;

const issue2Body = `## Summary
Replace the Replit Connectors-based Stripe integration with standard Stripe SDK using environment variables.

## Current Implementation
The Stripe client in \`server/infrastructure/payment/stripe-client.ts\` uses Replit Connectors to dynamically fetch Stripe credentials.

## Required Changes

### File: server/infrastructure/payment/stripe-client.ts

Replace credential fetching with standard environment variables:

\`\`\`typescript
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
\`\`\`

### Environment Variables to Configure
- \`STRIPE_SECRET_KEY\` - Stripe secret key
- \`STRIPE_PUBLISHABLE_KEY\` - Stripe publishable key
- \`STRIPE_WEBHOOK_SECRET\` - Webhook signing secret

## Files to Modify
- \`server/infrastructure/payment/stripe-client.ts\`
- \`server/routes/webhooks.ts\` (use STRIPE_WEBHOOK_SECRET env var)

## Acceptance Criteria
- [ ] Stripe client uses environment variables instead of Replit Connectors
- [ ] Webhook signature verification uses STRIPE_WEBHOOK_SECRET
- [ ] All payment flows still work (checkout, upgrades, webhooks)
`;

const issue3Body = `## Summary
Replace the Replit Connectors-based Gmail integration with the existing Resend email service.

## Current Implementation
Gmail integration in \`server/infrastructure/email/gmail.service.ts\` uses Replit Connectors for OAuth token management.

## Recommendation
Resend is already integrated as a fallback. Make it the primary (and only) email provider for Render deployment.

## Required Changes

### File: server/infrastructure/email/index.ts

Update to use Resend exclusively:

\`\`\`typescript
import { ResendEmailService } from './resend.service';

export function createEmailService() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  return new ResendEmailService();
}
\`\`\`

### Environment Variables
- \`RESEND_API_KEY\` - Resend API key

## Files to Modify
- \`server/infrastructure/email/index.ts\`
- \`server/application/messaging/*.ts\` (update service references)

## Acceptance Criteria
- [ ] Email service works without Replit Connectors
- [ ] All transactional emails send correctly
- [ ] Assessment invitations work
- [ ] Password reset emails work
- [ ] Content sharing emails work
`;

const issue4Body = `## Summary
Remove the \`stripe-replit-sync\` package (a Replit-specific library) and replace its functionality with standard Stripe API calls and webhooks.

## Current Usage
The \`stripe-replit-sync\` package syncs Stripe data (products, prices, subscriptions) to the local database.

Used in:
- \`server/infrastructure/payment/stripe-client.ts\` - getStripeSync() function
- \`server/application/context-helpers.ts\` - Uses StripeSync for data access

## Required Replacement

### 1. Create New Stripe Sync Service
Create \`server/infrastructure/payment/stripe-sync.ts\` with functions to:
- Fetch products from Stripe API and upsert to database
- Fetch prices from Stripe API and upsert to database

### 2. Handle Stripe Webhooks for Real-time Sync
Add webhook handlers for:
- product.created, product.updated, product.deleted
- price.created, price.updated, price.deleted

### 3. Sync on Server Startup
Call sync functions during server initialization.

## Files to Modify
- \`server/infrastructure/payment/stripe-client.ts\` - Remove getStripeSync()
- \`server/application/context-helpers.ts\` - Replace StripeSync usage
- \`server/routes/webhooks.ts\` - Add product/price webhook handlers
- \`server/index.ts\` - Add sync on startup
- \`package.json\` - Remove stripe-replit-sync dependency

## Acceptance Criteria
- [ ] stripe-replit-sync removed from package.json
- [ ] Products and prices sync on server startup
- [ ] Webhook handlers keep data in sync
- [ ] Subscription creation/update still works
- [ ] Pricing display on subscription page works
`;

const issue5Body = `## Summary
Create Render deployment configuration and document all required environment variables.

## Tasks

### 1. Create render.yaml Blueprint

\`\`\`yaml
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
    healthCheckPath: /api/health

databases:
  - name: driverpath-db
    plan: starter
\`\`\`

### 2. Add Health Check Endpoint

\`\`\`typescript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
\`\`\`

### 3. Environment Variables to Remove (Replit-specific)
- REPLIT_CONNECTORS_HOSTNAME
- REPL_IDENTITY
- WEB_REPL_RENEWAL
- REPLIT_DEPLOYMENT
- REPL_ID

### 4. Environment Variables to Configure

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Session encryption key |
| STRIPE_SECRET_KEY | Stripe secret key |
| STRIPE_PUBLISHABLE_KEY | Stripe publishable key |
| STRIPE_WEBHOOK_SECRET | Webhook signing secret |
| RESEND_API_KEY | Resend API key |
| CONTENTFUL_SPACE_ID | Contentful space ID |
| CONTENTFUL_ACCESS_TOKEN | Contentful access token |

## Acceptance Criteria
- [ ] render.yaml created with correct configuration
- [ ] Health check endpoint returns 200 OK
- [ ] Application starts without Replit-specific env vars
`;

const issue6Body = `## Summary
Migrate the PostgreSQL database from Replit to Render managed PostgreSQL.

## Migration Steps

### 1. Export from Replit
\`\`\`bash
pg_dump $DATABASE_URL > backup.sql
\`\`\`

### 2. Create Render PostgreSQL
1. Go to Render Dashboard
2. Create new PostgreSQL database
3. Note the connection string

### 3. Import to Render
\`\`\`bash
psql $RENDER_DATABASE_URL < backup.sql
\`\`\`

Or for fresh database, just run migrations:
\`\`\`bash
DATABASE_URL=$RENDER_DATABASE_URL npm run db:push
\`\`\`

### 4. Data Verification
Verify key tables have data:
- users
- content_items
- assessment_definitions
- stripe_products / stripe_prices
- audit_logs

## Important Considerations

### Session Invalidation
- All user sessions will be invalidated after migration
- Users will need to log in again

### Audit Logs
- Ensure audit_logs table is migrated for compliance
- Verify timestamps are preserved correctly

## Acceptance Criteria
- [ ] All tables migrated with correct schema
- [ ] All data preserved (users, content, assessments)
- [ ] Audit logs intact
- [ ] Foreign key relationships preserved
- [ ] Application connects to new database successfully
`;

const issues: GitHubIssue[] = [
  {
    title: "[Migration] Render Hosting Migration - Overview",
    labels: ['migration', 'infrastructure', 'epic'],
    body: issue1Body
  },
  {
    title: "[Migration] Replace Replit Stripe Integration with Standard SDK",
    labels: ['migration', 'infrastructure', 'stripe'],
    body: issue2Body
  },
  {
    title: "[Migration] Replace Gmail Replit Integration with Resend",
    labels: ['migration', 'infrastructure', 'email'],
    body: issue3Body
  },
  {
    title: "[Migration] Remove stripe-replit-sync Package Dependency",
    labels: ['migration', 'infrastructure', 'stripe', 'breaking-change'],
    body: issue4Body
  },
  {
    title: "[Migration] Create Render Configuration and Environment Setup",
    labels: ['migration', 'infrastructure', 'devops'],
    body: issue5Body
  },
  {
    title: "[Migration] Database Migration from Replit to Render PostgreSQL",
    labels: ['migration', 'database'],
    body: issue6Body
  }
];

async function createIssues() {
  const octokit = await getUncachableGitHubClient();
  
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 20
    });
    
    console.log('\nAvailable repositories:');
    repos.forEach((repo, i) => {
      console.log(`${i + 1}. ${repo.full_name}`);
    });
    
    const repoName = repos.find(r => 
      r.name.toLowerCase().includes('pain') || 
      r.name.toLowerCase().includes('content') ||
      r.name.toLowerCase().includes('driver')
    );
    
    if (!repoName) {
      console.log('\nCould not find repo automatically. Using first repo.');
      if (repos.length === 0) {
        console.log('No repositories found.');
        return;
      }
    }
    
    const targetRepo = repoName || repos[0];
    console.log(`\nCreating issues in: ${targetRepo.full_name}`);
    
    const createdIssues: { number: number; title: string; url: string }[] = [];
    
    for (const issue of issues) {
      try {
        const { data: created } = await octokit.issues.create({
          owner: targetRepo.owner.login,
          repo: targetRepo.name,
          title: issue.title,
          body: issue.body,
          labels: issue.labels
        });
        
        createdIssues.push({
          number: created.number,
          title: created.title,
          url: created.html_url
        });
        
        console.log(`Created: #${created.number} - ${created.title}`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Failed to create "${issue.title}": ${error.message}`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Created ${createdIssues.length} of ${issues.length} issues:\n`);
    createdIssues.forEach(issue => {
      console.log(`  #${issue.number}: ${issue.title}`);
      console.log(`    ${issue.url}\n`);
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.status === 404) {
      console.log('Repository not found or no access.');
    }
  }
}

createIssues();
