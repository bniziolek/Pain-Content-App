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
  
  // First get the authenticated user to find repos
  const { data: user } = await octokit.users.getAuthenticated();
  console.log('Authenticated as:', user.login);
  
  // List repos to find the right one
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({ per_page: 10, sort: 'updated' });
  console.log('\nRecent repos:');
  repos.forEach(r => console.log(`- ${r.full_name}`));
  
  // Try to find DriverPath repo
  const driverPathRepo = repos.find(r => r.name.toLowerCase().includes('driverpath') || r.name.toLowerCase().includes('driver'));
  
  if (driverPathRepo) {
    console.log(`\nChecking PR #100 in ${driverPathRepo.full_name}...`);
    try {
      const { data: pr } = await octokit.pulls.get({
        owner: driverPathRepo.owner.login,
        repo: driverPathRepo.name,
        pull_number: 100
      });
      console.log('\n=== PR #100 ===');
      console.log('Title:', pr.title);
      console.log('State:', pr.state);
      console.log('Author:', pr.user?.login);
      console.log('Body:', pr.body?.substring(0, 500) || '(no description)');
      
      // Get review comments
      const { data: reviewComments } = await octokit.pulls.listReviewComments({
        owner: driverPathRepo.owner.login,
        repo: driverPathRepo.name,
        pull_number: 100
      });
      
      console.log('\n=== Review Comments ===');
      if (reviewComments.length === 0) {
        console.log('No review comments found.');
      } else {
        reviewComments.forEach(c => {
          console.log(`\n--- Comment by ${c.user?.login} ---`);
          console.log('File:', c.path);
          console.log('Line:', c.line || c.original_line);
          console.log('Body:', c.body);
        });
      }
      
      // Also get issue comments
      const { data: issueComments } = await octokit.issues.listComments({
        owner: driverPathRepo.owner.login,
        repo: driverPathRepo.name,
        issue_number: 100
      });
      
      if (issueComments.length > 0) {
        console.log('\n=== Issue/PR Comments ===');
        issueComments.forEach(c => {
          console.log(`\n--- Comment by ${c.user?.login} ---`);
          console.log('Body:', c.body);
        });
      }
      
    } catch (e: any) {
      console.log('Error fetching PR:', e.message);
    }
  } else {
    console.log('\nNo DriverPath repo found. Checking all repos for PR #100...');
    for (const repo of repos.slice(0, 3)) {
      try {
        const { data: pr } = await octokit.pulls.get({
          owner: repo.owner.login,
          repo: repo.name,
          pull_number: 100
        });
        console.log(`\nFound PR #100 in ${repo.full_name}: ${pr.title}`);
      } catch (e) {
        // PR doesn't exist in this repo
      }
    }
  }
}

main().catch(console.error);
