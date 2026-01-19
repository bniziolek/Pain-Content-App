# DriverPath

## Overview

DriverPath is a SaaS platform designed for physical therapists and clinicians. Its primary purpose is to facilitate the delivery of evidence-based patient education, enabling clinicians to curate and send educational content, conduct assessments, and monitor patient engagement. The platform emphasizes a biopsychosocial and pain-neuroscience education approach to explain "why you hurt, not where you hurt."

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Design System
The application adheres to the **DriverPath Style Guide**. Key design elements include:
- **Brand**: Health Drivers Institute (HDI) / DriverPath
- **Primary Color**: Teal (#0F766E light, #14B8A6 dark)
- **Accent Color**: Amber (#F59E0B)
- **Typography**: Inter font family
- **Radius**: 12px for components
- **Voice**: Clinical-grade, efficient, calm, decisive

### Technical Implementation
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state, React Context for auth state. Styling is managed with Tailwind CSS v4 and shadcn/ui (New York style). Vite is used for building.
- **Backend**: Node.js with Express and TypeScript (ESM modules). Passport.js handles authentication with a local strategy and session-based auth using express-session. scrypt is used for password hashing.
- **Database**: PostgreSQL with Drizzle ORM. `connect-pg-simple` is used for persistent session storage.
- **Data Models**: Key models include Users (clinicians), Content Items, Assessment Invites, Internal Screenings, and Email Logs.
- **Patient Portal**: Authenticated via email and a 6-digit access code. Sessions are server-side with 24-hour expiration and UUID tokens for security. Scoped access ensures patients only see content relevant to their specific access code.
- **Authentication**: Session-based with 30-day cookie expiration. Implements role-based access for `clinician` and `admin`, and requires an active subscription for core features.
- **API Design**: RESTful endpoints under `/api/*` with Zod validation and a middleware chain for authentication and subscription checks.
- **HIPAA Compliance Features**:
    - **Audit Logging**: Immutable `audit_logs` table tracks PHI access and system actions.
    - **Access Code Security**: PBKDF2 hashing with salt, tiered lockout system for failed attempts.
    - **Patient Session Management**: Persistent `patient_sessions` table with 24-hour expiration, sliding window, and UUID tokens.
    - **Role-Based Access Control (RBAC)**: Fine-grained permissions (e.g., content:read/write, patient:read/write) for roles like clinician, admin, super_admin. Super admins can switch personas.
    - **Data Classification & Inventory**: `data_inventory` table classifies PHI/PII and other data assets with retention and disposal metadata.
    - **Security Architecture**: Encryption in transit (HTTPS/TLS) and at rest (PostgreSQL), scrypt for password hashing, and HttpOnly cookies for sessions.
    - **Feature Flags System**: `feature_flags` table allows super admins to control system-wide features. Includes flags for MVP provider-only mode (e.g., `patient_portal_enabled`). Backend APIs are guarded by feature flags.
- **Assessment Builder & Recommendation Engine**:
    - **SurveyJS Integration**: Used for building and rendering assessments, with definitions stored in PostgreSQL.
    - **Scoring Service**: Processes assessment responses to calculate tag-based scores using custom configurations or inferred logic.
    - **Recommendation Service**: Generates content suggestions based on assessment scores using clinician-defined rules, care pathway context, and tag-based matching.

## External Dependencies

- **Database**: PostgreSQL
- **Payment Processing**: Stripe (for subscription management)
- **Email Delivery**: Gmail (via Gmail API for transactional emails)
- **Content Management**: Contentful CMS (for managing content library and care pathways), with a fallback to PostgreSQL if not configured or unavailable.
- **UI Component Dependencies**: shadcn/ui (with Radix UI primitives), Recharts, Lucide React, Embla Carousel.
- **Environment Variables**:
    - `DATABASE_URL`
    - `SESSION_SECRET`
    - `STRIPE_SECRET_KEY`
    - `CONTENTFUL_SPACE_ID`
    - `CONTENTFUL_ACCESS_TOKEN`

## Recent Changes

### Tiered Subscription System (January 2026)
- **Subscription Tiers**: Basic, Pro, and Enterprise tiers with feature-based entitlements
- **TierBadge Component**: Dynamic badge in sidebar showing user's current tier with icon (Sparkles for Basic, Crown for Pro/Enterprise)
- **Tier Entitlement Matrix**: Server-side TIER_ENTITLEMENTS defines feature access by tier (care_pathways, follow_up_automation, etc.)
- **UpgradePrompt Component**: Three variants (card, inline, dialog) for prompting tier upgrades on locked features
- **Admin Tier Management**: Filter users by tier, view tier in user table, manually change user tiers
- **useTierEntitlement Hook**: Client-side hook for checking feature access based on user tier

### Admin Dashboard Enhancements (January 2026)
- **Enhanced Dashboard Stats**: Added active user trends (daily/weekly/monthly), subscription tier breakdown, churned user count
- **Recent Signups List**: Dashboard shows last 10 signups with timestamps
- **User Search & Filters**: Search by name/email, filter by subscription tier and status
- **Sortable User Table**: Click column headers to sort by name, email, created date, or last login
- **Login History Tracking**: New `login_history` table tracks all login attempts (success/failure) with IP and user agent
- **Content Activity**: User detail page shows content sending patterns
- **Admin Notes**: New `admin_notes` table allows admins to add/view/delete notes on user records
- **User Data Export**: Compliance-ready JSON export of user data, notes, login history, and activity

### Favorites & Frequently Used Content (January 2026)
- **User Favorites**: Clinicians can favorite/star content items for quick access
- **Database Tables**: `user_favorites`, `content_collections`, `collection_items` for organizing favorites
- **Content Library Integration**: Star icon on content cards, Favorites filter button to show only favorited content
- **Dashboard Quick Access**: Favorites and Frequently Used sections on dashboard showing content titles
- **Frequently Used Tracking**: Auto-calculated from email send history, showing most-sent content
- **React Hooks**: `useFavorites` and `useFrequentlyUsed` hooks with TanStack React Query and error handling via toasts
- **API Endpoints**: RESTful endpoints for favorites CRUD (`/api/favorites/*`) and frequently used (`/api/content/frequently-used`)