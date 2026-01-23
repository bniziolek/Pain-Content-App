import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
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

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  const owner = 'bniziolek';
  const repo = 'Pain-Content-App';
  const prNumber = 100;
  
  console.log(`Fetching PR #${prNumber} from ${owner}/${repo}...`);
  
  // Get PR details
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });
  
  console.log('\n========================================');
  console.log('PR #100: ' + pr.title);
  console.log('========================================');
  console.log('State:', pr.state);
  console.log('Author:', pr.user?.login);
  console.log('Created:', pr.created_at);
  console.log('Base:', pr.base.ref, '← Head:', pr.head.ref);
  console.log('\nDescription:');
  console.log(pr.body || '(no description)');
  
  // Get all reviews
  const { data: reviews } = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number: prNumber
  });
  
  if (reviews.length > 0) {
    console.log('\n========================================');
    console.log('REVIEWS');
    console.log('========================================');
    reviews.forEach(review => {
      console.log(`\n[${review.state}] by ${review.user?.login}:`);
      if (review.body) console.log(review.body);
    });
  }
  
  // Get review comments (inline code comments)
  const { data: reviewComments } = await octokit.pulls.listReviewComments({
    owner,
    repo,
    pull_number: prNumber
  });
  
  if (reviewComments.length > 0) {
    console.log('\n========================================');
    console.log('CODE REVIEW COMMENTS (Inline)');
    console.log('========================================');
    reviewComments.forEach(c => {
      console.log(`\n--- ${c.user?.login} on ${c.path}:${c.line || c.original_line} ---`);
      console.log(c.body);
    });
  } else {
    console.log('\n(No inline code review comments)');
  }
  
  // Get issue/PR comments (general comments)
  const { data: issueComments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber
  });
  
  if (issueComments.length > 0) {
    console.log('\n========================================');
    console.log('GENERAL COMMENTS');
    console.log('========================================');
    issueComments.forEach(c => {
      console.log(`\n--- ${c.user?.login} ---`);
      console.log(c.body);
    });
  }
  
  // Get files changed
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });
  
  console.log('\n========================================');
  console.log('FILES CHANGED (' + files.length + ')');
  console.log('========================================');
  files.forEach(f => {
    console.log(`${f.status}: ${f.filename} (+${f.additions}/-${f.deletions})`);
  });
}

main().catch(console.error);
