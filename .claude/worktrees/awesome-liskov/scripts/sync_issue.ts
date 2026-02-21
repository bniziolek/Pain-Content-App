import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

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
    const issueNumber = parseInt(process.argv[2], 10);
    if (!issueNumber) {
        console.error('Usage: npx tsx scripts/sync_issue.ts <issue_number>');
        process.exit(1);
    }

    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });

    const owner = "bniziolek";
    const repo = "Pain-Content-App";

    const { data: issue } = await octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber
    });

    const content = `# Issue #${issue.number}: ${issue.title}

**State**: ${issue.state}
**Labels**: ${issue.labels.map((l: any) => typeof l === 'string' ? l : l.name).join(', ')}
**Created**: ${issue.created_at}
**Updated**: ${issue.updated_at}
**URL**: ${issue.html_url}

---

${issue.body}
`;

    const issuesDir = path.join(process.cwd(), 'issues');
    if (!fs.existsSync(issuesDir)) {
        fs.mkdirSync(issuesDir);
    }

    const filePath = path.join(issuesDir, `${issue.number}.md`);
    fs.writeFileSync(filePath, content);
    console.log(`Synced issue #${issue.number} to ${filePath}`);
}

main().catch(e => console.error(e.message));
