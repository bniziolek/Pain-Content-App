import { getUncachableGitHubClient } from '../server/github';

async function findRepo() {
  try {
    const octokit = await getUncachableGitHubClient();
    const { data: user } = await octokit.users.getAuthenticated();
    console.log('Authenticated as:', user.login);
    
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({ 
      per_page: 20,
      sort: 'updated'
    });
    console.log('\nRecent repos:');
    repos.forEach(r => console.log(`  - ${r.full_name} (${r.private ? 'private' : 'public'})`));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

findRepo();
