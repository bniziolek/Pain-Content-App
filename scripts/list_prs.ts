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
    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });

    const owner = "bniziolek";
    const repo = "Pain-Content-App";

    const { data: prs } = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc'
    });

    console.log(JSON.stringify(prs.map(p => ({
        number: p.number,
        title: p.title,
        user: p.user?.login,
        updated_at: p.updated_at
    })), null, 2));
}

main().catch(e => console.error(e.message));
