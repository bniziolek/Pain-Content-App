import { getUncachableGitHubClient } from '../server/github';

interface FeatureIssue {
  title: string;
  body: string;
  labels: string[];
}

const OWNER = process.env.GITHUB_OWNER || '';
const REPO = process.env.GITHUB_REPO || '';

const features: FeatureIssue[] = [
  {
    title: "Feature: Authentication & Access Control",
    labels: ["feature", "completed", "authentication"],
    body: `## Overview
Secure login system for clinicians and administrators to access the DriverPath platform. The system manages user accounts, sessions, and permissions to ensure only authorized users can access patient-related features.

## How It Works
1. Clinicians create an account with email and password
2. Passwords are securely encrypted and never stored in plain text
3. After logging in, a secure session keeps users signed in for 30 days
4. Different users have different permission levels (clinician vs admin)
5. Admins can manage user accounts and access additional settings

## User Stories

### Account Management
- [ ] As a clinician, I can create a new account with my email and password
- [ ] As a clinician, I can log in to my account securely
- [ ] As a clinician, I can reset my password if I forget it
- [ ] As a clinician, I can stay logged in across browser sessions

### Access Control  
- [ ] As an admin, I can view and manage all user accounts
- [ ] As an admin, I can access the admin dashboard for system settings
- [ ] As a clinician, I can only access features appropriate for my role
- [ ] As a user, I am automatically logged out after extended inactivity for security

### Session Security
- [ ] As a clinician, my session is securely stored and encrypted
- [ ] As a clinician, I can log out from my account
- [ ] As a user, failed login attempts are tracked and logged for security
`
  },
  {
    title: "Feature: Content Library",
    labels: ["feature", "completed", "content"],
    body: `## Overview
A curated collection of evidence-based educational content focused on pain science and biopsychosocial education. Content is organized by topics (tags) and can be searched, filtered, and previewed by clinicians.

## How It Works
1. Browse the library to see all available educational modules
2. Filter content by topic tags (e.g., "Pain Science", "Movement", "Sleep")
3. Search for specific content by title or keywords
4. Preview any content item to see the full educational material
5. Content is managed through Contentful CMS with automatic fallback to local database

## User Stories

### Browsing & Discovery
- [ ] As a clinician, I can browse all available educational content
- [ ] As a clinician, I can filter content by topic tags
- [ ] As a clinician, I can search for content by title or keywords
- [ ] As a clinician, I can see estimated read time for each content item

### Content Preview
- [ ] As a clinician, I can preview the full content of any educational module
- [ ] As a clinician, I can see related tags for each content item
- [ ] As a clinician, I can see a summary before viewing full content

### Content Management (Admin)
- [ ] As an admin, I can add new content items to the library
- [ ] As an admin, I can edit existing content
- [ ] As an admin, I can manage content tags and categories
`
  },
  {
    title: "Feature: Content Concierge (Intelligent Curation)",
    labels: ["feature", "completed", "concierge", "core-differentiator"],
    body: `## Overview
The Content Concierge is DriverPath's key differentiator — an intelligent system that matches clinicians with the most relevant educational content based on their clinical assessments. Instead of manually searching through content, answers to clinical questions automatically surface personalized recommendations.

## How It Works
1. **Answer**: Clinician selects and completes a clinical assessment
2. **Match**: The system analyzes responses and calculates relevance scores for each topic
3. **Recommend**: Content is automatically matched based on elevated topic scores
4. **Deliver**: Clinician reviews matches and creates a downloadable content packet

Each recommended content item shows:
- Match score (green 80%+, amber 50-79%, gray below 50%)
- The topic tag that triggered the match
- Why this content was recommended (rationale)

## User Stories

### Assessment-Driven Flow
- [ ] As a clinician, I can start the Content Concierge workflow from the dashboard
- [ ] As a clinician, I can select from available clinical assessments
- [ ] As a clinician, I can complete the assessment with my patient's information
- [ ] As a clinician, I can see my responses scored by topic areas

### Intelligent Matching
- [ ] As a clinician, I receive personalized content recommendations based on my answers
- [ ] As a clinician, I can see match scores showing how relevant each content item is
- [ ] As a clinician, I can understand why content was recommended (rationale display)
- [ ] As a clinician, I can see which topic tags triggered each recommendation

### Curation Control
- [ ] As a clinician, I can select which recommended content to include
- [ ] As a clinician, I can add additional content beyond recommendations
- [ ] As a clinician, I can proceed to create a content packet with my selections
`
  },
  {
    title: "Feature: Assessment Builder",
    labels: ["feature", "completed", "assessments"],
    body: `## Overview
A visual tool for creating clinical assessments that power the Content Concierge. Clinicians can build custom questionnaires with various question types, scoring logic, and branching paths.

## How It Works
1. Use the drag-and-drop builder to create assessments
2. Add different question types (multiple choice, rating scales, text, etc.)
3. Configure scoring to map answers to topic tags
4. Preview how the assessment looks before publishing
5. Publish to make the assessment available in the Content Concierge

## User Stories

### Assessment Creation
- [ ] As a clinician, I can create new assessments using a visual builder
- [ ] As a clinician, I can add multiple question types (choice, rating, text, boolean)
- [ ] As a clinician, I can organize questions into pages/sections
- [ ] As a clinician, I can add conditional logic for question branching

### Scoring Configuration
- [ ] As a clinician, I can map answers to topic tags for scoring
- [ ] As a clinician, I can set custom weights for different answers
- [ ] As a clinician, I can preview how scoring would work with sample answers

### Assessment Management
- [ ] As a clinician, I can save assessments as drafts
- [ ] As a clinician, I can preview how assessments look before publishing
- [ ] As a clinician, I can publish assessments to make them available
- [ ] As a clinician, I can edit existing assessments
- [ ] As a clinician, I can view all my created assessments
`
  },
  {
    title: "Feature: Content Packets",
    labels: ["feature", "completed", "packets"],
    body: `## Overview
Downloadable or printable bundles of curated educational content. Content packets are the output of the Content Concierge workflow, providing clinicians with ready-to-use patient handouts.

## How It Works
1. Complete the Content Concierge workflow to select content
2. Add an optional patient name for personalization
3. Preview the packet with DriverPath branding
4. Download as PDF or print directly
5. Packet history is saved for future reference

## User Stories

### Packet Creation
- [ ] As a clinician, I can create a content packet from selected content items
- [ ] As a clinician, I can add a patient name to personalize the packet
- [ ] As a clinician, I can preview the packet before downloading/printing

### Packet Output
- [ ] As a clinician, I can download the packet as a PDF
- [ ] As a clinician, I can print the packet directly
- [ ] As a clinician, I can see professional branding on the packet
- [ ] As a clinician, I can see content organized with clear numbering

### Packet History
- [ ] As a clinician, I can view my past packet history
- [ ] As a clinician, I can see which content was included in each packet
- [ ] As a clinician, I can see the assessment responses that generated recommendations
`
  },
  {
    title: "Feature: Recommendation Engine",
    labels: ["feature", "completed", "recommendations"],
    body: `## Overview
The backend system that powers Content Concierge matching. Uses a three-tier approach to generate content recommendations: clinician-defined rules, care pathway context, and tag-based matching.

## How It Works
1. **Clinician Rules (Highest Priority)**: Custom rules that link specific tag/score combinations to content
2. **Pathway Context (Medium Priority)**: Content from the current milestone when patient is in a care pathway
3. **Tag-Based Fallback (Baseline)**: Matches elevated assessment tags to content with matching tags

Each recommendation includes:
- Content item details
- Match score based on assessment results
- Source of the recommendation (rule, pathway, or tag match)
- Rationale explaining why it was recommended

## User Stories

### Rule Management
- [ ] As a clinician, I can create recommendation rules linking tags to content
- [ ] As a clinician, I can set score thresholds for when rules trigger
- [ ] As a clinician, I can prioritize rules to control which content appears first
- [ ] As a clinician, I can scope rules to specific assessments

### Recommendation Preview
- [ ] As a clinician, I can preview what recommendations would be generated for test scores
- [ ] As a clinician, I can see which rule or logic generated each recommendation
- [ ] As a clinician, I can understand the rationale for each recommended item

### Rule Testing
- [ ] As a clinician, I can test my rules with sample tag scores
- [ ] As a clinician, I can verify rules work before using them in production
`
  },
  {
    title: "Feature: Dashboard & Analytics",
    labels: ["feature", "completed", "dashboard"],
    body: `## Overview
The main landing page after login, providing an overview of activity and quick access to key features. The dashboard adapts based on enabled features and subscription status.

## How It Works
1. See summary statistics for content library, packets created, and top topics
2. Access quick actions based on enabled features (Create Packet, Browse Library)
3. View the Content Concierge hero card in MVP mode (when patient messaging is disabled)
4. Dashboard shows different stats based on feature flag configuration

## User Stories

### Statistics Overview
- [ ] As a clinician, I can see how many packets I've created this week
- [ ] As a clinician, I can see my total packets created over time
- [ ] As a clinician, I can see the size of the content library
- [ ] As a clinician, I can see my most common topic/focus area

### Quick Actions
- [ ] As a clinician, I can quickly start creating a content packet from the dashboard
- [ ] As a clinician, I can access the content library from the dashboard
- [ ] As a clinician, I can see the Content Concierge hero card with value messaging

### Adaptive Display
- [ ] As a clinician, I see relevant stats based on my enabled features
- [ ] As a clinician, the dashboard adapts when patient messaging is enabled/disabled
`
  },
  {
    title: "Feature: History & Tracking",
    labels: ["feature", "completed", "history"],
    body: `## Overview
View past activities including content packets created and (when enabled) emails sent to patients. The history page provides visibility into all clinician actions.

## How It Works
1. Access History from the sidebar navigation
2. Switch between tabs: Packet History (internal screenings) and Send History (email logs)
3. View details of each past activity including assessment responses and recommended content
4. Tabs are conditionally shown based on feature flags

## User Stories

### Packet History
- [ ] As a clinician, I can view all my past content packets
- [ ] As a clinician, I can see the assessment responses for each packet
- [ ] As a clinician, I can see which content was recommended and selected
- [ ] As a clinician, I can see when each packet was created

### Send History (when email enabled)
- [ ] As a clinician, I can view emails I've sent to patients
- [ ] As a clinician, I can see the status of sent emails
- [ ] As a clinician, I can see which content was included in each email

### Navigation
- [ ] As a clinician, I can switch between history tabs easily
- [ ] As a clinician, I only see tabs for features that are enabled
`
  },
  {
    title: "Feature: Feature Flags System",
    labels: ["feature", "completed", "feature-flags", "admin"],
    body: `## Overview
A system-wide toggle system that controls which features are available. Enables MVP mode where patient-facing features are disabled, allowing clinicians to use DriverPath for personal content curation without handling patient data.

## How It Works
1. Admins can enable/disable features through the admin panel
2. Frontend components adapt based on flag states
3. Backend APIs return 404 when accessing disabled features
4. Flags are loaded on app startup and cached for performance

## Key Flags (MVP Mode)
- **patient_portal_enabled**: Patient login and content access
- **patient_messaging_enabled**: Sending content via email
- **patient_assessments_enabled**: Patient-facing assessment invites
- **content_delivery_mode**: Email delivery vs downloadable packets only
- **assessments_enabled**: Clinician assessment features

## User Stories

### Admin Control
- [ ] As an admin, I can view all feature flags and their current status
- [ ] As an admin, I can enable or disable features
- [ ] As an admin, I can see feature flag changes logged in audit trail

### Frontend Adaptation
- [ ] As a clinician, I only see navigation items for enabled features
- [ ] As a clinician, the dashboard adapts based on enabled features
- [ ] As a clinician, I receive clear feedback when accessing disabled features

### MVP Mode
- [ ] As a clinician, I can use DriverPath without patient data when in MVP mode
- [ ] As a clinician, the Content Concierge works for personal curation in MVP mode
`
  },
  {
    title: "Feature: HIPAA Compliance",
    labels: ["feature", "completed", "security", "compliance"],
    body: `## Overview
Comprehensive security and compliance features to protect patient health information (PHI). Includes audit logging, role-based access control, data classification, and secure authentication.

## How It Works
1. **Audit Logging**: Every significant action is logged with who, what, when, and outcome
2. **Role-Based Access**: Users have roles (clinician, admin) with specific permissions
3. **Data Inventory**: All data assets are classified (PHI, PII, Sensitive, Internal, Public)
4. **Access Code Security**: Patient access codes are hashed with strong encryption

## User Stories

### Audit Trail
- [ ] As an admin, I can view the complete audit log of system actions
- [ ] As an admin, I can see who accessed what data and when
- [ ] As an admin, I can filter audit logs by action type, user, or date
- [ ] As an admin, login attempts and failures are tracked

### Access Control
- [ ] As an admin, I can see user permissions and roles
- [ ] As a clinician, I cannot access admin-only features
- [ ] As any user, I receive appropriate error messages for unauthorized actions

### Data Protection
- [ ] As an admin, I can view the data inventory and classifications
- [ ] As an admin, I can see retention policies for different data types
- [ ] As a patient, my access codes are securely hashed (not stored in plain text)
- [ ] As a patient, my session is scoped only to content sent to me

### Security Features
- [ ] As a user, my password is securely encrypted
- [ ] As a user, my session uses secure, HttpOnly cookies
- [ ] As a patient, failed login attempts trigger lockout protection
`
  }
];

