# Merge Process

Standard workflow for developing, testing, and merging code changes in RehabPilot.

---

## Development Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Develop   │ -> │  Automated  │ -> │ Write Test  │ -> │   Manual    │ -> │    Merge    │
│   Feature   │    │    Tests    │    │    Plan     │    │     QA      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Step 1: Develop Feature

- Implement the feature or fix
- Follow code conventions in the codebase
- Test locally during development
- Commit regularly with descriptive messages

---

## Step 2: Automated Testing

- Run any existing automated tests
- Verify no regressions introduced
- Fix any failing tests before proceeding

```bash
# Run tests (when available)
npm test
```

---

## Step 3: Write/Update Test Plan

**Required for every merge.**

### For New Features:
Add test cases to `docs/test-plan.md` covering:
- Happy path (feature works as expected)
- Edge cases (empty states, max limits)
- Error handling (invalid input, failures)
- Interaction with existing features

### For Bug Fixes:
Add test case that:
- Reproduces the original bug (should now pass)
- Verifies the fix doesn't break related functionality

### Test Case Format:
```markdown
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| X.X.X | Description | 1. Do this 2. Do that | What should happen | ☐ |
```

---

## Step 4: Manual QA

### Before Testing:
1. Review the test plan section(s) relevant to your changes
2. Ensure the app is running (`npm run dev`)
3. Use a fresh browser/incognito if testing auth

### During Testing:
1. Execute each test case step-by-step
2. Mark Pass (✓) or Fail (✗) for each
3. For failures:
   - Note the actual vs expected behavior
   - Capture screenshots if helpful
   - Log browser console errors

### After Testing:
1. If all tests pass → Proceed to merge
2. If any tests fail → Return to Step 1, fix issues, re-test

---

## Step 5: Merge

### Pre-Merge Checklist:
- [ ] All automated tests pass
- [ ] Test plan updated for changes
- [ ] All relevant manual tests pass
- [ ] No console errors in browser
- [ ] App runs without crashes

### Merge:
- Commit final changes
- Create checkpoint/save point
- Document what was merged in changelog (optional)

---

## Quick Reference

### For Minor Changes (UI tweaks, copy changes):
- Automated tests (if applicable)
- Quick visual check
- Update test plan if UI behavior changed

### For Feature Additions:
- Full workflow above
- Add new section to test plan
- Test integration with existing features

### For Bug Fixes:
- Add regression test to plan
- Test the fix
- Test related functionality didn't break

### For Security/Auth Changes:
- Full test plan execution for auth section
- Test as multiple user types
- Verify session handling

---

## Test Execution Log

After each QA session, log results in `docs/test-plan.md`:

```markdown
| Date | Tester | Scope | Results | Notes |
|------|--------|-------|---------|-------|
| 2024-01-15 | Sarah | Email Settings | 12/12 Pass | All good |
| 2024-01-14 | Sarah | Full App | 45/47 Pass | 2 minor issues logged |
```

---

## Rollback

If issues are found after merge:
1. Use Replit's checkpoint rollback feature
2. Document what went wrong
3. Update test plan to catch the issue next time
