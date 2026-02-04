# Feature Backlog

Living document tracking planned features for RehabPilot. Add, remove, and reprioritize as needed.

---

## In Progress

### Clinician Onboarding Flow
**Priority:** High  
**Status:** Complete

Guided setup wizard for new clinicians after first login:
- Welcome screen with value proposition
- Email delivery choice (central vs personal Gmail)
- Content library tour
- Create/select first assessment
- Send first content bundle (test email)
- Completion celebration + dashboard redirect

**Acceptance Criteria:**
- [x] Detect first-time login
- [x] Skippable but encouraged
- [x] Progress saved if abandoned mid-flow
- [x] Mark onboarding complete in user record

---

## Up Next

### Stripe Payment Integration
**Priority:** High  
**Status:** Not Started

Replace stubbed subscription system with real Stripe integration:
- Checkout session creation
- Webhook handling (subscription created, updated, canceled, payment failed)
- Customer portal for billing management
- Subscription status sync
- Grace period for failed payments

---

### Follow-up Automation Scheduler
**Priority:** High  
**Status:** Not Started

Background job system to send scheduled follow-ups:
- Process follow-up rules at configured intervals
- Send automated check-in emails
- Deliver pathway milestone content on schedule
- Handle timezone considerations
- Retry failed sends

---

## Backlog

### 1. Patient Progress Dashboard
**Priority:** High  
**Status:** Not Started

Let patients see their own progress in the portal:
- Assessment score trends (line charts)
- Content engagement timeline
- Pathway milestone completion
- Comparison to baseline
- View completed content and assessment history

---

### 3. Daily Check-ins
**Priority:** Medium  
**Status:** Not Started

Quick daily pain/mood rating patients can submit:
- Simple 1-10 pain scale via email or SMS link
- Mood/wellness check options
- Track trends over time
- Alert clinicians to significant changes
- Mobile-friendly submission form

---

### 4. Patient Notes
**Priority:** Medium  
**Status:** Not Started

Allow patients to add personal notes:
- Notes attached to specific content pieces
- Questions or concerns field
- Visible to clinician in patient record
- Encourage engagement and reflection
- Optional notification to clinician when note added

---

### 6. Bulk Patient Import
**Priority:** Medium  
**Status:** Not Started

Upload multiple patients at once:
- CSV file upload with patient emails
- Column mapping interface
- Validation and error reporting
- Optional: auto-send welcome content
- Import history log

---

### 8. Team Collaboration
**Priority:** Medium  
**Status:** Not Started

Multi-clinician organizations:
- Practice/organization entity
- Invite team members via email
- Shared content library
- Patient handoff between clinicians
- Role-based access (owner, admin, member, readonly)
- Unified billing for practice

---

### 9. SMS Delivery
**Priority:** Medium  
**Status:** Not Started

Send content links via text message:
- Phone number field for patients
- SMS as primary or secondary delivery method
- Short URL generation for content links
- Delivery status tracking
- Opt-out handling for SMS
- Integration with Twilio or similar service

---

### 10. Two-way Messaging
**Priority:** Medium  
**Status:** Not Started

Secure in-app messaging between clinicians and patients:
- Secure message inbox in patient portal
- Quick replies to patient questions
- Message templates for common responses
- Notification preferences (email, SMS)
- Message history per patient
- HIPAA-compliant message storage

---

### 13. Engagement Reports
**Priority:** Medium  
**Status:** Not Started

Weekly email digest for clinicians:
- Which patients are engaging with content
- Who needs follow-up (no activity)
- Assessment completion rates
- Content open rates
- Configurable report frequency
- Highlight notable changes

---

### 14. Population Health View
**Priority:** Medium  
**Status:** Not Started

Aggregate analytics across all patients:
- Cohort comparisons
- Content effectiveness metrics
- Assessment completion funnels
- Engagement heatmaps by day/time
- Identify trends across patient population
- Filter by condition, pathway, or date range

---

### 18. Telehealth Integration
**Priority:** Low  
**Status:** Not Started

Launch video calls directly from patient records:
- Integration with Zoom, Google Meet, or Doxy.me
- One-click video call scheduling
- Link generation for patient
- Call history logging
- Optional: in-app video using WebRTC

---

### 19. Referral Tracking
**Priority:** Low  
**Status:** Not Started

Track where patients come from:
- Referral source field on patient records
- Source categories (physician, self, marketing, other)
- Referral source reporting
- Measure effectiveness by source
- Thank-you automation for referrers

---

### 20. Treatment Notes Export
**Priority:** Medium  
**Status:** Not Started

Generate clinician-friendly reports for medical records:
- Printable patient summary (PDF)
- Copy-paste text for EMR notes
- Include: engagement stats, assessment scores, content viewed
- Date range filtering
- Customizable report templates
- HIPAA-compliant formatting

---

## Completed

### Email Delivery Mode Selection
**Priority:** High  
**Status:** Complete

Allow clinicians to choose email delivery method:
- [x] Central RehabPilot email (default)
- [x] Personal Gmail connection (OAuth coming soon)
- [x] Settings page with mode switching
- [x] Onboarding step for initial selection

---

## Icebox

*(Features on hold or deprioritized)*

### Multi-language Content Support
**Priority:** Low  
**Status:** On Hold

Deliver content in patient's preferred language:
- Language preference field on email logs
- Content translation management
- Language-aware content recommendations

---

## Notes

- Update this document as priorities shift
- Move items between sections as status changes
- Add new ideas to Backlog or Icebox
- Feature numbers match the original recommendations list for reference
