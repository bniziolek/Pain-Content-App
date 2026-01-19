import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

async function getAccessToken() {
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
  const data = await res.json() as any;
  const connectionSettings = data.items?.[0];
  return connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
}

async function main() {
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });
  
  const remoteUrl = execSync('git remote get-url origin 2>/dev/null').toString().trim();
  const parts = remoteUrl.replace('git@github.com:', '').replace('https://github.com/', '').replace('.git', '').split('/');
  const owner = parts[0];
  const repo = parts[1];
  
  const issue = await octokit.issues.get({ owner, repo, issue_number: 48 });
  console.log(JSON.stringify(issue.data, null, 2));
}

main().catch(e => console.error(e.message));
