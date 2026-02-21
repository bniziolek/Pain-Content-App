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
Enhance the feature flags system to allow granular control of feature availability by subscription tier. This enables admins to "titrate" features - enabling or disabling specific capabilities for Basic, Pro, and Enterprise tiers through the admin dashboard.

## Background
Currently:
- Feature flags have a \`tiersAllowed\` column in the database but it's not editable via the admin UI
- Tier feature comparisons are hardcoded in \`client/src/pages/subscription.tsx\` as \`TIER_FEATURES\`
- \`TIER_ENTITLEMENTS\` in \`shared/schema.ts\` defines static feature access rules

## Goals
1. Allow admins to edit which tiers can access each feature flag
2. Power the subscription comparison pages dynamically from feature flag settings
3. Consolidate tier entitlement logic to use feature flags as the source of truth

## Related Issues
- [ ] Admin UI for editing tiersAllowed per flag
- [ ] API endpoint for tier comparison data
- [ ] Dynamic subscription page powered by feature flags
- [ ] Tier entitlement service integration

## Acceptance Criteria
- [ ] Admins can enable/disable features per tier through feature flags UI
- [ ] Subscription comparison page shows features dynamically from feature flags
- [ ] Changes to tier access take effect immediately
- [ ] Audit trail captures tier access changes
`;

const issue2Body = `## Summary
Add ability for admins to edit the \`tiersAllowed\` field for each feature flag, controlling which subscription tiers (Basic, Pro, Enterprise) can access each feature.

## Current State
The \`feature_flags\` table already has a \`tiersAllowed\` column:
\`\`\`typescript
tiersAllowed: text("tiers_allowed").array().default(sql\`ARRAY['basic', 'pro', 'enterprise']\`)
\`\`\`

However, the admin UI in \`client/src/pages/admin/feature-flags.tsx\` doesn't expose this field for editing.

## Required Changes

### Backend: \`server/routes/feature-flags.ts\`
Update the PATCH endpoint to accept \`tiersAllowed\` in the request body:
\`\`\`typescript
const { isEnabled, value, payload, name, description, category, tiersAllowed } = req.body;
// Pass tiersAllowed to updateFeatureFlagAdmin
\`\`\`

### Application Service: \`server/application/feature-flags/update-feature-flag.ts\`
Update to handle \`tiersAllowed\` updates.

### Frontend: \`client/src/pages/admin/feature-flags.tsx\`
Add tier selection UI:
- Checkbox group for Basic, Pro, Enterprise
- Show current tier access with badges
- Include in pending changes when modified

### Suggested UI
\`\`\`
Allowed Tiers:
[ ] Basic
[x] Pro  
[x] Enterprise
\`\`\`

## Audit Logging
Ensure tier changes are captured in audit logs with:
- Previous tier access
- New tier access
- Who made the change

## Acceptance Criteria
- [ ] Admin can see current tier access for each flag
- [ ] Admin can toggle tier access via checkboxes
- [ ] Changes are saved when flag is updated
- [ ] Audit log captures: "tiersAllowed changed from [basic, pro] to [pro, enterprise]"
- [ ] tiersAllowed changes reflected in API responses
`;

const issue3Body = `## Summary
Create a new API endpoint that returns tier comparison data for the subscription page, powered by feature flags instead of hardcoded data.

## Current State
The subscription page has hardcoded \`TIER_FEATURES\`:
\`\`\`typescript
const TIER_FEATURES = {
  basic: [
    { name: "Content Library Access", included: true },
    { name: "Patient Portal", included: false },
    // ...
  ],
  pro: [
    { name: "Content Library Access", included: true },
    { name: "Patient Portal", included: true },
    // ...
  ],
};
\`\`\`

## New Endpoint

### \`GET /api/subscription/tier-comparison\`

Returns feature comparison data derived from feature flags:

\`\`\`typescript
interface TierComparisonResponse {
  features: {
    key: string;           // Feature flag key
    name: string;          // Display name
    description?: string;  // Feature description
    basic: boolean;        // Available for Basic tier
    pro: boolean;          // Available for Pro tier  
    enterprise: boolean;   // Available for Enterprise tier
    category?: string;     // Feature category for grouping
  }[];
  tiers: {
    key: string;
    name: string;
    description?: string;
  }[];
}
\`\`\`

### Implementation

\`\`\`typescript
// server/application/subscription/get-tier-comparison.ts
export async function getTierComparison(ctx: AppContext): Promise<TierComparisonResponse> {
  const flags = await ctx.storage.getFeatureFlags();
  
  // Filter to flags that represent tier-differentiating features
  const tierFeatures = flags
    .filter(f => f.category === 'tier_feature' && f.isEnabled)
    .map(f => ({
      key: f.key,
      name: f.name,
      description: f.description,
      basic: f.tiersAllowed?.includes('basic') ?? false,
      pro: f.tiersAllowed?.includes('pro') ?? false,
      enterprise: f.tiersAllowed?.includes('enterprise') ?? false,
      category: f.category,
    }));
    
  return {
    features: tierFeatures,
    tiers: [
      { key: 'basic', name: 'Basic', description: 'Essential tools for solo practitioners' },
      { key: 'pro', name: 'Pro', description: 'Advanced features for growing practices' },
      { key: 'enterprise', name: 'Enterprise', description: 'Full platform for organizations' },
    ]
  };
}
\`\`\`

## Feature Flag Setup
Create feature flags for each tier-differentiating feature:
- \`tier_content_library\` - tiersAllowed: [basic, pro, enterprise]
- \`tier_patient_portal\` - tiersAllowed: [pro, enterprise]
- \`tier_email_delivery\` - tiersAllowed: [pro, enterprise]
- \`tier_care_pathways\` - tiersAllowed: [pro, enterprise]
- \`tier_priority_support\` - tiersAllowed: [pro, enterprise]
- etc.

## Acceptance Criteria
- [ ] \`GET /api/subscription/tier-comparison\` endpoint created
- [ ] Returns feature comparison derived from feature flags
- [ ] Flags with category 'tier_feature' are included
- [ ] Response includes tier metadata
- [ ] Endpoint is publicly accessible (no auth required for pricing display)
`;

