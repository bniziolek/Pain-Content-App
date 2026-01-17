# Patient Portal Flow

How patients access their content and complete assessments.

## Overview

The Patient Portal (`/patient-portal`) is where patients:
- View educational content assigned by their clinician
- Complete assessments
- Track their progress

## Authentication Flow

### Step 1: Patient Receives Email

When a clinician sends content, the patient receives an email containing:
- Subject line from the clinician
- Optional provider note
- **6-digit access code**
- Link to the Patient Portal

### Step 2: Patient Enters Credentials

At `/patient-portal`:
1. Patient enters their **email address**
2. Patient enters their **6-digit access code**
3. System validates credentials

### Step 3: Session Created

On successful auth:
- Secure session token (UUID) is generated
- Session stored in database
- 24-hour expiration
- Session scoped to specific email log (can only see content from that email)

## Security Features

### Access Code Protection

- **PBKDF2 hashing**: 100,000 iterations, SHA-512
- **Per-code salt**: Each code has unique salt
- **Tiered lockout**:
  - 3 failed attempts → 5-minute lockout
  - 6 failed attempts → 1-hour lockout
  - 9 failed attempts → Permanent lockout (contact clinician)

### Session Security

- UUID tokens (not guessable)
- Stored in database (not just cookies)
- 24-hour expiration
- Sliding window (activity extends session)
- Scoped to specific email log ID

### Content Scoping

Patients can only see:
- Content from the specific email that contained their access code
- Assessments from the same clinician

## What Patients See

### Dashboard

After login, patients see:
- **Assigned Content**: Educational materials with:
  - Title
  - Summary
  - Read time estimate
  - View status (viewed/not viewed)
- **Assessments**: Any pending assessments to complete

### Content Viewer

When clicking content:
- Full markdown content rendered
- Images and formatting preserved
- Time spent tracked for analytics

### Assessment Form

For assessments:
- SurveyJS form rendered
- Multi-page navigation
- Progress indicator
- Submit button at end

## Technical Implementation

### API Endpoints

```
POST /api/patient-portal/auth
  Request: { email, accessCode }
  Response: { success, sessionToken, patientEmail }

GET /api/patient-portal/content
  Headers: Authorization: Bearer <sessionToken>
  Response: { content: [...], assessments: [...] }
```

### Session Management

```typescript
// Creating session
const sessionToken = crypto.randomUUID();
await storage.createPatientSession({
  token: sessionToken,
  patientEmail: email,
  emailLogId: emailLog.id,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

// Validating session
const session = await storage.getPatientSessionByToken(token);
if (!session || session.expiresAt < new Date()) {
  // Invalid or expired
}
```

### Lockout Logic

```typescript
// After failed attempt
const newAttempts = (emailLog.failedAttempts || 0) + 1;

if (newAttempts >= 9) {
  // Permanent lockout
} else if (newAttempts >= 6) {
  // 1-hour lockout
} else if (newAttempts >= 3) {
  // 5-minute lockout
}
```

## Email Template

Patients receive HTML emails with:

```
Subject: Your Educational Materials from [Clinician Name]

Hi,

Your healthcare provider has sent you educational materials 
to help with your care.

ACCESS CODE: 123456

[Access Patient Portal] → Link to /patient-portal

Provider's Note:
[Optional personalized message]

---
RehabPilot | Evidence-Based Patient Education
```

## Clinician View

Clinicians can see:
- **Send History**: All emails sent, with status
- **Content Views**: Which content was viewed, when, for how long
- **Assessment Results**: Completed assessments with scores
- **Patient Summary**: Aggregated engagement data

## Troubleshooting

### "Invalid email or access code"

**For patients:**
- Check email matches exactly (case-insensitive)
- Verify 6-digit code is correct
- Check for lockout message

**For clinicians:**
- Verify email was sent (check Send History)
- Resend with new access code if needed

### "Session expired"

Sessions expire after 24 hours of inactivity.
- Patient needs to log in again with their access code
- If code is old, clinician may need to resend content

### Account locked

After 9 failed attempts, the access code is permanently locked.
- Clinician must resend content with new access code
- Old code cannot be recovered

## HIPAA Compliance

All patient portal actions are logged:
- Login attempts (success/failure)
- Content views
- Assessment submissions
- Session activity

Logs include:
- Patient email
- IP address
- Timestamp
- Action details
