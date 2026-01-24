# DriverPath

## Overview
DriverPath is a SaaS platform designed for physical therapists and clinicians. Its core purpose is to provide evidence-based patient education, allowing clinicians to curate and distribute educational content, conduct assessments, and monitor patient engagement. The platform focuses on a biopsychosocial and pain-neuroscience education approach, explaining "why you hurt, not where you hurt." It aims to improve patient outcomes and streamline the educational process for healthcare providers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Design System
The application adheres to the **DriverPath Style Guide**, featuring:
- **Branding**: Health Drivers Institute (HDI) / DriverPath
- **Color Palette**: Primary Teal (#0F766E light, #14B8A6 dark), Accent Amber (#F59E0B)
- **Typography**: Inter font family
- **Component Styling**: 12px radius for components
- **Voice**: Clinical-grade, efficient, calm, decisive

### Technical Implementation
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state, React Context for authentication. Styling uses Tailwind CSS v4 and shadcn/ui (New York style), built with Vite.
- **Backend**: Node.js with Express and TypeScript (ESM). Passport.js for authentication (local strategy, session-based with express-session). scrypt for password hashing.
- **Database**: PostgreSQL with Drizzle ORM, `connect-pg-simple` for session storage.
- **Data Models**: Key models include Users (clinicians), Content Items, Assessment Invites, Internal Screenings, and Email Logs.
- **Patient Portal**: Authenticated via email and a 6-digit access code with server-side sessions (24-hour expiration, UUID tokens). Scoped access ensures content relevance.
- **Authentication**: Session-based with 30-day cookie expiration, role-based access (clinician, admin), and subscription checks.
- **API Design**: RESTful endpoints (`/api/*`) with Zod validation and middleware for authentication/subscription.
- **HIPAA Compliance Features**:
    - **Audit Logging**: Immutable `audit_logs` table for PHI access and system actions.
    - **Access Code Security**: PBKDF2 hashing, tiered lockout for failed attempts.
    - **Patient Session Management**: Persistent `patient_sessions` table with sliding window and UUID tokens.
    - **Role-Based Access Control (RBAC)**: Fine-grained permissions and super admin persona switching.
    - **Data Classification**: `data_inventory` table for PHI/PII classification, retention, and disposal metadata.
    - **Security Architecture**: HTTPS/TLS, encryption at rest, scrypt hashing, HttpOnly cookies.
    - **Feature Flags**: `feature_flags` table for system-wide feature control, guarding backend APIs.
- **Assessment Builder & Recommendation Engine**:
    - **Assessment Builder**: SurveyJS for building/rendering assessments, definitions stored in PostgreSQL.
    - **Scoring Service**: Processes assessment responses for tag-based scores.
    - **Recommendation Service**: Generates content suggestions based on assessment scores, clinician rules, care pathways, and tag matching.
- **Modular Architecture**: Server-side and client-side codebases are organized into domain-specific modules (e.g., content, assessments, subscription) to improve maintainability and facilitate AI-assisted development. See `docs/ARCHITECTURE.md` for the comprehensive architecture design document.
- **Layered Domain-Driven Design**: The backend follows a 5-layer architecture:
    - **Routes Layer** (`server/routes/`): Thin controllers for HTTP handling, validation, and routing.
    - **Application Services** (`server/application/`): Orchestration layer that coordinates domain, infrastructure, and storage. Uses AppContext for dependency injection. Domains include: messaging, assessments, assessment-invites, content, patient-portal, recommendations, favorites, collections, stats, password-reset, pathways, subscription, feature-flags, admin, compliance, pdf.
    - **Domain Services** (`server/domain/`): Pure business logic with no side effects (scoring algorithms, access code generation, password hashing).
    - **Infrastructure Services** (`server/infrastructure/`): External integrations (email via Gmail/Resend adapter, payments via Stripe, CMS via Contentful, PDF generation via Puppeteer).
    - **Data Layer** (`server/storage.ts`): Drizzle ORM database access with IStorage interface.
- **PDF Generation**: Utilizes a Puppeteer-based service (`server/infrastructure/pdf/pdf-generator.ts`) to convert HTML to professional, templated PDFs with active links, configurable options, and audit logging.
- **Custom Branding (Pro/Enterprise)**: Clinicians with Pro or Enterprise subscriptions can customize their PDF content packets with:
    - Custom clinic logo on cover pages
    - Custom color scheme (primary, secondary, accent colors)
    - Custom clinic name and tagline
    - Custom footer text
    - "Powered by DriverPath" attribution toggle
    - Settings managed via `/api/branding` endpoints and stored in `clinic_branding` table
- **Subscription Tiers**: Implements Basic, Pro, and Enterprise tiers with feature entitlements controlled by a server-side matrix. Includes UI components for tier display and upgrade prompts.
- **Admin Dashboard**: Enhanced with detailed analytics (user trends, tier breakdown, churn), recent signups, user search/filters, sortable tables, login history, admin notes, and data export capabilities.
- **Favorites & Frequently Used Content**: Clinicians can favorite content for quick access, and the system tracks frequently used content based on send history.
- **Mobile-Friendly Design**: Responsive layout with bottom navigation for tablets/mobiles, enlarged touch targets (48px minimum), and optimizations for mobile forms. Includes offline caching, action queuing, and pull-to-refresh functionality.
- **Automated Test Suite**: Hybrid approach combining Playwright E2E tests (for UI, roles, and key workflows) and Vitest API tests for backend functionality.

## External Dependencies

- **Database**: PostgreSQL
- **Payment Processing**: Stripe (for subscription management)
- **Email Delivery**: Gmail (via Gmail API for transactional emails)
- **Content Management**: Contentful CMS (for managing content library and care pathways). Content is synced to PostgreSQL via `npm run contentful:sync` script. The application reads exclusively from the database, not directly from Contentful API. Run the sync script manually or schedule it to keep content up to date.
- **UI Component Dependencies**: shadcn/ui (with Radix UI primitives), Recharts, Lucide React, Embla Carousel.
- **Environment Variables**:
    - `DATABASE_URL`
    - `SESSION_SECRET`
    - `STRIPE_SECRET_KEY`
    - `CONTENTFUL_SPACE_ID`
    - `CONTENTFUL_ACCESS_TOKEN`

