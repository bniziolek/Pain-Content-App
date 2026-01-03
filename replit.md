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
- **Email Logs**: Tracking all content and assessment deliveries

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