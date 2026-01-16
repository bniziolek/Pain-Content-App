import { getUncachableGitHubClient } from '../server/github';

interface FeatureIssue {
  title: string;
  body: string;
  labels: string[];
}

const OWNER = 'bniziolek';
const REPO = 'Pain-Content-App';

const plannedFeatures: FeatureIssue[] = [
  {
    title: "Feature: Patient Portal",
    labels: ["feature", "planned", "patient-portal", "patient-facing"],
    body: `## Overview
A secure, patient-facing portal where patients can access educational content sent by their clinician. Patients log in using their email and a unique access code received via email, then view personalized content and complete assessments.

## How It Works
1. Patient receives an email from their clinician containing educational content and an access code
2. Patient visits the patient portal and enters their email + 6-digit access code
3. After verification, patient sees a personalized dashboard with their assigned content
4. Patient can read educational modules, complete assessments, and track their progress
5. Sessions expire after 24 hours for security, requiring re-authentication

## Security Features
- Access codes are securely hashed (not stored in plain text)
- Sessions are scoped to specific content sent to that patient
- Tiered lockout after failed login attempts (5 min, 1 hour, permanent)
- 24-hour session expiration with sliding window for active users

## User Stories

### Patient Authentication
- [ ] As a patient, I can access the patient portal from a link in my email
- [ ] As a patient, I can log in using my email and access code
- [ ] As a patient, I receive a clear error message if my access code is wrong
- [ ] As a patient, I am protected from brute force attacks via lockout

### Content Access
- [ ] As a patient, I can see all educational content assigned to me
- [ ] As a patient, I can read full educational modules in the portal
- [ ] As a patient, I can see which content I've already viewed
- [ ] As a patient, I only see content from the specific email that contained my access code

### Assessment Completion
- [ ] As a patient, I can see assessments assigned to me
- [ ] As a patient, I can complete assessments directly in the portal
- [ ] As a patient, I receive confirmation when I complete an assessment
- [ ] As a patient, my clinician is notified when I complete assessments

### Session Management
- [ ] As a patient, I remain logged in while actively using the portal
- [ ] As a patient, I am securely logged out after inactivity
- [ ] As a patient, I can manually log out when finished
`
  },
  {
    title: "Feature: Email Delivery (Patient Messaging)",
    labels: ["feature", "planned", "email", "patient-facing"],
    body: `## Overview
Send curated educational content directly to patients via email. Clinicians can select content from the library and send personalized bundles to patient email addresses, with tracking of delivery and engagement.

## How It Works
1. Clinician browses the content library and selects items to send
2. Clinician enters patient's email address and optional personalized message
3. System generates a secure access code for the patient
4. Professional HTML email is sent via Gmail with DriverPath branding
5. Patient receives email with content preview and link to patient portal
6. Clinician can track email delivery status and patient engagement

## Email Features
- Professional HTML templates with DriverPath branding
- Secure access code included for patient portal login
- Content previews in the email body
- Delivery status tracking (sent, opened, accessed)

## User Stories

### Content Selection
- [ ] As a clinician, I can select multiple content items to send
- [ ] As a clinician, I can preview what the email will look like
- [ ] As a clinician, I can add a personalized message to the email

### Email Delivery
- [ ] As a clinician, I can enter a patient email address
- [ ] As a clinician, I receive confirmation when email is sent
- [ ] As a clinician, I can see delivery status of sent emails
- [ ] As a patient, I receive a professional, branded email

### Engagement Tracking
- [ ] As a clinician, I can see if a patient opened their email
- [ ] As a clinician, I can see if a patient accessed the content
- [ ] As a clinician, I can see when content was last accessed
- [ ] As a clinician, I can resend content if needed

### Send History
- [ ] As a clinician, I can view all emails I've sent
- [ ] As a clinician, I can filter send history by patient or date
- [ ] As a clinician, I can see which content was included in each email
`
  },
  {
    title: "Feature: Patient Assessments (Remote Invites)",
    labels: ["feature", "planned", "assessments", "patient-facing"],
    body: `## Overview
Send assessment invitations to patients for remote completion. Unlike internal screenings (completed by clinicians), patient assessments allow patients to complete questionnaires independently, with results automatically scored and available for clinician review.

## How It Works
1. Clinician selects a published assessment to send
2. Clinician enters patient email and sends the invite
3. Patient receives email with a unique assessment link
4. Patient completes the assessment in the patient portal
5. Responses are automatically scored and recommendations generated
6. Clinician receives notification and can review results

## User Stories

### Sending Invites
- [ ] As a clinician, I can send an assessment invite to a patient email
- [ ] As a clinician, I can choose from my published assessments
- [ ] As a clinician, I can add a message explaining the assessment purpose
- [ ] As a clinician, I can set a deadline for completion

### Patient Experience
- [ ] As a patient, I receive a clear email explaining the assessment
- [ ] As a patient, I can complete the assessment on any device
- [ ] As a patient, I can save progress and return later
- [ ] As a patient, I see a confirmation when I submit

### Results & Scoring
- [ ] As a clinician, I am notified when a patient completes an assessment
- [ ] As a clinician, I can view scored results with tag breakdowns
- [ ] As a clinician, I can see recommendations generated from patient responses
- [ ] As a clinician, I can compare results over time for the same patient

### Invite Management
- [ ] As a clinician, I can see pending assessment invites
- [ ] As a clinician, I can resend invites if needed
- [ ] As a clinician, I can cancel pending invites
- [ ] As a clinician, I can view completed assessment history
`
  },
  {
    title: "Feature: Care Pathways",
    labels: ["feature", "planned", "pathways", "advanced"],
    body: `## Overview
Multi-week treatment protocols that guide patients through structured educational journeys. Pathways organize content into milestones delivered over time, ensuring patients receive the right information at the right stage of their recovery.

## How It Works
1. Clinician selects a care pathway for a patient's condition (e.g., "Chronic Low Back Pain - 8 weeks")
2. Patient is enrolled in the pathway with a start date
3. Content is scheduled based on pathway milestones (Week 1, Week 2, etc.)
4. System delivers appropriate content at each milestone
5. Clinician tracks patient progress through the pathway
6. Recommendations are context-aware based on current milestone

## Pathway Structure
- **Pathway**: Overall treatment protocol (e.g., 8-week program)
- **Milestones**: Weekly checkpoints with specific goals
- **Content References**: Educational modules linked to each milestone

## User Stories

### Pathway Management
- [ ] As a clinician, I can browse available care pathways
- [ ] As a clinician, I can see pathway details (duration, milestones, content)
- [ ] As a clinician, I can create custom pathways for my practice
- [ ] As an admin, I can manage system-wide pathway templates

### Patient Enrollment
- [ ] As a clinician, I can enroll a patient in a care pathway
- [ ] As a clinician, I can set the pathway start date
- [ ] As a clinician, I can see which patients are in which pathways
- [ ] As a clinician, I can remove a patient from a pathway

### Milestone Tracking
- [ ] As a clinician, I can see a patient's current milestone
- [ ] As a clinician, I can see upcoming milestones and content
- [ ] As a clinician, I can manually advance a patient to the next milestone
- [ ] As a patient, I can see my progress through the pathway

### Pathway-Aware Recommendations
- [ ] As a clinician, recommendations consider the patient's current milestone
- [ ] As a clinician, I see pathway-specific content prioritized in recommendations
- [ ] As a clinician, I can override pathway content with custom selections
`
  },
  {
    title: "Feature: Follow-up Automation",
    labels: ["feature", "planned", "automation", "advanced"],
    body: `## Overview
Automated rules that trigger follow-up actions based on patient engagement and assessment results. Reduces manual tracking by automatically scheduling check-ins, resending content, or alerting clinicians when intervention is needed.

## How It Works
1. Clinician defines follow-up rules (e.g., "If patient hasn't accessed content in 3 days, send reminder")
2. System monitors patient engagement and assessment completion
3. When conditions are met, automated actions trigger
4. Clinician receives alerts for high-priority follow-ups
5. All automated actions are logged for compliance

## Rule Types
- **Engagement-based**: Trigger on content access patterns
- **Time-based**: Trigger after X days since last activity
- **Score-based**: Trigger when assessment scores exceed thresholds
- **Milestone-based**: Trigger when pathway milestones are reached

## User Stories

### Rule Creation
- [ ] As a clinician, I can create follow-up rules with conditions
- [ ] As a clinician, I can choose trigger types (engagement, time, score)
- [ ] As a clinician, I can specify actions (send email, alert, schedule)
- [ ] As a clinician, I can set rule priority and timing

### Automated Actions
- [ ] As a clinician, the system sends automated reminder emails
- [ ] As a clinician, I receive alerts when manual intervention is needed
- [ ] As a clinician, follow-ups are scheduled automatically based on rules
- [ ] As a patient, I receive timely reminders without clinician manual effort

### Rule Management
- [ ] As a clinician, I can view all my active follow-up rules
- [ ] As a clinician, I can pause or disable rules
- [ ] As a clinician, I can see rule execution history
- [ ] As a clinician, I can edit existing rules

### Monitoring & Alerts
- [ ] As a clinician, I see a summary of pending follow-ups
- [ ] As a clinician, I can filter patients needing attention
- [ ] As a clinician, I can mark follow-ups as complete
- [ ] As a clinician, I can override automated decisions
`
  }
];

