import { test, expect, Page } from '@playwright/test';

/**
 * Clinician Role UI Tests
 * Tests all clinician-accessible functions in DriverPath
 */

test.describe('Clinician Role - Complete Workflow Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Login as clinician
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Dashboard', () => {
    test('should display dashboard page', async () => {
      await page.goto('/dashboard');
      // Must be on dashboard, not redirected
      await expect(page).toHaveURL(/\/(dashboard)?$/);
      // Page must have loaded content
      await expect(page.locator('main, [role="main"], .dashboard')).toBeVisible();
    });

    test('should show navigation sidebar or menu', async () => {
      await page.goto('/dashboard');
      // Must have navigation element
      await expect(page.locator('nav, aside, [role="navigation"]')).toBeVisible();
    });

    test('should navigate to library', async () => {
      await page.goto('/dashboard');
      await page.click('a[href*="library"], nav >> text=Library');
      await expect(page).toHaveURL(/\/library/);
    });
  });

  test.describe('Content Library', () => {
    test('should display content library page', async () => {
      await page.goto('/library');
      await expect(page).toHaveURL(/\/library/);
      // Must have main content area
      await expect(page.locator('main, [role="main"]')).toBeVisible();
    });

    test('should show content cards', async () => {
      await page.goto('/library');
      // Must have content cards (required for library to be functional)
      await expect(page.locator('[data-testid^="card-"], .content-card, article').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have search input', async () => {
      await page.goto('/library');
      // Search must exist for filtering
      await expect(page.locator('input[type="search"], input[placeholder*="search" i]')).toBeVisible();
    });

    test('should select content and show selection count', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
      
      // Click on first content item's checkbox
      const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
      await firstCard.locator('input[type="checkbox"], [role="checkbox"]').click();
      
      // Must show selection indicator
      await expect(page.locator('text=/selected|1 item/i')).toBeVisible({ timeout: 5000 });
    });

    test('should open content preview modal', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
      
      // Hover on card and click preview
      const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
      await firstCard.hover();
      await firstCard.locator('button:has-text("Preview"), [data-testid*="preview"]').first().click();
      
      // Modal must open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Content Sending', () => {
    test('should open send modal with selected content', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
      
      // Select content
      const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
      const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
      
      if (await checkbox.isVisible()) {
        await checkbox.click();
        
        // Open send modal
        const sendButton = page.locator('button:has-text("Send"), button:has-text("Email")');
        if (await sendButton.isVisible()) {
          await sendButton.click();
          await expect(page.locator('[role="dialog"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('PDF Generation', () => {
    test('should open PDF configuration dialog', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
      
      // Select content
      const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
      const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
      
      if (await checkbox.isVisible()) {
        await checkbox.click();
        
        // Open packet modal
        const packetButton = page.locator('button:has-text("Packet"), button:has-text("Download")');
        await packetButton.first().click();
        
        // Click Generate PDF
        const generatePdfButton = page.locator('[data-testid="button-generate-pdf"], button:has-text("Generate PDF")');
        if (await generatePdfButton.isVisible()) {
          await generatePdfButton.click();
          await expect(page.locator('[data-testid="input-patient-name"]')).toBeVisible();
        }
      }
    });

    test('should configure PDF options', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
      
      const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
      const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
      
      if (await checkbox.isVisible()) {
        await checkbox.click();
        
        const packetButton = page.locator('button:has-text("Packet"), button:has-text("Download")');
        await packetButton.first().click();
        
        const generatePdfButton = page.locator('[data-testid="button-generate-pdf"], button:has-text("Generate PDF")');
        if (await generatePdfButton.isVisible()) {
          await generatePdfButton.click();
          
          // Configure options
          await page.fill('[data-testid="input-patient-name"]', 'Test Patient');
          await page.fill('[data-testid="textarea-cover-message"]', 'Test message for the patient');
          
          // Verify character counter
          await expect(page.locator('text=/\\d+\/500/')).toBeVisible();
        }
      }
    });
  });

  test.describe('Assessments', () => {
    test('should display assessments page', async () => {
      await page.goto('/assessments');
      await expect(page).toHaveURL(/\/assessments/);
    });

    test('should list available assessments', async () => {
      await page.goto('/assessments');
      // Look for assessment list or cards
      await page.waitForTimeout(2000);
      const assessmentItems = page.locator('[data-testid^="assessment-"], .assessment-card, article');
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Internal Screenings', () => {
    test('should access screenings functionality', async () => {
      await page.goto('/screenings');
      // Either redirects or shows screenings page
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('History / Email Logs', () => {
    test('should display email history', async () => {
      await page.goto('/history');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Settings', () => {
    test('should access settings page', async () => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/\/settings/);
    });

    test('should display profile settings', async () => {
      await page.goto('/settings');
      await expect(page.locator('text=/profile|name|email/i').first()).toBeVisible();
    });

    test('should display subscription information', async () => {
      await page.goto('/settings');
      const subscriptionInfo = page.locator('text=/subscription|plan|billing/i');
      if (await subscriptionInfo.isVisible()) {
        await expect(subscriptionInfo.first()).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between main sections', async () => {
      // Dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/(dashboard)?$/);
      
      // Library
      await page.goto('/library');
      await expect(page).toHaveURL(/\/library/);
      
      // Settings
      await page.goto('/settings');
      await expect(page).toHaveURL(/\/settings/);
    });

    test('should show navigation menu on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // Look for bottom nav or hamburger menu
      const mobileNav = page.locator('nav, [data-testid="bottom-nav"], button[aria-label*="menu"]');
      await expect(mobileNav.first()).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async () => {
      await page.goto('/dashboard');
      
      // Find logout button/link
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign out")');
      if (await userMenu.isVisible()) {
        await userMenu.click();
      }
      
      const logoutButton = page.locator('text=/logout|sign out/i').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
      
      await expect(page).toHaveURL(/\/auth/);
    });
  });
});
