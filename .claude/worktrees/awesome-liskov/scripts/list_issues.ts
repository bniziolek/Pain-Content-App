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

    const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 10
    });

    console.log(JSON.stringify(issues.map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        updated_at: i.updated_at,
        labels: i.labels.map((l: any) => typeof l === 'string' ? l : l.name)
    })), null, 2));
}

main().catch(e => console.error(e.message));
