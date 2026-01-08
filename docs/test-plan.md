# RehabPilot Manual Test Plan

## Overview

This document contains manual test cases for validating RehabPilot functionality. Use this checklist during QA before merging code changes.

**Testing Cadence:**
1. Developer completes feature
2. Automated tests run (if applicable)
3. Developer writes/updates test plan for affected areas
4. Manual tester executes relevant test cases
5. All tests pass → Merge approved

---

## Full Application Test (Initial Release)

Complete all sections below for initial release validation.

---

## 1. Authentication & Account

### 1.1 Registration
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.1.1 | New user registration | Go to /auth, click "Create account", enter name, email, password | Account created, redirected to onboarding | +☐ |
| 1.1.2 | Duplicate email rejected | Try to register with existing email | Error message: "Email already registered" | +☐ |
| 1.1.3 | Weak password rejected | Try password less than 6 characters | Error message about password requirements | +☐ |
| 1.1.4 | Invalid email rejected | Enter malformed email (no @) | Error message about valid email | +☐ |

### 1.2 Login
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.2.1 | Valid login | Enter correct email/password | Logged in, redirected to dashboard | ☐ |
| 1.2.2 | Invalid password | Enter wrong password | Error: "Invalid email or password" | ☐ |
| 1.2.3 | Non-existent email | Enter unregistered email | Error: "Invalid email or password" | ☐ |
| 1.2.4 | Session persistence | Log in, close browser, reopen | Still logged in | ☐ |

### 1.3 Logout
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.3.1 | Logout | Click logout in sidebar | Redirected to login page, session ended | ☐ |
| 1.3.2 | Protected route after logout | Try to access /dashboard after logout | Redirected to login | ☐ |

---

## 2. Onboarding Flow

### 2.1 New User Onboarding
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.1.1 | Onboarding starts automatically | Register new account | Onboarding wizard appears | ☐ |
| 2.1.2 | Step 1: Welcome | View welcome screen | Shows value proposition, "Get Started" button | ☐ |
| 2.1.3 | Step 2: Email delivery choice | Select email delivery method | Can choose between RehabPilot or personal Gmail | ☐ |
| 2.1.4 | Step 3: Content tour | View content library intro | Shows content count, explains library | ☐ |
| 2.1.5 | Step 4: Assessments intro | View assessment intro | Explains assessment builder feature | ☐ |
| 2.1.6 | Step 5: Sending guide | View sending guide | Shows how to send content | ☐ |
| 2.1.7 | Step 6: Completion | Complete onboarding | Celebration screen, redirect to dashboard | ☐ |
| 2.1.8 | Skip onboarding | Click "Skip for now" | Onboarding closes, goes to dashboard | ☐ |
| 2.1.9 | Progress saved | Complete step 3, refresh page | Returns to step 4, not step 1 | ☐ |

---

## 3. Dashboard

### 3.1 Dashboard Display
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.1.1 | Stats cards load | View dashboard | Shows sends, assessments completed, engagement rate | ☐ |
| 3.1.2 | Chart displays | View dashboard | Activity chart shows recent data | ☐ |
| 3.1.3 | Recent activity | View dashboard | Shows recent email sends and assessment completions | ☐ |
| 3.1.4 | Empty state | New user with no activity | Shows appropriate empty state messages | ☐ |

---

## 4. Content Library

### 4.1 Viewing Content
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.1.1 | Content list loads | Go to /content | Shows all content items | ☐ |
| 4.1.2 | Content cards display | View content list | Each card shows title, tags, read time | ☐ |
| 4.1.3 | Search content | Type in search box | Filters content by title/tags | ☐ |
| 4.1.4 | Filter by tag | Click a tag filter | Shows only content with that tag | ☐ |

### 4.2 Content Details
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.2.1 | View content detail | Click on content card | Shows full content with body | ☐ |
| 4.2.2 | Edit content | Click edit button | Opens edit form with current values | ☐ |
| 4.2.3 | Save content edits | Make changes, click save | Content updated, changes visible | ☐ |
| 4.2.4 | Delete content | Click delete, confirm | Content removed from list | ☐ |

### 4.3 Creating Content
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.3.1 | Create new content | Click "Add Content", fill form | New content appears in list | ☐ |
| 4.3.2 | Required fields | Submit without title | Validation error shown | ☐ |
| 4.3.3 | Add tags | Add multiple tags to content | Tags saved and displayed | ☐ |

