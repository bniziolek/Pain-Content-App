import { getUncachableGitHubClient } from '../server/github';

interface FeatureIssue {
  title: string;
  body: string;
  labels: string[];
}

const OWNER = 'bniziolek';
const REPO = 'Pain-Content-App';

const enhancementFeatures: FeatureIssue[] = [
  {
    title: "Feature: Tiered Subscription System (Basic/Pro)",
    labels: ["feature", "planned", "subscriptions", "monetization", "priority-high"],
    body: `## Overview
A tiered subscription system that controls access to features based on the user's plan level. Users can subscribe to Basic or Pro tiers, with the ability to add more tiers in the future. Feature access is gated by both global feature flags AND subscription tier entitlements.

## How It Works
1. User signs up and is placed on a free trial or Basic tier
2. Stripe manages subscription billing and tier status
3. Each feature flag includes tier requirements (which tiers can access it)
4. Server-side checks verify both flag status AND tier before granting access
5. Users can upgrade/downgrade through the subscription page
6. Admins can manually adjust tiers for special cases

## Tier Entitlement Matrix

| Feature | Basic | Pro |
|---------|-------|-----|
| Content Library | ✓ | ✓ |
| Content Concierge | ✓ | ✓ |
| Assessment Builder | Limited (5) | Unlimited |
| Content Packets | ✓ | ✓ |
| Patient Portal | — | ✓ |
| Email Delivery | — | ✓ |
| Care Pathways | — | ✓ |
| Follow-up Automation | — | ✓ |
| Priority Support | — | ✓ |

## Technical Approach
- Add \`subscriptionTier\` field to users table (e.g., "free", "basic", "pro", "enterprise")
- Extend feature_flags table with \`tiersAllowed\` JSON field
- Create middleware to check tier entitlements alongside feature flags
- Integrate with Stripe products/prices to map to tiers

## User Stories

### Subscription Management
- [ ] As a user, I can see my current subscription tier
- [ ] As a user, I can upgrade from Basic to Pro
- [ ] As a user, I can downgrade from Pro to Basic
- [ ] As a user, I receive clear messaging about what features each tier includes

### Tier-Based Access
- [ ] As a Basic user, I can access features included in my tier
- [ ] As a Basic user, I see upgrade prompts when accessing Pro-only features
- [ ] As a Pro user, I can access all features in my tier
- [ ] As a user, I see a clear indicator of my current tier

### Billing Integration
- [ ] As a user, I can manage my payment method
- [ ] As a user, I can view my billing history
- [ ] As a user, I receive notifications before my subscription renews
- [ ] As a user, I can cancel my subscription with clear offboarding

### Admin Management
- [ ] As an admin, I can view users by subscription tier
- [ ] As an admin, I can manually upgrade/downgrade a user's tier
- [ ] As an admin, I can extend trial periods for users
- [ ] As an admin, I can apply discounts or credits
`
  },
  {
    title: "Feature: Admin Permissions & Super Admin Role",
    labels: ["feature", "planned", "admin", "security", "rbac"],
    body: `## Overview
Enhanced role-based access control with granular permissions for admin users and a Super Admin role with full system access. Super Admins can switch between admin and clinician personas to test the user experience.

## How It Works
1. Regular admins have specific permissions assigned (e.g., can manage users but not billing)
2. Super Admins have all permissions automatically, including meta-admin functions
3. Super Admins can "switch persona" to view the app as a regular clinician
4. All admin actions and persona switches are audit-logged for compliance
5. Permissions are checked at both route and UI level

## Role Hierarchy
- **Clinician**: Standard user role with patient-facing features
- **Admin**: Management role with configurable permissions
- **Super Admin**: Full access to all features plus meta-admin capabilities

## Admin Permission Categories
- **User Management**: View users, reset passwords, manage accounts
- **Billing Management**: View/modify subscriptions, apply credits
- **Content Management**: Manage content library, create system templates
- **System Settings**: Manage feature flags, system configuration
- **Audit Access**: View audit logs, export compliance reports
- **Support**: View user sessions, impersonate for troubleshooting

## User Stories

### Granular Permissions
- [ ] As a super admin, I can assign specific permissions to admin users
- [ ] As a super admin, I can create permission groups (e.g., "Support Admin", "Billing Admin")
- [ ] As an admin, I only see menu items for features I have permission to access
- [ ] As an admin, I receive clear errors when attempting unauthorized actions

### Super Admin Capabilities
- [ ] As a super admin, I have access to all admin functions
- [ ] As a super admin, I can access meta-admin settings (manage other admins)
- [ ] As a super admin, I can view the complete system audit trail
- [ ] As a super admin, I can manage feature flags for all tiers

### Persona Switching
- [ ] As a super admin, I can switch to "clinician view" to see the app as a regular user
- [ ] As a super admin, my persona switch is logged in the audit trail
- [ ] As a super admin, I see a clear indicator when viewing as a different persona
- [ ] As a super admin, I can easily switch back to admin view

### Audit & Compliance
- [ ] As a super admin, all my actions are logged with full context
- [ ] As a super admin, I can see who made changes and when
- [ ] As an auditor, I can verify admin actions through the audit trail
`
  },
  {
    title: "Feature: Admin Dashboard & User Management",
    labels: ["feature", "planned", "admin", "dashboard", "user-management"],
    body: `## Overview
A comprehensive admin dashboard for managing users, viewing activity, and performing administrative actions. Provides visibility into user behavior, subscription status, and enables quick actions like password resets and account upgrades.

## How It Works
1. Admins access the admin dashboard from the main navigation
2. Dashboard shows overview stats (active users, subscriptions, activity)
3. User management section allows searching, filtering, and managing individual users
4. Each user record shows detailed activity, subscription, and login history
5. Quick actions allow common tasks without navigating away

## Dashboard Sections

### Overview
- Active users (daily/weekly/monthly)
- Subscription breakdown by tier
- Recent signups and churns
- System health indicators

### User Management
- Searchable user directory
- Filter by tier, status, activity level
- Individual user profiles with full history

### Activity Monitoring
- Recent logins and sessions
- Content access patterns
- Assessment completions

## User Stories

### Dashboard Overview
- [ ] As an admin, I can see key metrics on the dashboard home
- [ ] As an admin, I can see active user counts and trends
- [ ] As an admin, I can see subscription tier distribution
- [ ] As an admin, I can see recent signups and activity

### User Directory
- [ ] As an admin, I can search for users by name or email
- [ ] As an admin, I can filter users by subscription tier
- [ ] As an admin, I can filter users by activity status (active, inactive, churned)
- [ ] As an admin, I can sort users by various criteria

### Individual User Management
- [ ] As an admin, I can view a user's complete profile
- [ ] As an admin, I can see a user's login history
- [ ] As an admin, I can see a user's billing/subscription history
- [ ] As an admin, I can see a user's content activity

### Admin Actions
- [ ] As an admin, I can reset a user's password
- [ ] As an admin, I can upgrade/downgrade a user's tier
- [ ] As an admin, I can extend a user's trial period
- [ ] As an admin, I can deactivate or reactivate a user account
- [ ] As an admin, I can add notes to a user's record
- [ ] As an admin, I can export user data for compliance requests
`
  },
  {
    title: "Feature: User Insights & Feedback (PostHog Integration)",
    labels: ["feature", "planned", "analytics", "feedback", "posthog"],
    body: `## Overview
Comprehensive user behavior tracking and feedback collection using PostHog. Track clicks, page views, and session activity while also collecting explicit feedback through surveys, ratings, and contextual prompts. Works on any page, button, or feature.

## Recommended Service: PostHog
- **Why PostHog**: Free tier (1M events/month), autocapture, surveys, feature flags, self-hostable for HIPAA
- **HIPAA Compliance**: Configure PII redaction or self-host for full control

## How It Works
1. PostHog snippet is added to the app for autocapture
2. Custom events track specific interactions (button clicks, feature usage)
3. Feedback widgets can be placed on any page/component
4. Surveys trigger based on user behavior or manually
5. Data feeds into dashboards for analysis

## Tracking Capabilities

### Automatic Tracking
- Page views and navigation paths
- Click events on interactive elements
- Session duration and engagement
- User flows and funnels

### Custom Events
- Feature usage (assessments started, packets created)
- Upgrade prompts viewed/clicked
- Error encounters
- Search queries

### Feedback Collection
- Thumbs up/down on content and features
- "Was this helpful?" prompts
- NPS surveys (periodic)
- Feature-specific feedback forms
- Exit surveys on cancellation

## User Stories

### Behavior Tracking
- [ ] As a product owner, I can see which features are most used
- [ ] As a product owner, I can identify drop-off points in user flows
- [ ] As a product owner, I can see how long users spend on each page
- [ ] As a product owner, I can track conversion funnels (trial → paid)

### Feedback Widgets
- [ ] As a user, I can give thumbs up/down feedback on content
- [ ] As a user, I can rate my experience after completing key actions
- [ ] As a user, I can submit written feedback when prompted
- [ ] As a user, feedback prompts are unobtrusive and easy to dismiss

### Surveys
- [ ] As a product owner, I can create and deploy in-app surveys
- [ ] As a product owner, I can target surveys to specific user segments
- [ ] As a product owner, I can trigger surveys based on behavior
- [ ] As a user, I only see relevant surveys at appropriate times

### Dashboards & Analysis
- [ ] As a product owner, I can view engagement dashboards
- [ ] As a product owner, I can segment analytics by tier, role, or behavior
- [ ] As a product owner, I can export data for deeper analysis
- [ ] As a product owner, I can set up alerts for key metrics

### Privacy & Compliance
- [ ] As a user, my PHI is never captured in analytics
- [ ] As an admin, I can configure what data is collected
- [ ] As an admin, I can view and manage consent preferences
`
  },
  {
    title: "Feature: External Helpdesk Integration (Freshdesk)",
    labels: ["feature", "planned", "support", "helpdesk", "freshdesk"],
    body: `## Overview
Integration with Freshdesk (free tier) for external ticket management. Users can submit support tickets, feedback, and bug reports through a support portal. External support agents manage tickets without accessing the main application.

## Recommended Service: Freshdesk Free
- **Why Freshdesk**: Free tier for up to 10 agents, email ticketing, knowledge base
- **HIPAA Note**: Remind users not to include PHI in tickets; use secure in-app messaging for sensitive issues

## How It Works
1. "Support" link in the app opens Freshdesk portal (external)
2. Users submit tickets via web form or email
3. Support agents triage and respond in Freshdesk
4. Users receive email notifications for ticket updates
5. Knowledge base provides self-service answers

## Integration Points

### App Integration
- Support link in sidebar/footer opens Freshdesk portal
- Pre-fill user email if logged in
- Contextual links (e.g., "Report issue with this feature")

### Ticket Categories
- Bug reports
- Feature requests
- Billing questions
- General feedback
- Account issues

### Self-Service
- Knowledge base with FAQs
- Video tutorials and guides
- Searchable help articles

## User Stories

### Submitting Tickets
- [ ] As a user, I can access support from within the app
- [ ] As a user, I can submit a support ticket with details about my issue
- [ ] As a user, I can attach screenshots or files to my ticket
- [ ] As a user, I receive confirmation when my ticket is submitted

### Ticket Management (Agents)
- [ ] As a support agent, I can view and triage incoming tickets
- [ ] As a support agent, I can respond to tickets via Freshdesk
- [ ] As a support agent, I can escalate tickets to engineering
- [ ] As a support agent, I can track ticket resolution times

### Communication
- [ ] As a user, I receive email notifications when my ticket is updated
- [ ] As a user, I can reply to ticket updates via email
- [ ] As a user, I can view my ticket history in the portal
- [ ] As a user, I can rate my support experience after resolution

### Self-Service
- [ ] As a user, I can search the knowledge base for answers
- [ ] As a user, I can browse FAQs by category
- [ ] As a user, I am prompted with relevant articles before submitting a ticket

### HIPAA Considerations
- [ ] As a user, I see a reminder not to include patient information in tickets
- [ ] As a user, I am directed to secure in-app channels for sensitive issues
- [ ] As an admin, support tickets are stored externally, not in the main database
`
  },
  {
    title: "Feature: Analytics & Reporting Infrastructure",
    labels: ["feature", "planned", "analytics", "reporting", "data"],
    body: `## Overview
In-depth analytics and reporting capabilities for understanding user behavior, business metrics, and clinical outcomes. Starts with transactional database storage and can evolve to a data warehouse as scale demands.

## Recommended Approach: Start Simple, Scale Later

### Phase 1: Transactional Database (Now)
- Store events in PostgreSQL analytics_events table
- Use materialized views for common report queries
- Build admin dashboards from existing data

### Phase 2: Data Warehouse (When Needed)
- Trigger: Event volume >10M/month OR complex BI needs
- Options: BigQuery, Snowflake, or Redshift
- Ensure BAA (Business Associate Agreement) for HIPAA
- Schedule nightly exports from transactional DB

## Analytics Categories

### User Analytics
- Active users (DAU, WAU, MAU)
- User acquisition and churn rates
- Feature adoption by cohort
- Time to value (first packet created, first assessment)

### Engagement Analytics
- Session duration and frequency
- Feature usage patterns
- Content popularity and ratings
- Assessment completion rates

### Business Analytics
- Revenue by tier and cohort
- Trial conversion rates
- Upgrade/downgrade patterns
- Churn prediction indicators

### Clinical Analytics (Aggregate, De-identified)
- Assessment score distributions
- Most recommended content
- Pathway completion rates
- Outcome trends (if tracked)

## User Stories

### Admin Dashboards
- [ ] As an admin, I can view key business metrics on a dashboard
- [ ] As an admin, I can see user growth and churn trends
- [ ] As an admin, I can see revenue and subscription metrics
- [ ] As an admin, I can filter analytics by date range

### Reports
- [ ] As an admin, I can generate user activity reports
- [ ] As an admin, I can export reports as CSV or PDF
- [ ] As an admin, I can schedule recurring reports
- [ ] As an admin, I can share reports with stakeholders

### Self-Service Analytics
- [ ] As a clinician, I can see my own activity summary
- [ ] As a clinician, I can see trends in my content usage
- [ ] As a clinician, I can compare my usage to benchmarks

### Data Management
- [ ] As an admin, I can configure data retention policies
- [ ] As an admin, I can manage what data is collected
- [ ] As an admin, I can export raw data for external analysis
- [ ] As a developer, analytics queries don't slow down the main app

### Compliance
- [ ] As an admin, analytics data is de-identified where required
- [ ] As an admin, I can audit who accessed analytics data
- [ ] As an admin, analytics infrastructure meets HIPAA requirements
`
  }
];

