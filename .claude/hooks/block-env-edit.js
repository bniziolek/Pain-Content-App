#!/usr/bin/env node
// PreToolUse hook: block Claude from editing .env files directly.
// HIPAA environment — .env files contain database credentials, session secrets,
// Stripe keys, and other sensitive values that must be edited manually.

const input = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');
const filePath = input.file_path || '';

if (/\.env(\.(local|example|production|development|test))?$/.test(filePath)) {
  console.error(
    'BLOCKED: .env files contain HIPAA-sensitive credentials (DB, Stripe, session secrets).\n' +
    'Edit them manually to prevent accidental exposure. If you need to add a new variable,\n' +
    'update .env.example and docs/data/ENVIRONMENT_REFERENCE.md instead.'
  );
  process.exit(2);
}
