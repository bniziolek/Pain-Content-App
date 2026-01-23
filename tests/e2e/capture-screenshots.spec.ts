import { test, expect } from '@playwright/test';
import { seedDatabase } from '../../server/seed';
import { storage } from '../../server/storage';

const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
const adminEmail = 'admin@driverpath.com';
const adminPassword = 'admin123';
const patientEmail = 'patient@example.com';

const screenshotDir = 'docs/assets/screenshots';

const featureFlagsToEnable = [
  'content_delivery_mode',
  'patient_messaging_enabled',
  'send_history_enabled',
  'patient_portal_enabled',
  'patient_assessments_enabled',
  'follow_ups_enabled',
];

async function ensureFeatureFlags() {
  for (const key of featureFlagsToEnable) {
    const existing = await storage.getFeatureFlagByKey(key);
    if (!existing) {
      await storage.createFeatureFlag({
        key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Auto-enabled for dev screenshots (${key}).`,
        isEnabled: true,
        value: null,
        category: 'screenshots',
      });
      continue;
    }

    if (!existing.isEnabled) {
      await storage.updateFeatureFlag(key, { isEnabled: true });
    }
  }
}

async function ensureAssessment(clinicianId: string) {
  const existing = await storage.getAssessmentsByClinicianId(clinicianId);
  if (existing.length > 0) return existing[0];

  return storage.createAssessment({
    clinicianUserId: clinicianId,
    name: 'Sample Assessment',
    description: 'Basic assessment for screenshots',
    assessmentType: 'patient',
    surveyJson: {
      title: 'Sample Assessment',
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'radiogroup',
              name: 'pain_level',
              title: 'How is your pain today?',
              choices: ['Low', 'Medium', 'High'],
            },
          ],
        },
      ],
    },
    scoringConfig: {},
    outcomeRules: {},
    isTemplate: false,
    isPublished: true,
  });
}

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${baseUrl}/auth`);
  await page.getByTestId('input-email').fill(adminEmail);
  await page.getByTestId('input-password').fill(adminPassword);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
}

test.describe.serial('capture screenshots (dev)', () => {
  test.beforeAll(async () => {
    await seedDatabase();
    await ensureFeatureFlags();

    const admin = await storage.getUserByEmail(adminEmail);
    if (!admin) {
      throw new Error('Admin user not found after seeding.');
    }

    const assessment = await ensureAssessment(admin.id);

    const invites = await storage.getAssessmentInvitesByClinicianId(admin.id);
    if (invites.length === 0) {
      await storage.createAssessmentInvite({
        clinicianUserId: admin.id,
        assessmentId: assessment.id,
        patientEmail,
        status: 'sent',
      });
    }
  });

  test('capture UI screenshots', async ({ page }) => {
    await login(page);

    const contentRes = await page.request.get(`${baseUrl}/api/content`);
    const contentItems = await contentRes.json();
    const firstContentId = Array.isArray(contentItems) ? contentItems[0]?.id : null;

    const usersRes = await page.request.get(`${baseUrl}/api/admin/users`);
    const usersData = await usersRes.json();
    const firstUserId = Array.isArray(usersData) ? usersData[0]?.id : null;

    let accessCode: string | null = null;
    if (firstContentId) {
      const sendRes = await page.request.post(`${baseUrl}/api/email-logs`, {
        data: {
          patientEmail,
          subject: 'Your educational materials',
          contentIds: [firstContentId],
          providerNote: 'Please review these materials.',
          type: 'content_bundle',
        },
      });
      const sendData = await sendRes.json();
      accessCode = sendData?.accessCode || null;
    }

    // Dashboard
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/01-login-dashboard.png`, fullPage: true });

    // Content library list
    await page.goto(`${baseUrl}/library`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/02-content-list.png`, fullPage: true });

    // Content preview (modal)
    const firstPreviewButton = page.locator('[data-testid^="button-preview-"]').first();
    await firstPreviewButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/04-content-detail.png`, fullPage: true });
    await page.keyboard.press('Escape');

    // Send content dialog
    const firstContentCard = page.locator('[data-testid^="content-card-"]').first();
    await firstContentCard.click();
    await page.getByTestId('button-send-items').click();
    await page.getByTestId('input-patient-email').fill(patientEmail);
    await page.getByTestId('textarea-provider-note').fill('Please review these materials.');
    await page.screenshot({ path: `${screenshotDir}/05-send-dialog.png`, fullPage: true });

    // PDF preview (from send dialog)
    await page.getByTestId('button-generate-pdf-from-send').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/20-pdf-preview.png`, fullPage: true });
    await page.keyboard.press('Escape');

    // Send confirmation
    await page.getByTestId('button-send').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${screenshotDir}/06-send-success.png`, fullPage: true });

    // Email log list (history)
    await page.goto(`${baseUrl}/history`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/07-email-log-list.png`, fullPage: true });

    // Assessments list
    await page.goto(`${baseUrl}/assessments`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/08-assessment-list.png`, fullPage: true });

    // Assessment invite dialog (if needed for screenshot clarity)
    const newInviteButton = page.getByRole('button', { name: /new invite/i });
    if (await newInviteButton.count()) {
      await newInviteButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${screenshotDir}/10-assessment-invites.png`, fullPage: true });
      await page.keyboard.press('Escape');
    }

    // Assessment builder
    await page.goto(`${baseUrl}/assessments/builder`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/09-assessment-builder.png`, fullPage: true });

    // Patient portal login + content list
    await page.goto(`${baseUrl}/patient-portal`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/11-patient-portal-login.png`, fullPage: true });

    // Fetch access code from latest email log for patient portal login
    if (accessCode) {
      await page.getByTestId('input-email').fill(patientEmail);
      await page.getByTestId('input-access-code').fill(accessCode);
      await page.getByTestId('button-login').click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/12-patient-content-list.png`, fullPage: true });
    }

    // Recommendation rules
    await page.goto(`${baseUrl}/recommendation-rules`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/13-recommendations-list.png`, fullPage: true });

    // Subscription settings
    await page.goto(`${baseUrl}/settings`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/15-subscription-settings.png`, fullPage: true });

    // Admin users list
    await page.goto(`${baseUrl}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/17-admin-users.png`, fullPage: true });

    // Admin user detail
    if (firstUserId) {
      await page.goto(`${baseUrl}/admin/users/${firstUserId}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${screenshotDir}/18-admin-user-detail.png`, fullPage: true });
    }

    // Admin feature flags (audit history view)
    await page.goto(`${baseUrl}/admin/feature-flags`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/19-audit-logs.png`, fullPage: true });

    // Content packet PDF preview captured via send dialog above.
  });
});