async function ensurePlannedLabelExists(octokit: any) {
  console.log('Checking and creating labels...');
  
  const labelsToCreate = [
    { name: 'planned', color: 'fbca04', description: 'Planned for future implementation' },
    { name: 'patient-portal', color: '7057ff', description: 'Patient portal feature' },
    { name: 'patient-facing', color: 'e99695', description: 'Patient-facing functionality' },
    { name: 'email', color: '0075ca', description: 'Email delivery related' },
    { name: 'pathways', color: 'a2eeef', description: 'Care pathways feature' },
    { name: 'automation', color: 'f9d0c4', description: 'Automation features' },
    { name: 'advanced', color: 'd876e3', description: 'Advanced features' },
  ];

  for (const label of labelsToCreate) {
    try {
      await octokit.issues.createLabel({
        owner: OWNER,
        repo: REPO,
        name: label.name,
        color: label.color,
        description: label.description,
      });
      console.log(`  Created label: ${label.name}`);
    } catch (error: any) {
      if (error.status === 422) {
        console.log(`  Label already exists: ${label.name}`);
      } else {
        console.error(`  Error creating label ${label.name}:`, error.message);
      }
    }
  }
}

async function createPlannedIssues() {
  console.log('Starting GitHub issue creation for planned features...\n');
  console.log(`Repository: ${OWNER}/${REPO}\n`);

  try {
    const octokit = await getUncachableGitHubClient();
    
    await ensurePlannedLabelExists(octokit);
    
    console.log('\nCreating planned feature issues...');
    
    for (const feature of plannedFeatures) {
      try {
        const response = await octokit.issues.create({
          owner: OWNER,
          repo: REPO,
          title: feature.title,
          body: feature.body,
          labels: feature.labels,
        });
        
        console.log(`  Created issue #${response.data.number}: ${feature.title}`);
      } catch (error: any) {
        console.error(`  Error creating issue "${feature.title}":`, error.message);
      }
    }
    
    console.log('\nDone! All planned feature issues have been created.');
  } catch (error: any) {
    console.error('Error connecting to GitHub:', error.message);
    process.exit(1);
  }
}

createPlannedIssues();
