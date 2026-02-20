#!/usr/bin/env node
// PostToolUse hook: run TypeScript type check after edits to server/ or shared/ files.
// Catches type errors early before they surface in CI or break the multi-agent handoff.

const { execSync } = require('child_process');

const input = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');
const filePath = input.file_path || '';

// Normalize path separators for cross-platform matching
const normalized = filePath.replace(/\\/g, '/');

const needsCheck =
  normalized.includes('/server/') ||
  normalized.includes('/shared/') ||
  normalized.endsWith('/server') ||
  normalized.endsWith('/shared');

if (!needsCheck) process.exit(0);

console.log('[ts-check] Server/shared file edited — running npm run check...');

try {
  execSync('npm run check', { stdio: 'inherit' });
  console.log('[ts-check] TypeScript check passed.');
} catch {
  // Report errors but don't block the edit — TS errors are surfaced, not enforced here.
  // The CI pipeline enforces them before merge.
  console.error('[ts-check] TypeScript errors detected — review before committing.');
}
