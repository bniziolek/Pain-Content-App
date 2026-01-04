# RehabPilot

## Overview

RehabPilot is a SaaS platform for physical therapists and clinicians to deliver evidence-based patient education. The application enables clinicians to curate and send educational content to patients, conduct assessments, and track engagement. The core philosophy centers on explaining "why you hurt, not where you hurt" using biopsychosocial and pain-neuroscience education principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: scrypt hashing with timing-safe comparison

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Session Store**: connect-pg-simple for persistent sessions
- **Schema Location**: `shared/schema.ts` contains all table definitions using Drizzle's PostgreSQL dialect

### Key Data Models
- **Users**: Clinicians with subscription status tracking (Stripe integration ready)
- **Content Items**: Educational modules with tags, markdown body, and metadata
- **Assessment Invites**: Patient-facing assessments sent via email
- **Internal Screenings**: Clinician-conducted assessments
- **Email Logs**: Tracking all content and assessment deliveries, includes `access_code` for patient portal authentication

### Patient Portal (/patient-portal)
- **Authentication**: Email + 6-digit access code (sent via email)
- **Session Management**: Server-side sessions with 24-hour expiration
- **Security Features**:
  - UUID session tokens (not predictable)
  - Scoped access: patients only see content from the specific email that contained their access code
  - Assessment invites scoped to the clinician who sent content
- **API Routes**:
  - POST `/api/patient-portal/auth` - Verify email + access code, returns session token
  - GET `/api/patient-portal/content` - Returns assigned content and assessments (requires Bearer token)

### Authentication Flow
- Session-based authentication with 30-day cookie expiration
- Role-based access: `clinician` (default) and `admin`
- Subscription gating: Active subscription required for core features
- Protected routes via `RequireAuth` and `RequireSubscription` components

### API Design
- RESTful endpoints under `/api/*` prefix
- Zod validation using drizzle-zod for request body validation
- Middleware chain: auth → subscription check → route handler

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `/migrations`

### Payment Processing
- **Stripe**: Subscription management (customer IDs, subscription status tracked in users table)

### Email Delivery
- **Gmail**: Transactional email service for sending patient content and assessment invites via Gmail API
- **Integration**: `server/gmail.ts` - Gmail client service using Replit's connector with OAuth
- **Email Types**: Content bundles (educational materials), Assessment invites
- **Features**: Professional HTML email templates with RehabPilot branding

### Content Management (Contentful CMS)
- **Contentful**: Headless CMS for managing content library and care pathways
- **Integration**: `server/contentful.ts` - Contentful client service layer
- **Fallback**: If Contentful fails or is not configured, content is served from PostgreSQL database

#### Content Types in Contentful:

**contentItem** (for educational content):
- `title` (Short text, required)
- `summary` (Rich text or short text)
- `body` (Rich text or long text)
- `tags` (Array of short text)
- `imageUrl` (Media - image)
- `readTime` (Short text, e.g., "5 min")

**carePathway** (for treatment protocols):
- `name` (Short text, required)
- `description` (Rich text or short text)
- `condition` (Short text, e.g., "Chronic Low Back Pain")
- `durationWeeks` (Integer, default 8)
- `milestones` (Reference, many - to pathwayMilestone)
- `isActive` (Boolean, default true)

**pathwayMilestone** (linked to carePathway):
- `title` (Short text, required)
- `weekNumber` (Integer, required)
- `description` (Rich text or short text)
- `contentReferences` (Reference, many - to contentItem)

- **API Behavior**: GET `/api/content` and `/api/pathways` try Contentful first, fall back to database on error

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `STRIPE_SECRET_KEY`: For payment processing (when enabled)
- `CONTENTFUL_SPACE_ID`: Contentful space identifier
- `CONTENTFUL_ACCESS_TOKEN`: Contentful Content Delivery API access token

### UI Component Dependencies
- Full shadcn/ui component library with Radix UI primitives
- Recharts for dashboard analytics visualization
- Lucide React for iconography
- Embla Carousel for content carousels

## HIPAA Compliance Features

### Audit Logging
- **Table**: `audit_logs` - Immutable log of all PHI access and system actions
- **Tracked Actions**: login, logout, login_failed, content_access, phi_view, phi_export, email_sent, settings_change, user_create, user_update, password_change, session_timeout
- **Fields**: userId, actorType (clinician/admin/patient/system), actorEmail, action, resourceType, resourceId, phiAccessed, phiScope, ipAddress, userAgent, sessionId, outcome
- **Service**: `server/audit.ts` - Logging helpers (logClinicianAction, logPatientAction, logSystemAction)

### Access Code Security
- **Hashing**: PBKDF2 with 100,000 iterations, SHA-512, per-code salt
- **Fields**: `access_code_hash`, `access_code_salt`, `access_code_generated_at` in email_logs table
- **Transition**: Supports both hashed and legacy plaintext codes during migration
- **Lockout**: Tiered lockout system (5min, 1hr, permanent) after failed attempts

### Patient Session Management
- **Table**: `patient_sessions` - Persistent, database-backed sessions
- **Fields**: token, patientEmail, emailLogId, ipAddress, userAgent, lastActivity, expiresAt, isActive
- **Features**: 24-hour expiration, sliding window (activity updates), automatic cleanup of expired sessions
- **Security**: Sessions scoped to specific email log ID, UUID tokens

### Role-Based Access Control (RBAC)
- **Tables**: `permissions`, `role_permissions`
- **Roles**: clinician, admin, readonly, support
- **Permissions**: content:read/write/delete, patient:read/write/delete, assessment:read/write, email:send, user:manage, audit:view, settings:manage, admin:access
- **Middleware**: `server/rbac.ts` - requirePermission(), requireRole()
- **Admin has all permissions by default**

### Data Classification & Inventory
- **Table**: `data_inventory` - PHI/PII classification registry
- **Classifications**: PHI, PII, Sensitive, Internal, Public
- **Tracked Assets**: Patient Email Addresses, Patient Names, Assessment Responses, Internal Screening Data, Access Codes, Clinician Credentials, Audit Logs, Educational Content
- **Metadata**: Retention periods (7 years for PHI), disposal methods, encryption status, access roles
- **API**: GET/POST/PATCH/DELETE `/api/admin/data-inventory`

### Security Architecture
- **Encryption in Transit**: All data over HTTPS/TLS
- **Encryption at Rest**: PostgreSQL with managed encryption
- **Password Hashing**: scrypt with salt for clinician passwords
- **Session Security**: HttpOnly cookies, secure flag in production, 30-day max age for clinicians