async function ensureLabelsExist(octokit: any) {
  console.log('Checking and creating labels...');
  
  const labelsToCreate = [
    { name: 'subscriptions', color: '0e8a16', description: 'Subscription/billing related' },
    { name: 'monetization', color: 'fbca04', description: 'Revenue and monetization' },
    { name: 'priority-high', color: 'b60205', description: 'High priority' },
    { name: 'rbac', color: 'd93f0b', description: 'Role-based access control' },
    { name: 'user-management', color: '1d76db', description: 'User management features' },
    { name: 'posthog', color: 'f9d0c4', description: 'PostHog integration' },
    { name: 'support', color: 'c5def5', description: 'Support features' },
    { name: 'helpdesk', color: 'bfdadc', description: 'Helpdesk integration' },
    { name: 'freshdesk', color: '5319e7', description: 'Freshdesk integration' },
    { name: 'reporting', color: 'd4c5f9', description: 'Reporting features' },
    { name: 'data', color: 'e99695', description: 'Data infrastructure' },
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

async function createEnhancementIssues() {
  console.log('Starting GitHub issue creation for enhancements...\n');
  console.log(`Repository: ${OWNER}/${REPO}\n`);

  try {
    const octokit = await getUncachableGitHubClient();
    
    await ensureLabelsExist(octokit);
    
    console.log('\nCreating enhancement feature issues...');
    
    for (const feature of enhancementFeatures) {
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
    
    console.log('\nDone! All enhancement feature issues have been created.');
  } catch (error: any) {
    console.error('Error connecting to GitHub:', error.message);
    process.exit(1);
  }
}

createEnhancementIssues();