async function ensureLabelsExist(octokit: any) {
  console.log('Checking and creating labels...');
  
  const labelsToCreate = [
    { name: 'feature', color: '1d76db', description: 'Feature area' },
    { name: 'completed', color: '0e8a16', description: 'Completed implementation' },
    { name: 'authentication', color: 'd93f0b', description: 'Authentication related' },
    { name: 'content', color: 'f9d0c4', description: 'Content library related' },
    { name: 'concierge', color: 'fef2c0', description: 'Content Concierge feature' },
    { name: 'core-differentiator', color: 'b60205', description: 'Core product differentiator' },
    { name: 'assessments', color: 'c5def5', description: 'Assessment related' },
    { name: 'packets', color: 'd4c5f9', description: 'Content packets' },
    { name: 'recommendations', color: 'bfdadc', description: 'Recommendation engine' },
    { name: 'dashboard', color: 'fbca04', description: 'Dashboard related' },
    { name: 'history', color: 'e6e6e6', description: 'History and tracking' },
    { name: 'feature-flags', color: '5319e7', description: 'Feature flags system' },
    { name: 'admin', color: 'b4a7d6', description: 'Admin functionality' },
    { name: 'security', color: 'd93f0b', description: 'Security related' },
    { name: 'compliance', color: 'c2e0c6', description: 'Compliance related' },
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

async function createIssues() {
  console.log('Starting GitHub issue creation...\n');
  
  if (!OWNER || !REPO) {
    console.error('Error: GITHUB_OWNER and GITHUB_REPO environment variables must be set');
    console.log('Usage: GITHUB_OWNER=owner GITHUB_REPO=repo npx tsx scripts/create-github-issues.ts');
    process.exit(1);
  }

  console.log(`Repository: ${OWNER}/${REPO}\n`);

  try {
    const octokit = await getUncachableGitHubClient();
    
    await ensureLabelsExist(octokit);
    
    console.log('\nCreating feature issues...');
    
    for (const feature of features) {
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
    
    console.log('\nDone! All feature issues have been created.');
  } catch (error: any) {
    console.error('Error connecting to GitHub:', error.message);
    process.exit(1);
  }
}

createIssues();
