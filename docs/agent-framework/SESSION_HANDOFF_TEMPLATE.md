# Session Handoff Template

Use this template when updating `docs/agent-sessions/ACTIVE_SESSION.md` at the
end of a session. Copy the template, fill it in completely, and overwrite the
active session file.

---

```markdown
# Active Session State
Last updated: YYYY-MM-DD HH:MM UTC
Agent: [Claude Code / Codex / Antigravity IDE / Replit AI]
GitHub Issue: #[number] — [title]
Branch: [branch-name]

---

## Session Summary
[1-3 sentences: what was the goal of this session?]

---

## What Was Accomplished

- [Specific thing done, with file paths where relevant]
- [Another thing done]
- [...]

---

## Current State

**Status:** [Complete / In Progress / Blocked]

**What is working:**
- [Feature or behavior that is working as expected]

**What is NOT working / incomplete:**
- [Specific thing still broken or not done]
- [Why it is not done (ran out of time, blocked by decision, etc.)]

---

## Next Steps for the Next Agent

Do these in order:

1. [First exact action — be specific about the file and what to do]
2. [Second action]
3. [...]

> Note: If any of these require human approval (schema changes, security changes,
> new dependencies), mark them clearly and do not proceed until confirmed.

---

## Decisions Made This Session

Record any significant decision with its rationale. This prevents the next
agent from re-litigating settled questions.

| Decision | Reasoning | Alternatives Rejected |
|----------|-----------|----------------------|
| [What was decided] | [Why] | [What else was considered] |

---

## Open Questions for the Human

List anything that requires human input before the next agent can proceed:

- [ ] [Question or decision needed]
- [ ] [...]

---

## In-Code Breadcrumbs

List any `// TODO[AGENT]:` comments left in the code, with file:line locations:

- `server/routes/example.ts:42` — Add Zod validation for the new `maxAttempts` field
- `client/src/components/Example.tsx:88` — Wire up the submit handler to the API

---

## Test Status

- [ ] `./scripts/test.sh smoke` — [PASS / FAIL / NOT RUN]
- [ ] Relevant feature tests — [PASS / FAIL / NOT RUN]
- [ ] If FAIL: [describe what is failing and why]

---

## Context Needed to Resume

Any additional context that helps the next agent get oriented quickly:

[Free-form notes, e.g., "The Stripe webhook handler was temporarily disabled
during testing — re-enable it before final testing by uncommenting line 77
in server/infrastructure/payment/stripe.service.ts"]
```

---

## Tips for Writing Good Handoffs

**Be specific about file paths.** "Updated the route" is not helpful.
"Added validation to `server/routes/assessments.ts:134`" is.

**Explain decisions, not just actions.** The next agent needs to understand
*why* you did something to avoid undoing it.

**Flag the exact resume point.** The next agent should know the first command
to run and the first file to open.

**Be honest about broken state.** If tests are failing, say so and explain
what you know about why. Do not mark work as complete when it is not.

**Short is fine.** A great handoff takes 5-10 minutes to write. If you find
yourself writing paragraphs, distill to bullets.
