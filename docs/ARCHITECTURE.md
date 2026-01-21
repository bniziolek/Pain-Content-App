# DriverPath Architecture Design

This document defines the architectural principles and patterns for the DriverPath codebase. All new development and refactoring work should follow these guidelines.

## Overview

DriverPath follows a **Layered Domain-Driven Architecture** that separates concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Routes (API Layer)                       │
│         Thin controllers - validation, routing only         │
├─────────────────────────────────────────────────────────────┤
│                Application Services Layer                   │
│        Orchestration, transactions, use-case logic          │
├─────────────────────────────────────────────────────────────┤
│                    Domain Services                          │
│         Core business logic, domain rules, algorithms       │
├─────────────────────────────────────────────────────────────┤
│               Infrastructure Services                       │
│         External integrations (email, payments, CMS)        │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                              │
│               Storage interface, repositories               │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
server/
├── routes/                    # API endpoints (thin controllers)
│   ├── index.ts              # Route registration
│   ├── messaging.ts          # Email/messaging endpoints
│   ├── assessments.ts        # Assessment endpoints
│   └── ...
│
├── domain/                    # Core business logic (pure functions when possible)
│   ├── messaging/
│   │   ├── access-code.service.ts    # Access code generation/hashing
│   │   └── index.ts
│   ├── scoring/
│   │   ├── scoring.service.ts        # Assessment scoring algorithms
│   │   └── index.ts
│   ├── recommendations/
│   │   ├── recommendation.service.ts # Content recommendation engine
│   │   └── index.ts
│   └── patient/
│       ├── auth.service.ts           # Patient authentication/lockout
│       └── index.ts
│
├── infrastructure/            # External service integrations
│   ├── email/
│   │   ├── gmail.service.ts
│   │   ├── resend.service.ts
│   │   └── index.ts
│   ├── payment/
│   │   ├── stripe.service.ts
│   │   └── index.ts
│   ├── cms/
│   │   ├── contentful.service.ts
│   │   └── index.ts
│   └── audit/
│       ├── audit.service.ts
│       └── index.ts
│
├── storage.ts                 # Database access (Drizzle ORM)
└── index.ts                   # Server entry point
```

## Layer Responsibilities

### 1. Routes Layer (`server/routes/`)

**Purpose**: HTTP request/response handling only.

**Guidelines**:
- Keep routes as thin as possible
- Validate request data using Zod schemas
- Call domain or application services for business logic
- Handle authentication/authorization via middleware
- Return appropriate HTTP status codes
- Log actions via audit service

**Example Pattern**:
```typescript
router.post("/email-logs", requireSubscription, async (req, res, next) => {
  try {
    // 1. Validate input
    const data = insertEmailLogSchema.parse(req.body);
    
    // 2. Call domain service for business logic
    const { accessCode, accessCodeHash, accessCodeSalt } = createSecureAccessCode();
    
    // 3. Persist via storage
    const emailLog = await storage.createEmailLog({ ...data, accessCodeHash, accessCodeSalt });
    
    // 4. Call infrastructure service
    await sendContentEmail({ toEmail, subject, contentItems, providerNote });
    
    // 5. Audit
    await logClinicianAction(req, req.user!, 'email_sent', { resourceId: emailLog.id });
    
    // 6. Return response
    res.json(emailLog);
  } catch (error) {
    next(error);
  }
});
```

### 2. Domain Services Layer (`server/domain/`)

**Purpose**: Core business logic that is independent of infrastructure.

**Guidelines**:
- Contain pure business logic with no side effects when possible
- No direct database access - receive data as parameters
- No HTTP concepts (req, res, status codes)
- No external service calls (email, payments)
- Export typed interfaces for inputs/outputs
- Each domain gets its own subdirectory with index.ts barrel export

**Example Pattern**:
```typescript
// server/domain/messaging/access-code.service.ts
export interface AccessCodeResult {
  accessCode: string;
  accessCodeHash: string;
  accessCodeSalt: string;
}

export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createSecureAccessCode(): AccessCodeResult {
  const accessCode = generateAccessCode();
  const accessCodeSalt = randomBytes(16).toString('hex');
  const accessCodeHash = hashAccessCode(accessCode, accessCodeSalt);
  return { accessCode, accessCodeHash, accessCodeSalt };
}

