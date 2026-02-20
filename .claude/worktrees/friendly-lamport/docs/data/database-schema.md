# Database Schema Guide

RehabPilot uses PostgreSQL with Drizzle ORM. All schemas are defined in `shared/schema.ts`.

## Core Tables

### users

Clinician accounts with subscription tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| email | text | Unique email address |
| password | text | Hashed password (scrypt) |
| name | text | Display name |
| role | text | 'clinician' or 'admin' |
| stripeCustomerId | text | Stripe customer ID |
| stripeSubscriptionId | text | Stripe subscription ID |
| subscriptionStatus | text | 'active', 'inactive', 'past_due', 'canceled' |
| subscriptionPeriodEnd | timestamp | When subscription expires |
| lastLogin | timestamp | Last login time |
| createdAt | timestamp | Account creation |
| updatedAt | timestamp | Last update |

### content_items

Educational content library.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| title | text | Content title |
| summary | text | Brief description |
| body | text | Markdown content |
| tags | text[] | Array of tags for categorization |
| imageUrl | text | Optional header image |
| readTime | text | Estimated read time (e.g., "5 min") |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

### assessments

Assessment definitions (SurveyJS format).

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| clinicianUserId | varchar | Owner (null for system templates) |
| name | text | Assessment name |
| description | text | Description |
| version | text | Version number |
| surveyJson | jsonb | Full SurveyJS definition |
| scoringConfig | jsonb | Tag scoring rules |
| outcomeRules | jsonb | Outcome determination rules |
| isTemplate | boolean | System template flag |
| isPublished | boolean | Draft vs published |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

### assessment_invites

Patient assessment invitations.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| clinicianUserId | varchar | Sending clinician |
| assessmentId | varchar | Assessment template |
| patientEmail | text | Patient email |
| token | text | Unique access token |
| status | text | 'sent', 'opened', 'completed' |
| completedAt | timestamp | Completion time |
| createdAt | timestamp | Send time |

### assessment_responses

Completed assessment answers.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| inviteId | varchar | Associated invite |
| answers | jsonb | Patient answers |
| tagScores | jsonb | Calculated scores |
| recommendedContentIds | text[] | Content recommendations |
| createdAt | timestamp | Submission time |

### email_logs

All emails sent to patients.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| clinicianUserId | varchar | Sending clinician |
| patientEmail | text | Recipient |
| subject | text | Email subject |
| type | text | 'content_bundle', 'assessment_invite', etc. |
| contentIds | text[] | Content items sent |
| providerNote | text | Optional note |
| accessCode | text | (Deprecated) Plain access code |
| accessCodeHash | text | Hashed access code |
| accessCodeSalt | text | Salt for hashing |
| accessCodeGeneratedAt | timestamp | Code generation time |
| status | text | 'sent', 'opened', 'clicked' |
| sentAt | timestamp | Send time |
| failedAttempts | integer | Login failure count |
| lockedUntil | timestamp | Lockout expiry |
| permanentlyLocked | boolean | Permanent lockout flag |

### content_views

Tracks when patients view content.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| emailLogId | varchar | Associated email |
| contentId | varchar | Content item |
| patientEmail | text | Viewer |
| token | text | Unique tracking token |
| viewedAt | timestamp | First view time |
| timeSpentSeconds | integer | Time on page |
| createdAt | timestamp | Creation time |

## Care Pathway Tables

### care_pathways

Treatment protocol templates.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| clinicianUserId | varchar | Owner |
| name | text | Pathway name |
| description | text | Description |
| condition | text | Target condition |
| durationWeeks | integer | Total duration |
| isTemplate | boolean | System template flag |
| isActive | boolean | Active status |
| createdAt | timestamp | Creation time |

### pathway_milestones

Stages within a care pathway.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| pathwayId | varchar | Parent pathway |
| weekNumber | integer | Week in pathway |
| title | text | Milestone title |
| description | text | Description |
| contentIds | text[] | Content to deliver |
| assessmentId | varchar | Optional assessment |
| createdAt | timestamp | Creation time |

### patient_pathways

Patient enrollments in pathways.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| clinicianUserId | varchar | Managing clinician |
| pathwayId | varchar | Enrolled pathway |
| patientEmail | text | Patient |
| patientName | text | Patient name |
| startDate | timestamp | Enrollment date |
| currentWeek | integer | Current week |
| status | text | 'active', 'completed', 'paused', 'discontinued' |
| completedMilestones | text[] | Completed milestone IDs |
| notes | text | Clinician notes |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