const issue4Body = `## Summary
Update the subscription/pricing page to fetch tier feature data dynamically from the new tier comparison API instead of using hardcoded \`TIER_FEATURES\`.

## Current State
In \`client/src/pages/subscription.tsx\`:
\`\`\`typescript
const TIER_FEATURES = {
  basic: [
    { name: "Content Library Access", included: true },
    // ... hardcoded list
  ],
  pro: [...],
};
\`\`\`

## Required Changes

### 1. Create API Hook
\`\`\`typescript
// client/src/api/subscription.ts
export function useTierComparison() {
  return useQuery({
    queryKey: ['tier-comparison'],
    queryFn: async () => {
      const res = await fetch('/api/subscription/tier-comparison');
      if (!res.ok) throw new Error('Failed to fetch tier comparison');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
\`\`\`

### 2. Update Subscription Page
Replace hardcoded \`TIER_FEATURES\` with API data:
\`\`\`typescript
const { data: tierComparison, isLoading: loadingComparison } = useTierComparison();

// Transform API data to match current UI structure
const tierFeatures = useMemo(() => {
  if (!tierComparison) return FALLBACK_TIER_FEATURES;
  
  return {
    basic: tierComparison.features.map(f => ({
      name: f.name,
      included: f.basic,
    })),
    pro: tierComparison.features.map(f => ({
      name: f.name,
      included: f.pro,
    })),
  };
}, [tierComparison]);
\`\`\`

### 3. Fallback Handling
Keep \`TIER_FEATURES\` as a fallback if API fails or is loading:
- Show loading skeleton while fetching
- Fall back to hardcoded data if API fails
- Log warning if fallback is used

## UI Considerations
- Add loading state for feature list
- Consider grouping features by category
- Highlight new features or differences between tiers

## Acceptance Criteria
- [ ] Subscription page fetches tier comparison from API
- [ ] Feature lists update when feature flags change (after page refresh)
- [ ] Graceful fallback to hardcoded data if API unavailable
- [ ] Loading state while fetching comparison data
- [ ] Works for both authenticated and unauthenticated users
`;

const issue5Body = `## Summary
Create seed data for tier-differentiating feature flags that will power the subscription comparison page. These flags should represent the features shown on pricing pages.

## Feature Flags to Create

### Core Features (All Tiers)
| Key | Name | Tiers Allowed |
|-----|------|---------------|
| \`tier_content_library\` | Content Library Access | basic, pro, enterprise |
| \`tier_content_concierge\` | Content Concierge | basic, pro, enterprise |
| \`tier_content_packets\` | Content Packets | basic, pro, enterprise |
| \`tier_internal_screenings\` | Internal Screenings | basic, pro, enterprise |

### Limited Features (Basic with limits)
| Key | Name | Tiers Allowed |
|-----|------|---------------|
| \`tier_assessments\` | Assessment Builder | basic, pro, enterprise |
| \`tier_assessments_unlimited\` | Unlimited Assessments | pro, enterprise |

### Pro Features
| Key | Name | Tiers Allowed |
|-----|------|---------------|
| \`tier_patient_portal\` | Patient Portal | pro, enterprise |
| \`tier_email_delivery\` | Email Delivery | pro, enterprise |
| \`tier_care_pathways\` | Care Pathways | pro, enterprise |
| \`tier_follow_up_automation\` | Follow-up Automation | pro, enterprise |
| \`tier_priority_support\` | Priority Support | pro, enterprise |

### Enterprise Features
| Key | Name | Tiers Allowed |
|-----|------|---------------|
| \`tier_white_label\` | White Labeling | enterprise |
| \`tier_api_access\` | API Access | enterprise |
| \`tier_sso\` | Single Sign-On (SSO) | enterprise |

## Implementation

### Seed Script
Update \`server/seed.ts\` or create migration to add these flags:
\`\`\`typescript
const tierFeatureFlags = [
  {
    key: 'tier_content_library',
    name: 'Content Library Access',
    description: 'Access to the full evidence-based content library',
    category: 'tier_feature',
    tiersAllowed: ['basic', 'pro', 'enterprise'],
    isEnabled: true,
  },
  // ... more flags
];

for (const flag of tierFeatureFlags) {
  await db.insert(featureFlags)
    .values(flag)
    .onConflictDoNothing();
}
\`\`\`

## Acceptance Criteria
- [ ] All tier feature flags created in database
- [ ] Each flag has correct tiersAllowed array
- [ ] Flags have category = 'tier_feature'
- [ ] Descriptions are clear and user-friendly
- [ ] Seed script is idempotent (doesn't duplicate on re-run)
`;

