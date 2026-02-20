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
        console.error('Usage: npx tsx scripts/fetch_pr_diff.ts <pr_number>');
        process.exit(1);
    }

    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });

    const remoteUrl = execSync('git remote get-url origin 2>/dev/null').toString().trim();
    const parts = remoteUrl.replace('git@github.com:', '').replace('https://github.com/', '').replace('.git', '').split('/');
    const owner = parts[0];
    const repo = parts[1];

    const { data: files } = await octokit.pulls.listFiles({ owner, repo, pull_number: prNumber });

    console.log(`Files changed in PR #${prNumber}:`);
    files.forEach(f => {
        console.log(`- ${f.filename} (${f.status})`);
        if (f.patch) {
            console.log(`\nPatch:\n${f.patch}\n`);
        }
    });
}

main().catch(e => console.error(e.message));
