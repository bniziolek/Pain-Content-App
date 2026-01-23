# Feature Catalog

This catalog maps product features to the backend routes and application services where they are implemented.

## Core Features

### Authentication

- Routes: `server/routes/auth.ts`
- Application: `server/application/auth/`
- Domain: `server/domain/patient/`

### Content Library

- Routes: `server/routes/content.ts`
- Application: `server/application/content/`
- Infrastructure: `server/infrastructure/cms/`
- Storage: `server/storage.ts`

### Messaging (Send Content)

- Routes: `server/routes/messaging.ts`
- Application: `server/application/messaging/`
- Domain: `server/domain/messaging/`
- Infrastructure: `server/infrastructure/email/`

### Assessments

- Routes: `server/routes/assessments.ts`
- Application: `server/application/assessments/`
- Domain: `server/domain/scoring/`

### Assessment Invites

- Routes: `server/routes/assessment-invites.ts`
- Application: `server/application/assessment-invites/`
- Domain: `server/domain/scoring/`, `server/domain/recommendations/`

### Recommendations

- Routes: `server/routes/recommendations.ts`
- Application: `server/application/recommendations/`
- Domain: `server/domain/recommendations/`

### Patient Portal

- Routes: `server/routes/patient-portal.ts`
- Application: `server/application/patient-portal/`
- Domain: `server/domain/patient/`

### Public Content Access

- Routes: `server/routes/public-content.ts`
- Application: `server/application/public-content/`

### Care Pathways

- Routes: `server/routes/pathways.ts`
- Application: `server/application/pathways/`

### Feature Flags

- Routes: `server/routes/feature-flags.ts`
- Application: `server/application/feature-flags/`

### Subscriptions and Billing

- Routes: `server/routes/subscription.ts`, `server/routes/webhooks.ts`
- Application: `server/application/subscription/`, `server/application/webhooks/`
- Infrastructure: `server/infrastructure/payment/`

### PDF Generation

- Routes: `server/routes/pdf.ts`
- Application: `server/application/pdf/`
- Infrastructure: `server/infrastructure/pdf/`

### Admin Tools

- Routes: `server/routes/admin.ts`
- Application: `server/application/admin/`

### Compliance and Audit

- Routes: `server/routes/compliance.ts`
- Application: `server/application/compliance/`
- Infrastructure: `server/infrastructure/audit/`

## Supporting Features

- **RBAC**: `server/rbac.ts`, `server/rbac-policy.ts`, `server/application/rbac/`
- **Background Jobs**: `server/background-jobs.ts`, `server/application/background-jobs/`
- **Stats/Dashboard**: `server/routes/stats.ts`, `server/application/stats/`
