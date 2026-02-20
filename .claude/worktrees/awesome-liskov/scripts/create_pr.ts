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
    const head = "issue-39";
    const base = "main";
    const title = "Issue #39: Content Packet Access Codes Implementation";
    const body = `This PR implements the Content Packet Access Codes feature as described in issue #39.

Key changes:
- Access code generation with variety-rich prefixes and collision handling.
- Database schema for \`packet_access_codes\`.
- Public lookup endpoint with rate limiting.
- PDF integration (Access code and QR code visibility).
- Frontend lookup page with mobile support.
- Unit and integration tests for new functionality.

Refined requirements were documented in \`docs/issue-39-refined.md\`.`;

    try {
        const { data: pr } = await octokit.pulls.create({
            owner,
            repo,
            title,
            head,
            base,
            body,
        });

        console.log(`PR created successfully: ${pr.html_url}`);
    } catch (e: any) {
        if (e.errors?.[0]?.message?.includes('A pull request already exists')) {
             const { data: prs } = await octokit.pulls.list({
                owner,
                repo,
                head: `${owner}:${head}`,
                base,
                state: 'open'
            });
            if (prs.length > 0) {
                console.log(`A PR already exists for this branch: ${prs[0].html_url}`);
            } else {
                console.error(`Error: ${e.message}`);
                console.error(JSON.stringify(e.errors, null, 2));
            }
        } else {
            console.error(`Error: ${e.message}`);
            if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
        }
    }
}

main().catch(e => console.error(e.message));