---

## 5. Sending Content

### 5.1 Send Content Flow
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.1.1 | Open send dialog | Click "Send to Patient" | Send dialog opens | ☐ |
| 5.1.2 | Select content | Check content items to send | Items highlighted, count shown | ☐ |
| 5.1.3 | Enter patient email | Type email address | Email validated | ☐ |
| 5.1.4 | Include assessment | Toggle assessment inclusion | Assessment selector appears | ☐ |
| 5.1.5 | Send content | Click send | Success message, email logged | ☐ |
| 5.1.6 | Invalid email rejected | Enter bad email format | Validation error | ☐ |
| 5.1.7 | Empty selection rejected | Try to send with no content | Error: select at least one item | ☐ |

---

## 6. Assessments

### 6.1 Assessment List
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.1.1 | View assessments | Go to /assessments | Shows all assessments | ☐ |
| 6.1.2 | Filter by status | Click Published/Draft filter | Filters list accordingly | ☐ |
| 6.1.3 | Template assessments | View templates tab | Shows system templates | ☐ |

### 6.2 Assessment Builder
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.2.1 | Create new assessment | Click "Create Assessment" | Opens SurveyJS builder | ☐ |
| 6.2.2 | Add question | Drag question type to form | Question added to form | ☐ |
| 6.2.3 | Edit question | Click question, edit text | Question text updated | ☐ |
| 6.2.4 | Save draft | Click save | Assessment saved as draft | ☐ |
| 6.2.5 | Publish assessment | Click publish | Status changes to published | ☐ |
| 6.2.6 | Preview assessment | Click preview | Shows patient view of assessment | ☐ |

### 6.3 Assessment Invites
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.3.1 | Send assessment invite | Send content with assessment | Invite created, email sent | ☐ |
| 6.3.2 | View pending invites | Go to assessment invites list | Shows pending invites | ☐ |

---

## 7. Patient Portal

### 7.1 Patient Authentication
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.1.1 | Access patient portal | Go to /patient-portal | Shows email + access code form | ☐ |
| 7.1.2 | Valid login | Enter email + correct access code | Logged in, sees content | ☐ |
| 7.1.3 | Wrong access code | Enter incorrect code | Error message, denied access | ☐ |
| 7.1.4 | Wrong email | Enter email that wasn't sent content | Error: no content found | ☐ |
| 7.1.5 | Lockout after failures | Enter wrong code 5 times | Temporary lockout message | ☐ |

### 7.2 Patient Content View
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.2.1 | View assigned content | Log in as patient | Sees content sent by clinician | ☐ |
| 7.2.2 | Read content | Click on content item | Full content displays | ☐ |
| 7.2.3 | Content tracking | View content, check clinician side | View logged in clinician dashboard | ☐ |
| 7.2.4 | Only sees own content | Patient A logs in | Cannot see Patient B's content | ☐ |

### 7.3 Patient Assessments
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.3.1 | View pending assessment | Patient with invite logs in | Assessment appears in list | ☐ |
| 7.3.2 | Complete assessment | Fill out all questions, submit | Assessment marked complete | ☐ |
| 7.3.3 | Partial completion | Start assessment, leave | Progress NOT saved (or is, depending on design) | ☐ |
| 7.3.4 | View recommendations | Complete assessment | Recommended content shown (if applicable) | ☐ |

---

## 8. Recommendation Engine

### 8.1 Recommendation Rules
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 8.1.1 | View rules | Go to /recommendation-rules | Shows existing rules | ☐ |
| 8.1.2 | Create rule | Click add, set tag + score range + content | Rule created | ☐ |
| 8.1.3 | Edit rule | Click edit on rule | Can modify and save | ☐ |
| 8.1.4 | Delete rule | Click delete, confirm | Rule removed | ☐ |
| 8.1.5 | Preview recommendations | Use preview with sample scores | Shows what content would be recommended | ☐ |

### 8.2 Recommendation Generation
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 8.2.1 | Recommendations from assessment | Patient completes assessment | Recommendations generated based on scores | ☐ |
| 8.2.2 | Rule-based recommendations | High score on tag with rule | Rule's content recommended | ☐ |
| 8.2.3 | Tag-based fallback | Score on tag with no rule | Content with matching tag recommended | ☐ |

---

## 9. Care Pathways

