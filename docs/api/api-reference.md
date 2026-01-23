# API Reference

Complete API documentation for RehabPilot. All endpoints are prefixed with `/api`.

## Authentication

Session-based authentication using cookies. Login via `/api/login`.

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | None | Create new clinician account |
| POST | `/api/login` | None | Login with email/password |
| POST | `/api/logout` | Session | End current session |
| GET | `/api/user` | Session | Get current user info |

## Content Library

Educational content management.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/content` | Subscription | List all content (Contentful or DB) |
| GET | `/api/content/:id` | Subscription | Get single content item |
| POST | `/api/content` | Session | Create content item |
| PATCH | `/api/content/:id` | Session | Update content item |
| DELETE | `/api/content/:id` | Session | Delete content item |
| GET | `/api/content/status` | Session | Check content source (Contentful/DB) |

### Content Object

```json
{
  "id": "uuid",
  "title": "Understanding Pain Pathways",
  "summary": "Learn how pain signals work...",
  "body": "# Markdown content...",
  "tags": ["pain-neuroscience", "education"],
  "imageUrl": "https://...",
  "readTime": "5 min"
}
```

## Assessments

Assessment templates and management.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/assessments` | Subscription | List clinician's assessments + templates |
| GET | `/api/assessments/:id` | Subscription | Get assessment details |
| POST | `/api/assessments` | Subscription | Create new assessment |
| PATCH | `/api/assessments/:id` | Subscription | Update assessment |
| DELETE | `/api/assessments/:id` | Subscription | Delete assessment (own only) |

### Assessment Object

```json
{
  "id": "uuid",
  "name": "Pain Assessment",
  "description": "Evaluate patient pain levels",
  "surveyJson": { /* SurveyJS definition */ },
  "scoringConfig": { /* Scoring rules */ },
  "outcomeRules": { /* Outcome mapping */ },
  "isPublished": true,
  "isTemplate": false
}
```

## Assessment Invites

Send assessments to patients.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/assessment-invites` | Subscription | Send assessment to patient |
| GET | `/api/assessment-invites` | Subscription | List sent invites |
| GET | `/api/assessment-invites/token/:token` | None | Get invite by token (patient) |
| POST | `/api/assessment-invites/:id/complete` | None | Submit assessment responses |

## Internal Screenings

In-office assessments conducted by clinician.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/internal-screenings` | Subscription | Record screening results |
| GET | `/api/internal-screenings` | Subscription | List screenings |

## Email Logs

Track content sent to patients.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/email-logs` | Subscription | Send content bundle to patient |
| GET | `/api/email-logs` | Subscription | List sent emails |
| GET | `/api/email-logs/:id/content-views` | Subscription | Get view tracking for email |
| POST | `/api/email-logs/:id/resend` | Subscription | Resend with new access code |

### Send Email Request

```json
{
  "patientEmail": "patient@example.com",
  "subject": "Your Educational Materials",
  "type": "content_bundle",
  "contentIds": ["content-id-1", "content-id-2"],
  "providerNote": "Please review these materials before your next visit."
}
```

## Recommendation System

### Recommendation Rules (Simple)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recommendation-rules` | Subscription | List rules |
| POST | `/api/recommendation-rules` | Subscription | Create rule |
| DELETE | `/api/recommendation-rules/:id` | Subscription | Delete rule |

### Recommendation Configs (Advanced)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recommendation-configs` | Subscription | List configs (filter by assessment/pathway) |
| POST | `/api/recommendation-configs` | Subscription | Create config |
| PUT | `/api/recommendation-configs/:id` | Subscription | Update config |
| DELETE | `/api/recommendation-configs/:id` | Subscription | Delete config |
| POST | `/api/recommendations/preview` | Subscription | Preview recommendations for scores |

### Patient Recommendations History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patient-recommendations` | Subscription | List recommendation history |
| GET | `/api/patient-recommendations/:id` | Subscription | Get recommendation details |

## Care Pathways

Multi-week treatment protocols.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pathways` | Subscription | List pathways (custom + templates) |
| GET | `/api/pathways/:id` | Subscription | Get pathway with milestones |
| POST | `/api/pathways` | Subscription | Create pathway |
| PATCH | `/api/pathways/:id` | Subscription | Update pathway |
| DELETE | `/api/pathways/:id` | Subscription | Delete pathway |
| POST | `/api/pathways/:id/milestones` | Subscription | Add milestone |
| PATCH | `/api/milestones/:id` | Subscription | Update milestone |
| DELETE | `/api/milestones/:id` | Subscription | Delete milestone |

## Patient Pathways (Enrollments)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patient-pathways` | Subscription | List enrollments |
| POST | `/api/patient-pathways` | Subscription | Enroll patient |
| PATCH | `/api/patient-pathways/:id` | Subscription | Update enrollment |

## Follow-up Rules

Automated follow-up configuration.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/follow-up-rules` | Subscription | List rules (custom + templates) |
| POST | `/api/follow-up-rules` | Subscription | Create rule |
| PATCH | `/api/follow-up-rules/:id` | Subscription | Update rule |
| DELETE | `/api/follow-up-rules/:id` | Subscription | Delete rule |
| POST | `/api/follow-up-templates/:id/toggle` | Subscription | Enable/disable template |
| GET | `/api/scheduled-follow-ups` | Subscription | List scheduled follow-ups |

## Patient Portal

Patient-facing endpoints.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/patient-portal/auth` | None | Authenticate with email + access code |
| GET | `/api/patient-portal/content` | Bearer Token | Get assigned content |

### Patient Auth Request

```json
{
  "email": "patient@example.com",
  "accessCode": "123456"
}
```

### Patient Auth Response

```json
{
  "success": true,
  "patientEmail": "patient@example.com",
  "sessionToken": "uuid-session-token"
}
```

## Public Content View

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/content-view/:token` | None | View content by tracking token |
| POST | `/api/public/content-view/:token/time` | None | Update time spent on content |

## Dashboard & Stats

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stats` | Subscription | Get dashboard statistics |
| GET | `/api/patient-summary/:email` | Subscription | Get patient engagement summary |

## Subscription

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscription/create` | Session | Create/activate subscription |
| POST | `/api/subscription/cancel` | Session | Cancel subscription |

## Admin Endpoints

Requires `admin` role.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/users/:id` | Admin | Get user details |
| POST | `/api/admin/users` | Admin | Create user |
| PATCH | `/api/admin/users/:id` | Admin | Update user |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| PATCH | `/api/admin/users/:id/subscription` | Admin | Update subscription |
| POST | `/api/admin/users/:id/extend-subscription` | Admin | Extend subscription |
| POST | `/api/admin/users/:id/reset-password` | Admin | Reset password |
| POST | `/api/admin/create-trial-user` | Admin | Create trial user |
| GET | `/api/admin/stats` | Admin | Get admin statistics |
| GET | `/api/admin/analytics` | Admin | Get detailed analytics |
| GET | `/api/admin/audit-logs` | Admin | View audit logs |
| GET | `/api/admin/data-inventory` | Admin | View data inventory |
| POST | `/api/admin/data-inventory` | Admin | Create inventory item |
| PATCH | `/api/admin/data-inventory/:id` | Admin | Update inventory item |
| DELETE | `/api/admin/data-inventory/:id` | Admin | Delete inventory item |

## Error Responses

All errors return JSON with an `error` field:

```json
{
  "error": "Description of what went wrong"
}
```

Common status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not found
- `500` - Server error
