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
  
  const issueTitle = "Convert Contentful API calls to daily batch sync process";
  const issueBody = `## Summary
Convert the Contentful content retrieval from real-time API calls to a daily batch process that syncs content to the PostgreSQL database. Users will query the local database directly instead of making live Contentful API calls.

## Problem
Currently, the application may make frequent API calls to Contentful for content retrieval, which:
- Consumes API call quota with Contentful
- Adds latency to user requests
- Creates dependency on Contentful availability for each request
- Increases costs as usage scales

## Proposed Solution

### Daily Batch Sync Process
Implement a scheduled job that runs daily (or on-demand) to:
1. **Fetch all content** from Contentful CMS
2. **Transform content** to match the local database schema
3. **Upsert records** in PostgreSQL (insert new, update existing)
4. **Handle deletions** by marking content as inactive or removing orphaned records
5. **Log sync results** for monitoring and debugging

### Implementation Details

#### Sync Script
- Create/update \`scripts/sync-contentful.ts\` to handle the batch sync
- Run via \`npm run contentful:sync\`
- Support both full sync and incremental sync modes
- Handle pagination for large content sets
- Implement error handling and retry logic

#### Database Changes
- Ensure \`content_items\` table stores all necessary Contentful fields
- Add \`contentfulId\` column for mapping to source records
- Add \`syncedAt\` timestamp to track when content was last synced
- Add \`isActive\` flag to handle soft deletes

#### Scheduling Options
1. **Cron job** - Schedule daily execution (e.g., 2:00 AM)
2. **Manual trigger** - Admin button to force sync
3. **Webhook** - Contentful webhook on publish to trigger sync

#### Application Changes
- Remove direct Contentful API calls from route handlers
- Query PostgreSQL \`content_items\` table for all content
- Add cache layer (optional) for frequently accessed content
- Implement fallback to Contentful if database is empty (initial setup)

### Sync Script Features
- Progress logging with item counts
- Error handling with detailed messages
- Dry-run mode for testing
- Sync specific content types only (optional)
- Report orphaned records

## Benefits
- **Reduced API costs** - One daily sync vs. per-request calls
- **Lower latency** - Database queries are faster than API calls
- **Improved reliability** - App works even if Contentful is temporarily unavailable
- **Better scalability** - Database handles concurrent reads efficiently
- **Audit trail** - Track when content was synced

## Acceptance Criteria
- [ ] Sync script fetches all content types from Contentful
- [ ] Content is correctly mapped and stored in PostgreSQL
- [ ] Script handles updates to existing content
- [ ] Script handles deleted content appropriately
- [ ] Application reads content from database, not Contentful API
- [ ] Sync can be triggered manually via npm script
- [ ] Sync logs results (items synced, errors, duration)
- [ ] Documentation updated with sync instructions

## Technical Notes
- Existing script: \`npm run contentful:sync\` (if already implemented)
- Consider using Contentful's Sync API for incremental updates
- Implement periodic cache cleanup for expired entries

## Priority
High - Reduces ongoing API costs and improves performance

## Labels
enhancement, performance, infrastructure`;

  try {
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 10
    });
    
    const repoName = repos.find(r => r.name.toLowerCase().includes('pain') || r.name.toLowerCase().includes('content'));
    
    if (!repoName) {
      console.log('Could not find repo automatically.');
      if (repos.length === 0) {
        console.log('No repositories found.');
        return;
      }
    }
    
    console.log(`Creating issue in: ${repoName!.full_name}`);
    
    const { data: issue } = await octokit.issues.create({
      owner: repoName!.owner.login,
      repo: repoName!.name,
      title: issueTitle,
      body: issueBody,
      labels: ['enhancement', 'performance']
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
