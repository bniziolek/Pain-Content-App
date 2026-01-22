# Architecture Migration Task List

This document enumerates concrete tasks required to align the current codebase with the layered architecture in `docs/ARCHITECTURE.md`.

## Scope Reviewed

- Server routes and entrypoints: `server/routes/*.ts`, `server/routes/index.ts`, `server/index.ts`
- Server services and modules: `server/*.ts`, `server/domain/*`, `server/infrastructure/*`
- Storage layer: `server/storage.ts`

## Primary Gaps vs Architecture

- No application layer exists, while routes contain orchestration, persistence, infrastructure calls, and audit logging.
- Infrastructure services are duplicated in root-level files and in `server/infrastructure`, with inconsistent or broken imports.
- Several routes call storage methods or service signatures that do not exist in `server/storage.ts` or in the referenced service APIs.
- Auth, RBAC, background jobs, and webhooks live outside the layer boundaries and mix concerns.

## Detailed Task List

### 1) Establish the Application Layer

- Create `server/application/` with domain subfolders and barrel exports in `server/application/index.ts` to host orchestration logic.
- Define a common application context (e.g., `IStorage`, audit, email, cms, payment) and update routes to pass dependencies rather than importing `storage` or infrastructure directly.

### 2) Consolidate Infrastructure Services

- Replace root-level email integrations in `server/gmail.ts` and `server/resend.ts` with `server/infrastructure/email/*` and remove or re-export the legacy modules.
- Replace root-level Contentful integration in `server/contentful.ts` with `server/infrastructure/cms/contentful.service.ts` and remove or re-export the legacy module.
- Replace root-level Stripe integration in `server/stripeClient.ts` and `server/stripeService.ts` with `server/infrastructure/payment/*` and remove or re-export the legacy modules.
- Move PDF generation from `server/pdf-generator.ts` into an infrastructure module (e.g., `server/infrastructure/pdf/pdf-generator.ts`) and export through `server/infrastructure`.
- Fix broken imports inside infrastructure services that reference `./storage`, specifically `server/infrastructure/audit/audit.service.ts` and `server/infrastructure/payment/stripe.service.ts`, either by dependency injection or by correcting import paths.
- Decide on a single email provider selection strategy (config-based or runtime) and centralize it in an infrastructure adapter used by application services.
- If GitHub connector functionality is needed, move `server/github.ts` under `server/infrastructure/github/` and wire it through application services; otherwise remove it.

### 3) Extract Application Services from Routes

- `server/routes/messaging.ts`: create application services for sending content emails, resending emails, listing email logs, listing content views, updating email delivery mode, deleting email connections, and building patient summaries; replace direct use of `storage`, `../gmail`, and `../audit` with application calls.
- `server/routes/patient-portal.ts`: create application services for patient portal authentication (lockout logic, session creation), listing patient content with Contentful fallback, and session activity updates; remove direct calls to `storage`, `../contentful`, and `../audit` from the route.
- `server/routes/assessments.ts`: move assessment CRUD, question extraction, and scoring orchestration into application services, using `server/domain/scoring` for pure calculations and application-level storage access.
- `server/routes/assessment-invites.ts`: move invite creation, email sending, invite completion, and results retrieval into application services; ensure scoring and recommendation orchestration happens outside the route.
- `server/routes/recommendations.ts`: move recommendation rule/config CRUD, preview, and generation into application services; move patient recommendations listing into application services.
- `server/routes/content.ts`: move Contentful fallback logic, CRUD, and frequent content queries into application services.
- `server/routes/public-content.ts`: move content view fetch/update and time tracking into application services with Contentful fallback.
- `server/routes/pathways.ts`: move pathway CRUD, milestone management, patient pathway enrollment, and follow-up rule management into application services; keep Contentful fallback logic outside the route.
- `server/routes/subscription.ts`: move checkout, portal, plan listing, and subscription management into application services; routes should call application services that in turn use payment infrastructure and storage.
- `server/routes/feature-flags.ts`: move feature flag listing, admin updates, persona switching, and permission grant/revoke flows into application services.
- `server/routes/admin.ts`: move user management, stats, notes, exports, and recommendation config admin access into application services.
- `server/routes/compliance.ts`: move audit log queries, data inventory CRUD, and analytics into application services.
- `server/routes/onboarding.ts`: move onboarding updates and skip logic into application services.
- `server/routes/pdf.ts`: move screening-based PDF generation and direct content PDF generation into application services that call infrastructure PDF generator and audit logging.
- `server/routes/stats.ts`: move analytics aggregation into application services.
- `server/routes/favorites.ts` and `server/routes/collections.ts`: move CRUD and list logic into application services.
- `server/routes/content-recommendations.ts`: move CRUD and filtering logic into application services and align with data layer interfaces.
- `server/routes/password-reset.ts`: move token creation, validation, and password reset logic into application services; route should only validate input and call the service.
- `server/routes/index.ts`: update route registration to use new application services and remove any dependency on legacy routes or direct storage usage.

