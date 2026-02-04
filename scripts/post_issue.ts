import { Octokit } from '@octokit/rest';

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
    const title = process.argv[2];
    const body = process.argv[3] || '';
    const labelsStr = process.argv[4] || '';

    if (!title) {
        console.error('Usage: npx tsx scripts/post_issue.ts "Title" "Body" "label1,label2"');
        process.exit(1);
    }

    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });

    const owner = "bniziolek";
    const repo = "Pain-Content-App";

    const labels = labelsStr.split(',').filter(l => l.trim() !== '');

    const { data: issue } = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels: labels.length > 0 ? labels : undefined
    });

    console.log(`Created issue #${issue.number}: ${issue.html_url}`);
}

main().catch(e => console.error(e.message));