export function verifyAccessCode(inputCode: string, storedHash: string, salt: string): boolean {
  const inputHash = hashAccessCode(inputCode, salt);
  return inputHash === storedHash;
}
```

### 3. Infrastructure Services Layer (`server/infrastructure/`)

**Purpose**: External system integrations.

**Guidelines**:
- Wrap external APIs (Gmail, Stripe, Contentful)
- Handle retries, error translation, and configuration
- Provide typed interfaces for the rest of the application
- Abstract away implementation details (e.g., which email provider)
- Configuration via environment variables

**Example Pattern**:
```typescript
// server/infrastructure/email/gmail.service.ts
export interface EmailParams {
  toEmail: string;
  subject: string;
  contentItems: ContentItemWithUrl[];
  providerNote?: string;
}

export async function sendContentEmail(params: EmailParams): Promise<void> {
  // Gmail-specific implementation
}
```

### 4. Data Layer (`server/storage.ts`)

**Purpose**: Database access abstraction.

**Guidelines**:
- Use Drizzle ORM for all database operations
- Implement IStorage interface for all CRUD operations
- Use transactions for multi-table operations
- Return typed entities from `@shared/schema`
- Handle database errors and provide meaningful messages

## Naming Conventions

### Files
- Domain services: `{name}.service.ts`
- Route files: `{resource}.ts` (e.g., `messaging.ts`, `assessments.ts`)
- Infrastructure services: `{provider}.service.ts` (e.g., `gmail.service.ts`)
- Barrel exports: `index.ts`

### Functions
- Domain functions: Use clear action verbs (`createSecureAccessCode`, `calculateTagScores`)
- Storage methods: `create{Entity}`, `get{Entity}ById`, `update{Entity}`, `delete{Entity}`
- Route handlers: Express async handler pattern

### Types/Interfaces
- Result types: `{Name}Result` (e.g., `AccessCodeResult`, `ScoringResult`)
- Config types: `{Name}Config` (e.g., `ScoringConfig`)
- Context types: `{Name}Context` (e.g., `RecommendationContext`)

## Import Patterns

Use barrel exports for clean imports:

```typescript
// Good - import from domain barrel
import { createSecureAccessCode, verifyAccessCode } from "../domain/messaging";

// Avoid - importing from specific file (unless necessary)
import { createSecureAccessCode } from "../domain/messaging/access-code.service";
```

## Testing Strategy

### Unit Tests
- Domain services: Pure function tests with mocked data
- Infrastructure services: Integration tests with mocked external APIs

### API Tests
- Route handlers: HTTP-level tests using supertest
- Database interactions: Use test database with reset between tests

### E2E Tests
- Playwright for browser-based user flows
- Test critical paths (auth, content delivery, assessments)

## HIPAA Compliance Patterns

### Audit Logging
All PHI access must be logged:
```typescript
await logClinicianAction(req, req.user!, 'patient_summary_view', {
  resourceType: 'patient',
  phiAccessed: true,
  phiScope: 'patient email, content views',
  details: { patientEmail },
});
```

### Access Code Security
- Use PBKDF2 for hashing access codes
- Implement tiered lockout (3/6/9 attempts)
- Never log or expose access codes in responses

### Session Management
- Server-side sessions with UUID tokens
- 24-hour patient session expiration
- HttpOnly cookies with secure flags

## Feature Flags

Feature flags control functionality via the `feature_flags` table:
- `patient_messaging_enabled`: Email mode
- `patient_portal_enabled`: Patient portal access
- `packet_mode_enabled`: Packet mode for content delivery

Routes should use `requireFeatureFlag` middleware for flag-gated features.

## Migration Path

When refactoring existing code:

1. **Identify business logic** in routes that should be domain services
2. **Extract to domain service** with typed interface
3. **Update route** to use new domain service
4. **Move infrastructure code** to appropriate infrastructure service
5. **Update imports** throughout codebase
6. **Run all tests** to verify no regressions
7. **Update this document** if patterns change

## Current Refactoring Status

### Completed
- [x] Route modularization (18 route files)
- [x] Access code service extraction (`server/domain/messaging/`)
- [x] Domain folder structure created
- [x] Scoring service refactored to use domain layer (`server/domain/scoring/`)
- [x] Infrastructure folder structure created

### In Progress
- [ ] Move `recommendation.ts` → `server/domain/recommendations/`
- [ ] Extract patient auth logic → `server/domain/patient/`
- [ ] Move infrastructure services (gmail, stripe, contentful) to `server/infrastructure/`

### Future
- [ ] Create IStorage interfaces for repository pattern
- [ ] Add application services layer for complex orchestration
- [ ] Further decompose large route files