### 4) Refactor Auth and RBAC to Match Layers

- Split `setupAuth` in `server/auth.ts` into an infrastructure-level passport/session initializer and move HTTP endpoints (`/api/register`, `/api/login`, `/api/logout`, `/api/user`) into `server/routes/auth.ts` that call application services.
- Move password hashing and comparison utilities out of `server/auth.ts` into a domain or application module so routes do not depend on infrastructure or storage.
- Refactor `server/rbac.ts` to separate pure permission logic from storage-backed checks; expose middleware that calls application services instead of reading storage directly.

### 5) Align Application Logic in Existing Service Modules

- Move `server/scoring.ts` into `server/application/assessments/` (or a new `server/application/scoring/`) and update all call sites to use the application layer; keep `server/domain/scoring` pure.
- Move `server/recommendation.ts` into `server/application/recommendations/` and update all call sites; keep `server/domain/recommendations` pure.
- Replace `server/audit.ts` usage with `server/infrastructure/audit` and route through application services for consistent audit logging.

### 6) Data Layer API Alignment

- Reconcile `server/storage.ts` with actual usage and update routes/application services accordingly.
- Fix mismatched method names such as `storage.getAssessmentInvites` and `storage.getAssessmentInvitesByClinicianId` used in `server/routes/assessment-invites.ts`.
- Replace the nonexistent `storage.completeAssessmentInvite` in `server/routes/assessment-invites.ts` with a proper flow that writes an `AssessmentResponse` and updates invite status via `storage.updateAssessmentInviteStatus`.
- Replace `storage.getPathwayMilestones` in `server/routes/pathways.ts` with `storage.getMilestonesByPathwayId` or add the alias in the interface and implementation.
- Replace `storage.getPatientPathways` in `server/routes/pathways.ts` with `storage.getPatientPathwaysByClinicianId` or add the missing method.
- Update `storage.getContentRecommendations` usage in `server/routes/content-recommendations.ts` to match the interface or extend the interface to accept filters.
- Update `storage.getPatientRecommendations` usage in `server/routes/recommendations.ts` to pass a filters object as defined in `server/storage.ts`.
- Add missing methods referenced by routes but not defined in `server/storage.ts`, including `getAllRecommendationConfigs`, `getFeatureFlagHistory`, `getFeatureFlagHistoryByKey`, `getUserActivityAnalytics`, `getContentUsageAnalytics`, and `getSubscriptionMetrics`, or remove those calls from the routes.
- Fix `storage.updateUser` return expectations in `server/routes/admin.ts` and `server/routes/onboarding.ts` by either returning the updated user from storage or fetching it after update.
- Align `storage.updateUserSubscription` usage in `server/routes/subscription.ts` and `server/routes/admin.ts` with the interface and add a dedicated call to `storage.updateSubscriptionTier` where needed.

### 7) Webhooks and Background Jobs

- Move webhook processing in `server/webhookHandlers.ts` into an application service that uses payment infrastructure; update `server/index.ts` to call it from a dedicated webhook route module.
- Move background jobs in `server/background-jobs.ts` into an application-level scheduler or jobs module that calls application services instead of using storage directly.

### 8) Cleanup and Legacy Removal

- Remove or archive `server/routes.legacy.ts` after confirming all routes have been migrated to `server/routes/*` with application services.
- Remove unused exports and duplicated modules once routes and services reference the new layer boundaries.

### 9) Testing and Verification

- Update unit and API tests to import from application services instead of legacy modules when needed (e.g., tests referencing scoring and recommendation flows).
- Run API and E2E tests to verify route behavior remains unchanged after refactors, focusing on messaging, patient portal, assessments, recommendations, and subscription flows.

