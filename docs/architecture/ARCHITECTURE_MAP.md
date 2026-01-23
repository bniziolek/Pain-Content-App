# Architecture Map (Non-Technical Guide)

This map explains how the codebase is organized and how the pieces work together. It is written for a non-technical reader. For deeper technical detail, see `docs/architecture/ARCHITECTURE.md`.

## Big Picture

When a user does something (like clicking a button in the app), the request flows through these layers:

1. **Client** (browser UI) sends a request.
2. **Routes** receive the request and validate the input.
3. **Application Services** coordinate the work across the system.
4. **Domain Services** apply core business rules.
5. **Infrastructure** talks to external services (email, Stripe, CMS).
6. **Storage** reads/writes the database.

The system is designed so each layer has a clear job. This makes the app easier to change safely.

## Where Things Live

- **UI and user experience**: `client/`
- **API endpoints**: `server/routes/`
- **Use-case orchestration**: `server/application/`
- **Core business rules**: `server/domain/`
- **External integrations**: `server/infrastructure/`
- **Database access**: `server/storage.ts` and `server/storage/`
- **Shared types and schemas**: `shared/`
- **Automated tests**: `tests/`

If you open any file with an `Architecture:` comment at the top, it will tell you which layer it belongs to.

## How a Request Moves (Simple Walkthrough)

Example: A clinician sends content to a patient.

1. The clinician clicks a button in the UI (`client/`).
2. The UI calls an API endpoint in `server/routes/messaging.ts`.
3. The route validates the input and calls a messaging application service in `server/application/messaging/`.
4. The application service uses domain logic in `server/domain/messaging/` to create access codes.
5. It writes the email log to the database through `server/storage.ts`.
6. It sends the email using `server/infrastructure/email/`.
7. The route returns the result back to the UI.

## Key Workflows (Feature Tours)

### 1) Authentication and Access

- **Client**: login screens live in `client/src/pages/`.
- **Routes**: authentication routes live in `server/routes/auth.ts`.
- **Application Services**: login/logout tracking lives in `server/application/auth/`.
- **Domain**: patient authentication rules live in `server/domain/patient/`.
- **Storage**: user records are stored via `server/storage.ts`.

### 2) Content Management

- **Routes**: `server/routes/content.ts`.
- **Application**: `server/application/content/` orchestrates content CRUD.
- **Infrastructure**: `server/infrastructure/cms/` talks to the CMS.
- **Storage**: content metadata and analytics are stored via `server/storage.ts`.

### 3) Recommendations

- **Routes**: `server/routes/recommendations.ts`.
- **Application**: `server/application/recommendations/` coordinates data and results.
- **Domain**: `server/domain/recommendations/` contains the recommendation logic.
- **Storage**: recommendation history and rules live in the database.

### 4) Assessments

- **Routes**: `server/routes/assessments.ts` and `server/routes/assessment-invites.ts`.
- **Application**: `server/application/assessments/` and `server/application/assessment-invites/`.
- **Domain**: `server/domain/scoring/` contains scoring logic.
- **Storage**: assessment records and results are saved via `server/storage.ts`.

### 5) Messaging and Email Delivery

- **Routes**: `server/routes/messaging.ts`.
- **Application**: `server/application/messaging/`.
- **Domain**: `server/domain/messaging/` for access code logic.
- **Infrastructure**: `server/infrastructure/email/` for email providers.

### 6) Subscriptions and Billing (Stripe)

- **Routes**: `server/routes/subscription.ts` and `server/routes/webhooks.ts`.
- **Application**: `server/application/subscription/` and `server/application/webhooks/`.
- **Infrastructure**: `server/infrastructure/payment/` (Stripe).
- **Storage**: subscription state stored via `server/storage.ts`.

### 7) Public Content (Token-Based Access)

- **Routes**: `server/routes/public-content.ts`.
- **Application**: `server/application/public-content/`.
- **Storage**: tracks views and time via `server/storage.ts`.

## Auditing and Compliance

Many actions are recorded for traceability. Audit logging is centralized and used across the application services.

- **Infrastructure**: `server/infrastructure/audit/` provides the audit service.
- **Application**: services pass audit context and record events.
- **Compliance**: reporting flows live in `server/application/compliance/`.

## How to Understand a Feature End-to-End

1. Start in the UI page that triggers the action (`client/src/pages/`).
2. Find the API call in `client/src/api/`.
3. Follow it to the route in `server/routes/`.
4. Jump to the application service in `server/application/`.
5. Look for any domain logic in `server/domain/`.
6. Check external calls in `server/infrastructure/`.
7. Check database reads/writes in `server/storage.ts`.

## Glossary (Plain Language)

- **Route**: The API endpoint that receives a request.
- **Application Service**: The coordinator that runs a complete use-case.
- **Domain Logic**: Business rules and algorithms.
- **Infrastructure**: External services like email or Stripe.
- **Storage**: Database access layer.
- **Audit**: A log of actions for compliance and traceability.

## Key Files to Start With

- `server/index.ts`: server entry point
- `server/routes/index.ts`: API route registration
- `server/application/context.ts`: shared interfaces and dependency wiring
- `server/storage.ts`: database access interface
- `client/src/main.tsx`: client entry point

If you want a deep dive for any specific feature, tell me which one and I will add a feature tour with screenshots or step-by-step explanation.
