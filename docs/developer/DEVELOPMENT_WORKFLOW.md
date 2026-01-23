# DriverPath Development Workflow

## GitHub Issue → Develop → Test Pattern

This document establishes our standard workflow for developing features and bug fixes in DriverPath. Following this pattern ensures consistent quality and comprehensive test coverage.

---

## The Three-Phase Workflow

### Phase 1: Pull GitHub Issue

1. **Select an issue** from the GitHub project board
2. **Read and understand** the requirements:
   - What is the expected behavior?
   - What user roles are affected?
   - Are there acceptance criteria?
3. **Identify scope**:
   - Frontend changes needed
   - Backend/API changes needed
   - Database changes needed
   - Which test categories will need updates

### Phase 2: Develop the Feature

1. **Create a task list** breaking down the work
2. **Implement the feature**:
   - Follow existing code patterns
   - Add proper data-testid attributes to new UI elements
   - Document API endpoints if new ones are added
3. **Manual verification**:
   - Test the feature manually
   - Verify on different screen sizes if UI changes

### Phase 3: Add Tests

After the feature is working, add appropriate tests:

#### Decision Tree: Where Should Tests Go?

```
Is this a new API endpoint?
├── Yes → Add to tests/api/
│   └── Create [feature].test.ts or add to existing file
└── No

Is this a UI feature or workflow?
├── Yes → Add to tests/e2e/ or tests/e2e/roles/
│   ├── Authentication related → auth.spec.ts
│   ├── Content/Library related → library.spec.ts
│   ├── PDF/Document related → pdf-generation.spec.ts
│   ├── Clinician-only feature → roles/clinician.spec.ts
│   ├── Admin-only feature → roles/admin.spec.ts
│   └── Patient portal → roles/patient-portal.spec.ts
└── No

Is this a critical path or smoke test?
├── Yes → Add to main tests/e2e/ folder
└── No → Add to tests/e2e/roles/ for in-depth testing
```

---

## Test File Locations

```
tests/
├── api/                           # Fast API integration tests
│   ├── auth.test.ts               # Login, logout, session
│   ├── content.test.ts            # Content CRUD, PDF generation
│   ├── assessments.test.ts        # Assessments, invites, screenings
│   └── health.test.ts             # Health checks
│
└── e2e/                           # Browser-based E2E tests
    ├── auth.spec.ts               # Smoke: Login flow
    ├── library.spec.ts            # Smoke: Content library
    ├── pdf-generation.spec.ts     # Smoke: PDF features
    │
    └── roles/                     # In-depth role-based tests
        ├── clinician.spec.ts      # All clinician functions
        ├── admin.spec.ts          # All admin functions
        ├── unauthenticated.spec.ts# Public pages, access control
        └── patient-portal.spec.ts # Patient portal features
```

---

## Adding Tests for New Features

### For API Changes

1. Open the relevant `tests/api/[feature].test.ts`
2. Add a new `describe` block for your endpoint
3. Include tests for:
   - Success cases (200 responses)
   - Validation errors (400 responses)
   - Authentication requirements (401 responses)
   - Authorization checks (403 responses)

Example:
```typescript
describe('POST /api/new-feature', () => {
  it('should create item with valid data', async () => {
    const response = await agent
      .post('/api/new-feature')
      .send({ name: 'Test', value: 123 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it('should reject invalid data', async () => {
    const response = await agent
      .post('/api/new-feature')
      .send({ name: '' });
    
    expect(response.status).toBe(400);
  });
});
```

### For UI Changes

1. Identify the appropriate spec file
2. Add tests that simulate user interactions
3. Use data-testid attributes for reliable selectors

Example:
```typescript
test('should open new feature modal', async ({ page }) => {
  await page.goto('/feature-page');
  
  // Click the button
  await page.click('[data-testid="button-open-feature"]');
  
  // Verify modal opens
  await expect(page.locator('[data-testid="feature-modal"]')).toBeVisible();
  
  // Fill in form
  await page.fill('[data-testid="input-feature-name"]', 'Test Name');
  
  // Submit
  await page.click('[data-testid="button-submit-feature"]');
  
  // Verify success
  await expect(page.locator('text=/success|created/i')).toBeVisible();
});
```

---

## Test Data Guidelines

### Test Credentials
- **Admin/Clinician**: admin@driverpath.com / admin123
- **Test data**: Use descriptive names like `Test_Feature_${Date.now()}`

### Data-Testid Conventions
- Buttons: `button-[action]` (e.g., `button-submit`, `button-cancel`)
- Inputs: `input-[field]` (e.g., `input-email`, `input-patient-name`)
- Cards: `card-[type]-${id}` (e.g., `card-content-abc123`)
- Modals: `modal-[name]` (e.g., `modal-send-content`)

---

## Running Tests During Development

### Quick Validation
```bash
./scripts/test.sh smoke
```

### Test Specific Feature
```bash
./scripts/test.sh feature [feature-name]
```

### Full Test Suite Before PR
```bash
./scripts/test.sh full
```

### Interactive Menu
```bash
./scripts/test.sh
```

---

## Checklist Before Closing an Issue

- [ ] Feature implemented and working
- [ ] Manual testing completed
- [ ] API tests added (if applicable)
- [ ] UI tests added (if applicable)
- [ ] All existing tests still pass (`./scripts/test.sh smoke`)
- [ ] Documentation updated (if needed)
- [ ] replit.md updated with new features

---

## Example: Complete Workflow

### Issue: Add "Share via Link" feature

**Phase 1: Understand**
- New feature allowing clinicians to share content via link
- Affects: Library page, new API endpoint
- Tests needed: API test for link generation, E2E test for UI flow

**Phase 2: Develop**
1. Add `POST /api/content/share-link` endpoint
2. Add share button to content cards
3. Add share modal with link display
4. Add data-testid attributes to all new elements

**Phase 3: Test**
1. Add to `tests/api/content.test.ts`:
   ```typescript
   describe('POST /api/content/share-link', () => {
     it('should generate share link', async () => { ... });
     it('should reject without auth', async () => { ... });
   });
   ```

2. Add to `tests/e2e/roles/clinician.spec.ts`:
   ```typescript
   test.describe('Share via Link', () => {
     test('should open share modal', async () => { ... });
     test('should copy link to clipboard', async () => { ... });
   });
   ```

3. Run tests:
   ```bash
   ./scripts/test.sh feature share
   ./scripts/test.sh smoke
   ```

4. Close issue with confidence!

---

## Maintenance

- **Weekly**: Run full test suite to catch regressions
- **Before releases**: Run `./scripts/test.sh full`
- **After major refactors**: Run role-specific tests for affected areas

---

*This workflow ensures every feature is properly tested and maintains the quality of DriverPath.*
