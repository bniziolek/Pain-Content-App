import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

async function getAccessToken(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const res = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  const data = await res.json() as { items?: { settings?: { access_token?: string; oauth?: { credentials?: { access_token?: string } } } }[] };
  const connectionSettings = data.items?.[0];
  return connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token || '';
}

async function main() {
  const prNumber = parseInt(process.argv[2], 10);
  if (!prNumber) {
    console.error('Usage: npx tsx scripts/fetch_pr_review.ts <pr_number>');
    process.exit(1);
  }

  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });
  
  const remoteUrl = execSync('git remote get-url origin 2>/dev/null').toString().trim();
  const parts = remoteUrl.replace('git@github.com:', '').replace('https://github.com/', '').replace('.git', '').split('/');
  const owner = parts[0];
  const repo = parts[1];
  
  console.log(`Fetching PR #${prNumber} from ${owner}/${repo}...\n`);
  
  // Get issue/PR comments
  const comments = await octokit.issues.listComments({ owner, repo, issue_number: prNumber });
  if (comments.data.length > 0) {
    console.log("=== Issue/PR Comments ===\n");
    comments.data.forEach(c => {
      console.log(`Author: ${c.user?.login}`);
      console.log(`Date: ${c.created_at}`);
      console.log(`Body:\n${c.body}\n`);
      console.log("---\n");
    });
  }
  
  // Get PR review comments (code-level)
  const reviewComments = await octokit.pulls.listReviewComments({ owner, repo, pull_number: prNumber });
  if (reviewComments.data.length > 0) {
    console.log("\n=== Code Review Comments ===\n");
    reviewComments.data.forEach(c => {
      console.log(`File: ${c.path}`);
      console.log(`Line: ${c.line}`);
      console.log(`Author: ${c.user?.login}`);
      console.log(`Body:\n${c.body}\n`);
      console.log("---\n");
    });
  }
  
  // Get PR reviews
  const reviews = await octokit.pulls.listReviews({ owner, repo, pull_number: prNumber });
  if (reviews.data.length > 0) {
    console.log("\n=== PR Reviews ===\n");
    reviews.data.forEach(r => {
      console.log(`Reviewer: ${r.user?.login}`);
      console.log(`State: ${r.state}`);
      console.log(`Body:\n${r.body || '(no body)'}\n`);
      console.log("---\n");
    });
  }
}

main().catch(e => console.error(e.message));
