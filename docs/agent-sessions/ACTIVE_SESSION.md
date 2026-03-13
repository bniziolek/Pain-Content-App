# Active Session State
Last updated: 2026-03-13 UTC
Agent: GitHub Copilot (GPT-5.3-Codex)
GitHub Issue: #251 - Issue template updates for track-aware design review
Branch: copilot/issue-251

---

## Session Summary

Updated GitHub issue templates so backlog intake captures framework-aware planning metadata while keeping bug intake lightweight.

---

## What Was Accomplished

- Updated `.github/ISSUE_TEMPLATE/feature_request.md` with prompts for:
  - domain ownership
  - track awareness
  - framework alignment
  - decision artifact impact
  - telemetry/reporting impact
  - compliance/human-review implications
- Updated `.github/ISSUE_TEMPLATE/user-story.md` with concise equivalents for the same metadata.
- Left `.github/ISSUE_TEMPLATE/bug_report.md` unchanged by design to avoid overloading bug intake.

---

## Current State

**Status:** Ready for PR

**What is working:**
- Feature and story templates now ask for the required planning metadata before work begins.
- Track-awareness is explicitly requested.
- Existing template frontmatter (labels, names, about text) remains intact.

**What is NOT working / incomplete:**
- Markdown templates can guide required metadata, but do not technically enforce required input at submit time.

---

## Next Steps for the Next Agent

1. If stricter enforcement is needed, migrate templates to GitHub Issue Forms (`.yml`) with required fields.
2. Optionally align track taxonomy terminology in contributor docs (Product/Platform/Compliance/Operations).

---

## Decisions Made This Session

| Decision | Reasoning | Alternatives Rejected |
|----------|-----------|----------------------|
| Keep bug template unchanged | Bug reports should stay focused on reproduction and impact, not full planning intake | Adding architecture/planning prompts to bug intake |
| Update existing templates in place | Matches issue guidance and avoids creating a parallel intake process | Introducing new templates or replacing with a new workflow |

---

## Open Questions for the Human

- [ ] Should we convert these markdown templates to GitHub Issue Forms for hard-required fields?

---

## Test Status

- [ ] `./scripts/test.sh smoke` — NOT RUN (template-only docs change)
