# Architecture Migration Task List

This document enumerates concrete tasks required to align the current codebase with the layered architecture in `docs/architecture/ARCHITECTURE.md`.

## Migration Status: COMPLETE ✓

**Verified: 2026-01-22**

All critical architecture migration tasks have been completed. The codebase now follows the 5-layer domain-driven design pattern.

---

## Completed Tasks

### 1) Route Rewiring (COMPLETE)

All routes are now wired to application services; no direct storage/infra imports remain in `server/routes/*`.

**Completed rewires:**
- Messaging routes → `server/application/messaging/*`
- Favorites routes → `server/application/favorites/*`
- Collections routes → `server/application/collections/*`
- Assessments routes → `server/application/assessments/*`
- Assessment invites routes → `server/application/assessment-invites/*`
- Recommendations routes → `server/application/recommendations/*`
- Content routes → `server/application/content/*`
- Public content routes → `server/application/public-content/*`
- Pathways routes → `server/application/pathways/*`
- Subscription routes → `server/application/subscription/*`
- Feature flags routes → `server/application/feature-flags/*`
- Admin routes → `server/application/admin/*`
- Compliance routes → `server/application/compliance/*`
- Onboarding routes → `server/application/onboarding/*`
- PDF routes → `server/application/pdf/*`
- Stats routes → `server/application/stats/*`
- Content recommendations routes → `server/application/content-recommendations/*`
- Password reset routes → `server/application/password-reset/*`
- Patient portal routes → `server/application/patient-portal/*`
- Auth routes → `server/application/auth/*`
- Webhooks routes → `server/application/webhooks/*`

### 2) Legacy Module Removal (COMPLETE)

All root-level legacy modules have been removed:
- ✓ Removed `server/recommendation.ts` → moved to `server/application/recommendations/`
- ✓ Removed `server/scoring.ts` → moved to `server/application/assessments/`
- ✓ Removed `server/audit.ts` → replaced with `server/infrastructure/audit/`
- ✓ Removed `server/stripeClient.ts` → replaced with `server/infrastructure/payment/`
- ✓ Removed `server/gmail.ts` → replaced with `server/infrastructure/email/`
- ✓ Removed `server/contentful.ts` → replaced with `server/infrastructure/cms/`
- ✓ Removed `server/pdf-generator.ts` → replaced with `server/infrastructure/pdf/`
- ✓ Removed `server/resend.ts` → consolidated into email adapter
- ✓ Removed `server/github.ts` → no longer needed
- ✓ Removed `server/webhookHandlers.ts` → moved to `server/application/webhooks/`
- ✓ Removed `server/routes.legacy.ts` → all routes migrated

### 3) Auth and RBAC Refactoring (COMPLETE)

- ✓ Auth routes moved to `server/routes/auth.ts` calling application services
- ✓ Password hashing utilities moved to `server/domain/password.ts` (pure domain module)
- ✓ RBAC middleware uses `checkUserPermission` from application services
- ✓ `server/auth.ts` now only handles Passport/session initialization (infrastructure)
- ✓ `server/rbac.ts` separated: pure permission logic in `server/rbac-policy.ts`, storage-backed checks via application services

### 4) Background Jobs and Webhooks (COMPLETE)

- ✓ Background jobs route through application services (`server/application/background-jobs/`)
- ✓ `server/background-jobs.ts` is now a thin wrapper calling `startBackgroundJobs()` from application layer
- ✓ Webhook processing moved to `server/application/webhooks/stripe-webhooks.ts`
- ✓ Webhook routes registered via `server/routes/webhooks.ts`

### 5) Data Layer API Alignment (COMPLETE)

All previously missing storage methods have been implemented:
- ✓ `storage.getMilestonesByPathwayId()` - implemented
- ✓ `storage.getPatientPathwaysByClinicianId()` - implemented
- ✓ `storage.getAllRecommendationConfigs()` - implemented
- ✓ `storage.getFeatureFlagHistory()` - implemented
- ✓ `storage.getFeatureFlagHistoryByKey()` - implemented
- ✓ Application services use correct storage method signatures
- ✓ ESM module compatibility fixed (proper `import type` / `export type` syntax)

### 6) Application Service Consolidation (COMPLETE)

- ✓ Scoring logic moved to `server/application/assessments/score-assessment.ts`
- ✓ Recommendation engine in `server/application/recommendations/recommendation-engine.ts`
- ✓ Domain logic remains pure in `server/domain/` (scoring algorithms, access codes, password hashing)
- ✓ Routes use centralized `AppContext` wiring with infrastructure adapters
- ✓ Application services use `AuditRequestContext` instead of Express `Request` types
- ✓ Stripe and CMS access flow through `ctx.payment` and `ctx.cms`

### 7) Testing and Verification (COMPLETE)

- ✓ All 41 API tests passing
- ✓ E2E tests passing (pdf-generation, clinician roles, dashboard, content flows)
- ✓ Tests are mode-aware (packet vs email content delivery)
- ✓ Application boots and runs successfully

---

## Architecture Layers Verified

```
Routes (thin controllers)
    ↓ validate input, call application services
Application Services (orchestration via AppContext)
    ↓ coordinate domain/infrastructure/storage
Domain Services (pure business logic)
    ↓ scoring algorithms, access codes, password hashing
Infrastructure Services (external integrations)
    ↓ email, payment, CMS, audit adapters
Data Layer (storage abstraction)
    ↓ Drizzle ORM database access
```

---

## Remaining Optional Improvements

These are enhancement opportunities, not blockers:

### Validation (Manual Testing)
- [ ] Validate Stripe payment adapter behavior (`ctx.payment.runSync`, publishable key resolution) in staging environment
- [ ] Confirm content recommendation filtering requirements and whether storage should accept filters directly

### Future Enhancements
- [ ] Consider adding integration tests for payment flows
- [ ] Document infrastructure adapter patterns for future developers
- [ ] Add E2E tests that force both packet and email modes to exercise all branches

---

## Scope Reviewed

- Server routes and entrypoints: `server/routes/*.ts`, `server/routes/index.ts`, `server/index.ts`
- Server services and modules: `server/*.ts`, `server/domain/*`, `server/infrastructure/*`
- Application layer modules: `server/application/*`
- Storage layer: `server/storage.ts`