const issue6Body = `## Summary
Update the tier entitlement checking logic to use feature flags as the source of truth, integrating with the existing \`TIER_ENTITLEMENTS\` system.

## Current State
\`shared/schema.ts\` has a static \`TIER_ENTITLEMENTS\` object:
\`\`\`typescript
export const TIER_ENTITLEMENTS: Record<string, SubscriptionTier[]> = {
  content_library: ['basic', 'pro', 'enterprise'],
  patient_portal: ['pro', 'enterprise'],
  // ...
};
\`\`\`

This is used in middleware and services to check if a user's tier allows a feature.

## Goal
Replace static \`TIER_ENTITLEMENTS\` with dynamic lookups against feature flags, allowing runtime control of tier access.

## Implementation Approach

### Option A: Feature Flag Lookup Service
\`\`\`typescript
// server/application/feature-flags/check-tier-access.ts
export async function checkTierAccess(
  ctx: AppContext, 
  featureKey: string, 
  userTier: SubscriptionTier
): Promise<boolean> {
  const flag = await ctx.storage.getFeatureFlagByKey(featureKey);
  
  if (!flag || !flag.isEnabled) return false;
  
  return flag.tiersAllowed?.includes(userTier) ?? false;
}
\`\`\`

### Option B: Cached Entitlements from Flags
\`\`\`typescript
// Build TIER_ENTITLEMENTS dynamically from feature flags on startup
export async function buildTierEntitlements(ctx: AppContext): Promise<Record<string, SubscriptionTier[]>> {
  const flags = await ctx.storage.getFeatureFlags();
  
  return flags
    .filter(f => f.isEnabled && f.tiersAllowed)
    .reduce((acc, f) => {
      acc[f.key] = f.tiersAllowed as SubscriptionTier[];
      return acc;
    }, {} as Record<string, SubscriptionTier[]>);
}
\`\`\`

### Middleware Integration
Update subscription middleware to use dynamic lookup:
\`\`\`typescript
// server/middleware/require-tier-feature.ts
export function requireTierFeature(featureKey: string) {
  return async (req, res, next) => {
    const userTier = req.user?.subscriptionTier || 'free';
    const hasAccess = await checkTierAccess(appContext, featureKey, userTier);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Upgrade required',
        requiredTiers: await getRequiredTiers(featureKey),
      });
    }
    next();
  };
}
\`\`\`

## Migration Strategy
1. Create feature flags for all existing TIER_ENTITLEMENTS entries
2. Update services to check feature flags first, fall back to static config
3. Gradually migrate all tier checks to use feature flags
4. Eventually remove static TIER_ENTITLEMENTS

## Acceptance Criteria
- [ ] Tier access can be checked against feature flags
- [ ] Existing functionality preserved during migration
- [ ] Middleware supports dynamic tier checking
- [ ] Caching strategy prevents excessive database queries
- [ ] Fallback to static config if flag not found
`;

const issues: GitHubIssue[] = [
  {
    title: "[Feature] Tier-Based Feature Flags - Overview Epic",
    labels: ['enhancement', 'feature-flags', 'subscription', 'epic'],
    body: issue1Body
  },
  {
    title: "[Feature] Admin UI for Editing tiersAllowed per Feature Flag",
    labels: ['enhancement', 'feature-flags', 'admin', 'frontend'],
    body: issue2Body
  },
  {
    title: "[Feature] API Endpoint for Tier Comparison Data",
    labels: ['enhancement', 'feature-flags', 'api', 'backend'],
    body: issue3Body
  },
  {
    title: "[Feature] Dynamic Subscription Page Powered by Feature Flags",
    labels: ['enhancement', 'feature-flags', 'subscription', 'frontend'],
    body: issue4Body
  },
  {
    title: "[Feature] Seed Tier Feature Flags for Subscription Comparison",
    labels: ['enhancement', 'feature-flags', 'database'],
    body: issue5Body
  },
  {
    title: "[Feature] Integrate Tier Entitlements with Feature Flags",
    labels: ['enhancement', 'feature-flags', 'backend', 'refactor'],
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
