# DriverPath External Integrations

This document lists all external services and integrations used by DriverPath, including their purpose, status, and configuration requirements.

---

## Active Integrations

### 1. PostgreSQL Database
**Purpose:** Primary data storage for users, content, assessments, audit logs, and all application data.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Provider** | Neon (via Replit) |
| **ORM** | Drizzle ORM |
| **Connection** | `DATABASE_URL` environment variable |

**Features:**
- Session storage via `connect-pg-simple`
- Full HIPAA-compliant audit logging
- Automatic migrations via `drizzle-kit`

---

### 2. Contentful CMS
**Purpose:** Headless content management system for educational content library and care pathways.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Integration File** | `server/contentful.ts` |
| **Fallback** | PostgreSQL database if Contentful unavailable |

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `CONTENTFUL_SPACE_ID` | Contentful space identifier |
| `CONTENTFUL_ACCESS_TOKEN` | Content Delivery API token |

**Content Types Managed:**
- `contentItem` - Educational modules
- `carePathway` - Treatment protocols
- `pathwayMilestone` - Weekly checkpoints

---

### 3. Gmail API
**Purpose:** Transactional email delivery for patient content bundles and assessment invites.

| Attribute | Value |
|-----------|-------|
| **Status** | Active (feature-flagged) |
| **Integration File** | `server/gmail.ts` |
| **Authentication** | OAuth via Replit Connector |

**Features:**
- Professional HTML email templates
- DriverPath branding
- Delivery tracking
- Access code generation for patient portal

**Note:** Controlled by `content_delivery_mode` and `patient_messaging_enabled` feature flags.

---

### 4. Resend Email API
**Purpose:** Alternative email delivery service for transactional emails.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Integration File** | `server/resend.ts` |
| **Authentication** | Replit Connector |

**Features:**
- Backup email provider
- API-based email sending
- Delivery status tracking

---

### 5. GitHub API (Octokit)
**Purpose:** Repository management, issue creation, and project documentation automation.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Integration File** | `server/github.ts` |
| **Library** | `@octokit/rest` |
| **Authentication** | OAuth via Replit Connector |

**Permissions:**
- `read:org`, `read:project`, `read:user`
- `repo` (full repository access)
- `user:email`

**Use Cases:**
- Automated issue creation for feature documentation
- Label management
- Project tracking

---

### 6. Passport.js Authentication
**Purpose:** User authentication for clinicians and administrators.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Integration File** | `server/auth.ts` |
| **Strategy** | Local (email/password) |

**Features:**
- Session-based authentication (30-day expiry)
- Password hashing with scrypt
- Role-based access (clinician, admin)
- Secure session storage in PostgreSQL

---

### 7. SurveyJS
**Purpose:** Assessment builder and form rendering for clinical questionnaires.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Libraries** | `survey-core`, `survey-react-ui`, `survey-creator-react` |

**Features:**
- Drag-and-drop assessment builder
- Multiple question types (choice, rating, text, boolean)
- Conditional logic and branching
- Scoring configuration
- Patient-facing form renderer

---

## Planned Integrations

### 8. Stripe
**Purpose:** Subscription management and payment processing for tiered plans.

| Attribute | Value |
|-----------|-------|
| **Status** | Planned |
| **GitHub Issue** | #25 - Tiered Subscription System |

**Environment Variables (When Implemented):**
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |

**Planned Features:**
- Checkout session creation
- Subscription management
- Customer portal
- Webhook handling
- Tier-based access control

---

### 9. PostHog
**Purpose:** User behavior analytics, feedback collection, and feature flags.

| Attribute | Value |
|-----------|-------|
| **Status** | Planned |
| **GitHub Issue** | #28 - User Insights & Feedback |

**Planned Features:**
- Autocapture (clicks, page views)
- Session recordings
- In-app surveys and feedback widgets
- Thumbs up/down feedback
- Feature flag integration
- HIPAA-compliant with PII redaction or self-hosting

---

### 10. Freshdesk
**Purpose:** External helpdesk for user support tickets and feedback management.

| Attribute | Value |
|-----------|-------|
| **Status** | Planned |
| **GitHub Issue** | #29 - External Helpdesk Integration |

**Planned Features:**
- External ticket portal (link-out from app)
- Multi-agent support (up to 10 free)
- Email-based ticketing
- Knowledge base
- Ticket categorization

**HIPAA Note:** Users will be reminded not to include PHI in support tickets.

---

## UI Component Libraries

### Radix UI Primitives
**Purpose:** Accessible, unstyled UI component primitives.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Components** | Dialog, Dropdown, Tabs, Toast, Tooltip, and 20+ more |

---

### Recharts
**Purpose:** Data visualization and charting for dashboards.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Use Cases** | Dashboard analytics, engagement charts |

---

### Embla Carousel
**Purpose:** Carousel/slider component for content display.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Library** | `embla-carousel-react` |

---

### Lucide Icons
**Purpose:** Icon library for UI elements.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Library** | `lucide-react` |

---

## Replit Platform Integrations

### Replit Connectors
**Purpose:** Managed OAuth and API key handling for external services.

| Service | Connector Status |
|---------|------------------|
| GitHub | Connected |
| Gmail | Connected |
| Resend | Connected |

**Benefits:**
- Automatic token refresh
- Secure credential storage
- No API keys in codebase

---

### Replit Database (Neon PostgreSQL)
**Purpose:** Managed PostgreSQL with automatic backups and rollback support.

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Features** | Checkpoints, rollback, managed encryption |

---

## Environment Variables Summary

### Required for Core Functionality
| Variable | Service | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL | Yes |
| `SESSION_SECRET` | Express Sessions | Yes |

### Optional (Feature-Dependent)
| Variable | Service | Required For |
|----------|---------|--------------|
| `CONTENTFUL_SPACE_ID` | Contentful | CMS content |
| `CONTENTFUL_ACCESS_TOKEN` | Contentful | CMS content |
| `STRIPE_SECRET_KEY` | Stripe | Subscriptions (planned) |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Subscriptions (planned) |

### Managed by Replit Connectors
| Service | Managed By |
|---------|------------|
| GitHub OAuth | Replit Connector |
| Gmail OAuth | Replit Connector |
| Resend API | Replit Connector |

---

## Integration Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        DriverPath App                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Frontend   │  │   Backend    │  │   Database   │          │
│  │   (React)    │◄─┤  (Express)   │◄─┤ (PostgreSQL) │          │
│  └──────────────┘  └──────┬───────┘  └──────────────┘          │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Contentful  │ │    Gmail     │ │    GitHub    │
    │     CMS      │ │     API      │ │     API      │
    └──────────────┘ └──────────────┘ └──────────────┘
            │               │               │
            └───────────────┴───────────────┘
                            │
                    Replit Connectors
                  (OAuth & Key Management)
```

---

## Security & Compliance Notes

1. **HIPAA Compliance**
   - All PHI stored in PostgreSQL with encryption at rest
   - Audit logging for all data access
   - External services (Freshdesk, PostHog) configured to exclude PHI

2. **Authentication**
   - Clinicians: Email/password with scrypt hashing
   - Patients: Email + access code with PBKDF2 hashing
   - OAuth tokens: Managed by Replit Connectors

3. **Data Flow**
   - All data in transit over HTTPS/TLS
   - API keys never stored in codebase
   - Secrets managed via Replit Secrets

---

*Last Updated: January 2026*