### 9.1 Pathway Management
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 9.1.1 | View pathways | Go to /pathways | Shows available pathways | ☐ |
| 9.1.2 | View pathway details | Click on pathway | Shows milestones and content | ☐ |
| 9.1.3 | Create pathway | Click create, add milestones | Pathway created with milestones | ☐ |
| 9.1.4 | Edit pathway | Modify pathway details | Changes saved | ☐ |

### 9.2 Patient Enrollment
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 9.2.1 | Enroll patient | Assign patient to pathway | Enrollment created | ☐ |
| 9.2.2 | Progress tracking | Complete milestone | Progress updated | ☐ |

---

## 10. Settings

### 10.1 Profile Settings
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 10.1.1 | View profile | Go to Settings > Profile | Shows current user info | ☐ |
| 10.1.2 | Update name | Change name, save | Name updated | ☐ |
| 10.1.3 | Email read-only | View email field | Cannot edit email | ☐ |

### 10.2 Email Delivery Settings
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 10.2.1 | View email settings | Go to Settings > Email Delivery | Shows current mode | ☐ |
| 10.2.2 | Switch to central | Select RehabPilot option | Mode updated to central | ☐ |
| 10.2.3 | Personal Gmail (disabled) | Try to select personal | Shows "Coming Soon" or requires connection | ☐ |
| 10.2.4 | Disconnect Gmail | If connected, click disconnect | Connection removed, mode switches to central | ☐ |

### 10.3 Subscription & Billing
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 10.3.1 | View subscription status | Go to Settings > Billing | Shows current plan status | ☐ |
| 10.3.2 | View payment method | View billing tab | Shows card on file | ☐ |
| 10.3.3 | View billing history | View billing tab | Shows past invoices | ☐ |

---

## 11. Subscription Gating

### 11.1 Active Subscription
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 11.1.1 | Access all features | User with active subscription | Can access content, send, etc. | ☐ |

### 11.2 Inactive Subscription
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 11.2.1 | Block sending | User with lapsed subscription tries to send | Blocked with upgrade prompt | ☐ |
| 11.2.2 | Dashboard visible | User with lapsed subscription | Can still view dashboard | ☐ |
| 11.2.3 | Upgrade prompt | Access restricted feature | Shows subscription required message | ☐ |

---

## 12. Admin Features

### 12.1 Audit Logs
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 12.1.1 | View audit logs | Admin goes to audit logs | Shows system activity | ☐ |
| 12.1.2 | Filter by action | Filter by action type | Shows filtered results | ☐ |
| 12.1.3 | PHI access logged | View patient data | Log entry created | ☐ |

### 12.2 Data Inventory
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 12.2.1 | View data inventory | Admin views data inventory | Shows PHI/PII classifications | ☐ |

---

## 13. Email Delivery

### 13.1 Content Emails
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 13.1.1 | Email sent | Send content to patient | Email received in inbox | ☐ |
| 13.1.2 | Email content correct | Check received email | Contains correct content links | ☐ |
| 13.1.3 | Access code included | Check email | Contains valid access code | ☐ |
| 13.1.4 | Email logged | Check email logs | Send recorded with details | ☐ |

### 13.2 Assessment Invites
| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 13.2.1 | Invite email sent | Send assessment invite | Email received | ☐ |
| 13.2.2 | Assessment link works | Click link in email | Opens correct assessment | ☐ |

---

## 14. Mobile Responsiveness

| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 14.1 | Login on mobile | View login on phone-sized screen | Properly formatted | ☐ |
| 14.2 | Dashboard on mobile | View dashboard on mobile | Readable, usable | ☐ |
| 14.3 | Patient portal on mobile | Patient views content on phone | Full functionality | ☐ |
| 14.4 | Navigation on mobile | Use mobile nav | Hamburger menu works | ☐ |

---

## 15. Error Handling

| # | Test Case | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 15.1 | 404 page | Go to /nonexistent-page | Shows friendly 404 | ☐ |
| 15.2 | API error display | Cause API error (e.g., network off) | Shows error toast, doesn't crash | ☐ |
| 15.3 | Form validation | Submit invalid data | Clear error messages | ☐ |

---

## Test Execution Log

| Date | Tester | Scope | Results | Notes |
|------|--------|-------|---------|-------|
| | | | | |

---

## Notes

- Mark each test Pass (✓) or Fail (✗)
- For failures, add notes with steps to reproduce
- Re-test failed items after fixes
- Update test plan when new features are added