## Recommendation Tables

### recommendation_configs

Clinician-defined recommendation rules.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| clinicianUserId | varchar | Owner |
| name | text | Rule name |
| assessmentId | varchar | Optional: specific assessment |
| pathwayId | varchar | Optional: specific pathway |
| pathwayWeek | integer | Optional: specific week |
| tag | text | Assessment tag to match |
| minScore | integer | Minimum score (0-100) |
| maxScore | integer | Maximum score (0-100) |
| priority | integer | Lower = higher priority |
| contentIds | text[] | Content to recommend |
| rationale | text | Why this rule exists |
| isActive | boolean | Active status |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

### patient_recommendations

Recommendation history for audit.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| patientEmail | text | Patient |
| clinicianUserId | varchar | Clinician |
| source | text | 'assessment', 'pathway_milestone', 'manual' |
| sourceId | text | Source record ID |
| assessmentId | varchar | Related assessment |
| pathwayId | varchar | Related pathway |
| pathwayWeek | integer | Pathway week |
| tagScores | jsonb | Scores at recommendation time |
| matchedRuleIds | text[] | Rules that fired |
| recommendedContentIds | text[] | Recommended content |
| contentRationale | jsonb | { contentId: rationale } |
| status | text | 'generated', 'sent', 'viewed', 'dismissed' |
| sentViaEmailLogId | varchar | Email that delivered it |
| createdAt | timestamp | Creation time |

## HIPAA Compliance Tables

### audit_logs

Immutable log of all actions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| userId | varchar | Acting user |
| actorType | text | 'clinician', 'admin', 'patient', 'system' |
| actorEmail | text | Actor email |
| action | text | Action type |
| resourceType | text | Resource type |
| resourceId | text | Resource ID |
| phiAccessed | boolean | PHI was accessed |
| phiScope | text | What PHI was accessed |
| details | jsonb | Additional context |
| ipAddress | text | Client IP |
| userAgent | text | Browser info |
| sessionId | text | Session ID |
| outcome | text | 'success', 'failure', 'denied' |
| createdAt | timestamp | Action time |

### patient_sessions

Patient portal sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| token | text | Session token (UUID) |
| patientEmail | text | Patient |
| emailLogId | varchar | Associated email |
| ipAddress | text | Client IP |
| userAgent | text | Browser info |
| lastActivity | timestamp | Last activity time |
| expiresAt | timestamp | Session expiry |
| isActive | boolean | Active status |
| createdAt | timestamp | Creation time |

### data_inventory

PHI/PII classification registry.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| dataAssetName | text | Asset name |
| tableName | text | Database table |
| fieldName | text | Specific field |
| dataClassification | text | 'PHI', 'PII', 'Sensitive', 'Internal', 'Public' |
| description | text | Description |
| containsPhi | boolean | Contains PHI |
| phiTypes | text[] | Types of PHI |
| encryptedAtRest | boolean | Encrypted at rest |
| encryptedInTransit | boolean | Encrypted in transit |
| retentionDays | integer | Retention period |
| disposalMethod | text | How to dispose |
| accessRoles | text[] | Who can access |
| lastReviewedAt | timestamp | Last review |
| reviewedBy | varchar | Reviewer |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

## Relationships Diagram

```
users
  ├── assessments (clinicianUserId)
  ├── assessment_invites (clinicianUserId)
  ├── internal_screenings (clinicianUserId)
  ├── email_logs (clinicianUserId)
  ├── care_pathways (clinicianUserId)
  ├── patient_pathways (clinicianUserId)
  ├── follow_up_rules (clinicianUserId)
  ├── recommendation_configs (clinicianUserId)
  └── patient_recommendations (clinicianUserId)

assessments
  ├── assessment_invites (assessmentId)
  ├── internal_screenings (assessmentId)
  └── pathway_milestones (assessmentId)

email_logs
  ├── content_views (emailLogId)
  └── patient_sessions (emailLogId)

care_pathways
  ├── pathway_milestones (pathwayId)
  └── patient_pathways (pathwayId)

assessment_invites
  └── assessment_responses (inviteId)
```

## Running Migrations

```bash
# Push schema changes to database
npm run db:push

# Force push if needed (use carefully)
npm run db:push --force
```
