# Feature Walkthroughs

This document provides step-by-step, non-technical walkthroughs of key features. It is designed to help operators, testers, and product owners understand how each feature works end-to-end.

Screenshots are captured from the development environment and may differ slightly from production.

## How to Use This

- Follow the steps as a user would.
- Check the expected result after each step.
- Capture screenshots at the suggested points for future reference.

Screenshots captured from dev are embedded below each section.

---

## 1) Login and Dashboard

### Steps

1. Open the app in a browser.
2. Log in with a valid clinician account.
3. Land on the dashboard.

### Expected Results

- You see a dashboard with stats cards and recent activity.
- Navigation shows key sections (Content, Assessments, Messaging, etc.).

### Suggested Screenshots

- `docs/assets/screenshots/01-login-dashboard.png` (dashboard overview with stats cards)

![Dashboard overview](docs/assets/screenshots/01-login-dashboard.png)

---

## 2) Content Library (View and Preview)

### Steps

1. Click **Content** in the navigation.
2. Browse the list of content items.
3. Use search or tag filters.
4. Click the preview icon on a content card.
5. Review the content detail modal.

### Expected Results

- The content list shows available items.
- The preview modal shows content details.

### Suggested Screenshots

- `docs/assets/screenshots/02-content-list.png` (content list page)
- `docs/assets/screenshots/04-content-detail.png` (content preview modal)

![Content list](docs/assets/screenshots/02-content-list.png)
![Content preview](docs/assets/screenshots/04-content-detail.png)

---

## 3) Send Content to a Patient

### Steps

1. Open a content item or use the send dialog.
2. Select one or more content items.
3. Enter the patient email.
4. Add an optional provider note.
5. Click **Send**.

### Expected Results

- A success confirmation appears.
- The email log appears in the send history.

### Suggested Screenshots

- `docs/assets/screenshots/05-send-dialog.png` (send dialog)
- `docs/assets/screenshots/06-send-success.png` (success confirmation)
- `docs/assets/screenshots/07-email-log-list.png` (email log list)

![Send dialog](docs/assets/screenshots/05-send-dialog.png)
![Send success](docs/assets/screenshots/06-send-success.png)
![Email log list](docs/assets/screenshots/07-email-log-list.png)

---

## 4) Assessments (Create and Send)

### Steps

1. Go to **Assessments**.
2. Create a new assessment using the builder.
3. Save and publish it.
4. Send an assessment invite to a patient.

### Expected Results

- Assessment appears in the list as published.
- The invite appears in the assessment invites list.

### Suggested Screenshots

- `docs/assets/screenshots/08-assessment-list.png` (assessment list)
- `docs/assets/screenshots/09-assessment-builder.png` (assessment builder)
- `docs/assets/screenshots/10-assessment-invites.png` (invite list)

![Assessment list](docs/assets/screenshots/08-assessment-list.png)
![Assessment builder](docs/assets/screenshots/09-assessment-builder.png)
![Assessment invites](docs/assets/screenshots/10-assessment-invites.png)

---

## 5) Patient Portal Access

### Steps

1. Go to the patient portal page.
2. Enter the patient email and access code.
3. View the patient’s assigned content.

### Expected Results

- Patient sees content assigned to them only.
- Completing an assessment updates clinician view.

### Suggested Screenshots

- `docs/assets/screenshots/11-patient-portal-login.png` (patient portal login screen)
- `docs/assets/screenshots/12-patient-content-list.png` (patient content list)

![Patient portal login](docs/assets/screenshots/11-patient-portal-login.png)
![Patient content list](docs/assets/screenshots/12-patient-content-list.png)

---

## 6) Recommendations

### Steps

1. Go to **Recommendations** (admin/clinician view).
2. Create or update recommendation rules.
3. Preview recommendations.

### Expected Results

- Preview shows recommended content.
- New rules appear in the list.

### Suggested Screenshots

- `docs/assets/screenshots/13-recommendations-list.png` (recommendation rules list)

![Recommendation rules](docs/assets/screenshots/13-recommendations-list.png)

---

## 7) Subscription and Billing

### Steps

1. Go to **Settings** or **Subscription**.
2. View current subscription state.
3. Start a checkout session (if enabled).

### Expected Results

- Billing status loads correctly.
- Checkout redirects to Stripe.

### Suggested Screenshots

- `docs/assets/screenshots/15-subscription-settings.png` (subscription settings page)

![Subscription settings](docs/assets/screenshots/15-subscription-settings.png)

---

## 8) Admin Management

### Steps

1. Go to the **Admin** section.
2. Search for a user.
3. Update subscription status or role.

### Expected Results

- User updates reflect in the admin list.
- Audit records are created (if enabled).

### Suggested Screenshots

- `docs/assets/screenshots/17-admin-users.png` (admin user list)
- `docs/assets/screenshots/18-admin-user-detail.png` (user detail / edit view, pending)

![Admin users](docs/assets/screenshots/17-admin-users.png)

---

## 9) Compliance and Audit Logs

### Steps

1. Go to **Compliance**.
2. Filter audit logs by date or action.

### Expected Results

- Audit logs appear with timestamps and actors.

### Suggested Screenshots

- `docs/assets/screenshots/19-audit-logs.png` (audit log view in admin feature flags)

![Audit logs](docs/assets/screenshots/19-audit-logs.png)

---

## 10) PDF Generation

### Steps

1. Open a content item.
2. Generate a PDF.

### Expected Results

- PDF downloads or opens in a new tab.

### Suggested Screenshots

- `docs/assets/screenshots/20-pdf-preview.png` (PDF preview)

![PDF preview](docs/assets/screenshots/20-pdf-preview.png)
