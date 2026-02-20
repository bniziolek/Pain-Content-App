import { getUncachableGitHubClient } from '../server/github';

const OWNER = process.env.GITHUB_OWNER || 'bniziolek';
const REPO = process.env.GITHUB_REPO || 'Pain-Content-App';

async function createProTierFeatureFlagIssue() {
  console.log('Creating GitHub issue for pro_tier_enabled feature flag...');
  
  try {
    const octokit = await getUncachableGitHubClient();
    
    const issueBody = `## Overview
A feature flag has been implemented to enable or disable the Pro subscription tier. This allows administrators to control whether the Pro plan is available for new subscriptions.

## Feature Flag Details
- **Key:** \`pro_tier_enabled\`
- **Category:** billing
- **Default:** enabled (true)
- **Location:** Admin panel > Feature Flags

## How It Works
1. When the flag is **enabled**, both Basic ($19/mo) and Pro ($29/mo) plans are shown on the subscription page
2. When the flag is **disabled**, only the Basic plan is visible to users
3. Existing Pro subscribers are not affected when the flag is disabled

## Implementation Details
- Feature flag stored in \`feature_flags\` table with category "billing"
- Frontend subscription page fetches flag status via \`/api/subscription/feature-flags\` endpoint
- Layout automatically adjusts to single-column centered view when only Basic is shown
- Seeded via \`server/seed.ts\` during database initialization

## Admin Usage
1. Navigate to the Admin Panel
2. Go to Feature Flags section
3. Find "Pro Tier" flag
4. Toggle to enable or disable Pro tier availability

## Files Modified
- \`server/seed.ts\` - Added pro_tier_enabled flag
- \`server/routes.ts\` - Added /api/subscription/feature-flags endpoint
- \`client/src/pages/subscription.tsx\` - Conditional Pro plan rendering

## Status
- [x] Feature flag added to database schema
- [x] API endpoint for fetching billing flags
- [x] Frontend conditional rendering
- [x] Layout adaptation for single plan view
`;

    const { data: issue } = await octokit.issues.create({
      owner: OWNER,
      repo: REPO,
      title: 'Feature: Pro Tier Feature Flag',
      body: issueBody,
      labels: ['feature', 'billing', 'completed'],
    });

    console.log(`Issue created successfully!`);
    console.log(`Issue #${issue.number}: ${issue.title}`);
    console.log(`URL: ${issue.html_url}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.error(`Repository ${OWNER}/${REPO} not found or not accessible.`);
      console.error('Please set GITHUB_OWNER and GITHUB_REPO environment variables.');
    } else if (error.status === 422) {
      console.error('Issue creation failed - possibly missing labels or invalid data');
      console.error(error.message);
    } else {
      console.error('Error creating issue:', error.message);
    }
    process.exit(1);
  }
}

createProTierFeatureFlagIssue();
