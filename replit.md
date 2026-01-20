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

### Content Packet PDF Generation (Issue #35) - January 2026
- **PDF Generator Service**: `server/pdf-generator.ts` with Puppeteer-based HTML-to-PDF conversion
- **Dynamic Chromium Path**: Auto-detects system Chromium path for Replit environment compatibility
- **Professional Templates**: Cover page with patient name, clinician info, and date; optional Table of Contents; styled content sections
- **Active Links**: Hyperlinks in markdown content preserved as clickable links in generated PDFs
- **API Endpoints**:
  - `POST /api/packets/:screeningId/generate-pdf` - Generate PDF from screening's recommended content
  - `POST /api/content/generate-pdf` - Generate PDF from array of content IDs directly
- **Configuration Options**: Page size (letter/a4), TOC toggle, cover message, clinician/patient names
- **Audit Logging**: PDF generation events logged with PHI scope tracking
- **Storage Method**: Added `getInternalScreeningById` for screening lookup

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

### Mobile-Friendly Clinician View / Tablet Optimization (January 2026)
- **Responsive Layout**: Desktop sidebar (lg+), bottom navigation for tablets/mobile (< lg breakpoint)
- **Bottom Navigation**: Fixed bottom nav with key clinician routes (Dashboard, Library, Assessments, History, Settings)
- **Touch Targets**: All buttons updated to 48px minimum height with `touch-manipulation` for better tap response
- **Tablet-First Actions**: Preview and favorite buttons on content cards always visible on tablet (lg:opacity-0 lg:group-hover:opacity-100)
- **Offline Indicator**: Global component shows banner when offline, and "Back online" message when reconnected
- **Grid Layouts**: Responsive grids adapt to tablet widths (1 col mobile, 2 cols tablet, 3 cols desktop)
- **Menu Button**: Hamburger menu enlarged to 48px touch target for tablet/mobile accessibility

### Mobile Optimization (Issue #97) - January 2026
- **Touch Targets 48px**: Buttons (min-h-12), inputs (min-h-12), and icon buttons (h-12 w-12) all meet 48px minimum
- **Content Card Buttons**: Preview and favorite icon buttons on content cards updated to w-12 h-12 (48px) touch targets
- **Pull-to-Refresh**: Custom hook and component for refreshing content on mobile (usePullToRefresh, PullToRefresh)
- **Mobile Refresh Buttons**: Dashboard and History pages have mobile-only refresh buttons with "Pull down to refresh" hints
- **Swipe Navigation**: Hook for swiping between pages on mobile (useSwipeNavigation) integrated in DashboardLayout
- **Offline Caching**: useOfflineCache hook with localStorage caching, action queuing, and sync status
- **Offline Context**: OfflineProvider wraps App, ConnectedOfflineIndicator shows pending actions and sync status
- **Enhanced Offline Indicator**: Shows pending action count, sync status, and "back online" messages
- **Mobile Form Optimizations**: Auth and Settings forms have autocomplete, inputMode, enterKeyHint for mobile keyboards
- **Mobile-First Padding**: Reduced padding on mobile (p-4), larger on tablet/desktop (sm:p-8, lg:p-8)
- **Bottom Nav Improvements**: Safe area inset support, backdrop blur, active state indicators, 48px touch targets

### Automated Test Suite - January 2026
- **Hybrid Testing Approach**: Combines Playwright E2E tests with Vitest API tests
- **E2E Tests (tests/e2e/)**: Browser-based smoke tests for auth, library, and content packet generation
- **API Tests (tests/api/)**: Fast integration tests for auth, content, assessments, and health endpoints
- **Role-Based UI Tests (tests/e2e/roles/)**: Comprehensive tests by user role (clinician, admin, unauthenticated, patient portal)
- **Test Runner Script**: `./scripts/test.sh` with interactive menu and granular options
  - Quick: `smoke`, `api`, `e2e`
  - Granular: `api:auth`, `api:content`, `e2e:library`, `e2e:pdf`
  - Role-based: `ui:clinician`, `ui:admin`, `ui:unauth`, `ui:patient`
  - Full: `full` (all tests), `feature [name]` (feature-specific)
- **Configuration Files**: `playwright.config.ts` and `vitest.config.ts` at project root
- **Test Credentials**: admin@driverpath.com / admin123 (from seed.ts)
- **Development Workflow**: See `docs/DEVELOPMENT_WORKFLOW.md` for GitHub issue → develop → test pattern
- **Key Test Selectors**:
  - Content cards: `[data-testid^="content-card-"]` (e.g., `data-testid="content-card-abc123"`)
  - Preview buttons: `[data-testid^="button-preview-"]`
  - Favorite buttons: `[data-testid^="button-favorite-"]`
  - Packet modal button: `[data-testid="button-download-packet"]`
  - Print button: `[data-testid="button-print-packet"]`
  - Download button: `[data-testid="button-download-txt"]`
  - Close button: `[data-testid="button-close-packet"]`