# Agent Start Here

Use this document as the single entry point for agents. It points to the authoritative sources for architecture, development workflow, operations, and product context. Follow the links in the order below unless a task explicitly says otherwise.

## 0) Session Start (do this first, every session)

1. Check `docs/agent-sessions/ACTIVE_SESSION.md` — in-progress work from a prior session
2. Run `git log --oneline -10` — orient to recent changes
3. Read the GitHub issue you are solving before writing any code
4. Read the full agent protocol: `docs/agent-framework/AGENT_EXPECTATIONS.md`

**At session end:** Update `docs/agent-sessions/ACTIVE_SESSION.md` using the
template at `docs/agent-framework/SESSION_HANDOFF_TEMPLATE.md`.

## Multi-Agent Framework
- `docs/agent-framework/AGENT_EXPECTATIONS.md`: Complete rules for all agents — architecture enforcement, decision gates, HIPAA compliance, breadcrumb system, and cross-agent compatibility notes
- `docs/agent-framework/SESSION_HANDOFF_TEMPLATE.md`: Template for session-end handoffs
- `docs/agent-sessions/ACTIVE_SESSION.md`: Live session state — read at start, overwrite at end

## 1) Architecture Rules (must-read)
- `docs/architecture/ARCHITECTURE.md`: Layer definitions, responsibilities, and import rules.
- `docs/architecture/README.md`: Architecture index and related references.

## 2) Development Workflow (how we build)
- `docs/developer/DEVELOPMENT_WORKFLOW.md`: Standard issue → develop → test flow.
- `docs/developer/STYLE_GUIDE.md`: Naming, formatting, and code conventions.
- `docs/developer/SCRIPTS_AND_TOOLS.md`: Scripts and how to run them.

## 3) Data, APIs, and Integrations (when relevant)
- `docs/data/ENVIRONMENT_REFERENCE.md`: Required env vars and where used.
- `docs/data/database-schema.md`: Data model reference.
- `docs/api/api-reference.md`: API contracts.
- `docs/api/API_EXAMPLES.md`: Example requests/responses.
- `docs/data/INTEGRATIONS.md`: External services and config details.

## 4) Operations and Troubleshooting (when relevant)
- `docs/operations/OPERATIONS_RUNBOOK.md`: Deploy, triage, and runbook.
- `docs/operations/TROUBLESHOOTING_PLAYBOOK.md`: First-response steps.
- `docs/operations/troubleshooting-guide.md`: Deeper troubleshooting.

## 5) Product Context (when needed)
- `docs/product/FEATURE_CATALOG.md`: Feature-to-code map.
- `docs/product/FEATURE_WALKTHROUGHS.md`: Feature tours and screenshots.
- `docs/product/assessment-builder-guide.md`: Assessment configuration.
- `docs/product/patient-portal-flow.md`: Patient portal flow details.
- `docs/product/recommendation-engine.md`: Recommendation logic.

## 6) Testing (when changes are made)
- `docs/testing/TEST_STRATEGY.md`: Test scope and guidance.
- `docs/testing/test-plan.md`: Manual test plan.
- `docs/testing/SCREENSHOT_GUIDE.md`: Screenshot capture checklist.
