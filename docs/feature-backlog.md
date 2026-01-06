# Feature Backlog

Living document tracking planned features for RehabPilot. Add, remove, and reprioritize as needed.

---

## In Progress

### Clinician Onboarding Flow
**Priority:** High  
**Status:** Planning

Guided setup wizard for new clinicians after first login:
- Welcome screen with value proposition
- Gmail OAuth connection
- Content library tour
- Create/select first assessment
- Send first content bundle (test email)
- Completion celebration + dashboard redirect

**Acceptance Criteria:**
- [ ] Detect first-time login
- [ ] Skippable but encouraged
- [ ] Progress saved if abandoned mid-flow
- [ ] Mark onboarding complete in user record

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

### Patient Progress Dashboard
**Priority:** Medium  
**Status:** Not Started

Visualize patient journey over time:
- Assessment score trends (line charts)
- Content engagement timeline
- Pathway milestone completion
- Comparison to baseline

---

### EMR Export / Report Generation
**Priority:** Medium  
**Status:** Not Started

Generate clinician-friendly reports:
- Printable patient summary (PDF)
- Copy-paste text for EMR notes
- Include: engagement stats, assessment scores, content viewed
- Date range filtering

---

### Team / Practice Management
**Priority:** Medium  
**Status:** Not Started

Multi-clinician organizations:
- Practice/organization entity
- Invite team members
- Shared content library
- Patient handoff between clinicians
- Role-based access (owner, member, readonly)

---

### Advanced Analytics Dashboard
**Priority:** Low  
**Status:** Not Started

Deeper insights for clinicians:
- Patient cohort comparisons
- Content effectiveness metrics
- Assessment completion funnels
- Engagement heatmaps by day/time

---

### Multi-language Content Support
**Priority:** Low  
**Status:** Not Started

Deliver content in patient's preferred language:
- Language preference field on email logs
- Content translation management
- Language-aware content recommendations

---

### Patient Messaging
**Priority:** Low  
**Status:** Not Started

Two-way communication:
- Secure message inbox
- Quick replies to patient questions
- Message templates
- Notification preferences

---

## Completed

*(Move features here when done)*

---

## Icebox

*(Features on hold or deprioritized)*

---

## Notes

- Update this document as priorities shift
- Move items between sections as status changes
- Add new ideas to Backlog or Icebox
