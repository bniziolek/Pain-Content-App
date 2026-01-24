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

async function createIssue() {
  const octokit = await getUncachableGitHubClient();
  
  const issueTitle = "Admin Subscription Override - Temporary Tier Upgrades";
  const issueBody = `## Summary
Allow admin users to grant temporary subscription tier upgrades to users without impacting their billing or payment status.

## Problem
Currently, changing a user's subscription tier is tied to their billing. There's no way for admins to:
- Grant complimentary access to higher tiers
- Provide temporary upgrades for testing or promotional purposes
- Give users premium features without requiring payment

## Proposed Solution

### Admin Override System
Create an "admin override" mechanism that:
1. **Grants temporary tier access** - Admin can upgrade a user to Basic, Pro, or Enterprise without payment
2. **Preserves billing status** - The user's actual Stripe subscription remains unchanged
3. **Supports expiration dates** - Override can be permanent or expire after a set date
4. **Tracks override history** - Log who granted the override and when

### Database Changes
Add to users table or create new table:
- \`tier_override\` - The overridden tier (null if no override)
- \`tier_override_expires_at\` - Optional expiration timestamp
- \`tier_override_granted_by\` - Admin user ID who granted the override
- \`tier_override_reason\` - Optional notes about why the override was granted

### UI Changes
- Add "Grant Tier Override" section to admin user detail page
- Show current override status with expiration if applicable
- Add "Remove Override" option
- Display visual indicator when a user has an active override

### Logic Changes
- When determining user's effective tier, check for active override first
- If override exists and hasn't expired, use override tier
- Otherwise, use the tier from their Stripe subscription
- Create API endpoint: \`POST /api/admin/users/:id/tier-override\`
- Create API endpoint: \`DELETE /api/admin/users/:id/tier-override\`

## Acceptance Criteria
- [ ] Admin can grant a user any tier (Basic, Pro, Enterprise) as an override
- [ ] Override can be set with or without an expiration date
- [ ] User's Stripe billing is not affected by the override
- [ ] Override is automatically removed after expiration
- [ ] Admin can manually remove an override at any time
- [ ] Override history is logged in audit_logs
- [ ] Visual indicator shows when a user has an active override in admin views

## Priority
Medium`;

  try {
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 10
    });
    
    console.log('\nAvailable repositories:');
    repos.forEach((repo, i) => {
      console.log(`${i + 1}. ${repo.full_name}`);
    });
    
    const repoName = repos.find(r => r.name.toLowerCase().includes('pain') || r.name.toLowerCase().includes('content'));
    
    if (!repoName) {
      console.log('\nCould not find repo automatically. Using first repo.');
      if (repos.length === 0) {
        console.log('No repositories found.');
        return;
      }
    }
    
    console.log(`\nCreating issue in: ${repoName.full_name}`);
    
    const { data: issue } = await octokit.issues.create({
      owner: repoName.owner.login,
      repo: repoName.name,
      title: issueTitle,
      body: issueBody,
      labels: ['enhancement']
    });
    
    console.log(`\nIssue created successfully!`);
    console.log(`Issue #${issue.number}: ${issue.title}`);
    console.log(`URL: ${issue.html_url}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.status === 404) {
      console.log('Repository not found or no access.');
    }
  }
}

createIssue();
