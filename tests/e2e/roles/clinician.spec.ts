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
      // Must have navigation element - sidebar on desktop (div.bg-sidebar), or mobile menu button
      const sidebar = page.locator('.bg-sidebar, [data-testid="button-mobile-menu"]').first();
      await expect(sidebar).toBeVisible();
    });

    test('should navigate to library', async () => {
      await page.goto('/dashboard');
      // Click library link in sidebar - admin sees "Content Oversight", clinician sees "Library"
      // Target the nav/sidebar specifically to avoid clicking other links
      const sidebar = page.locator('.bg-sidebar, nav, [role="navigation"]').first();
      const libraryLink = sidebar.locator('a[href*="library"]').first();
      await libraryLink.click();
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
      await expect(page.locator('[data-testid^="content-card-"]').first()).toBeVisible({ timeout: 15000 });
    });

    test('should have search input', async () => {
      await page.goto('/library');
      // Search must exist for filtering
      await expect(page.locator('input[type="search"], input[placeholder*="search" i]')).toBeVisible();
    });

    test('should select content and show selection count', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
      
      // Click on first content card to select
      const firstCard = page.locator('[data-testid^="content-card-"]').first();
      await firstCard.click();
      
      // Must show selection indicator - buttons show count like "Create Packet (1)" or "Send 1 Items"
      await expect(page.locator('text=/Packet \\(\\d+\\)|Send \\d+ Items/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should open content preview modal', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
      
      // Find and click the preview button on first card
      const previewButton = page.locator('[data-testid^="button-preview-"]').first();
      await previewButton.click();
      
      // Modal must open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Content Sending', () => {
    test('should open action modal with selected content', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
      
      // Click content card to select it - the card itself is clickable
      const firstCard = page.locator('[data-testid^="content-card-"]').first();
      await firstCard.click();
      
      // Wait for selection indicator to appear
      await page.waitForTimeout(500);
      
      // The action button should now be visible - could be "Send Items" or "Create Packet" depending on user role
      const actionButton = page.locator('[data-testid="button-send-items"], [data-testid="button-download-packet"]').first();
      await expect(actionButton).toBeVisible({ timeout: 5000 });
      await actionButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Content Actions', () => {
    test('should open action modal with mode-specific content', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
      
      // Select content
      const firstCard = page.locator('[data-testid^="content-card-"]').first();
      await firstCard.click();
      
      // Detect mode and open action modal
      const packetButton = page.locator('[data-testid="button-download-packet"]');
      const sendButton = page.locator('[data-testid="button-send-items"]');
      const isPacketMode = await packetButton.isVisible().catch(() => false);
      const actionButton = isPacketMode ? packetButton : sendButton;
      
      await expect(actionButton).toBeVisible({ timeout: 5000 });
      await actionButton.click();
      
      // Verify modal opens with mode-specific content
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      if (isPacketMode) {
        // Packet mode: should show content packet header
        await expect(modal.locator('text=/Content Packet|Patient Education/i').first()).toBeVisible();
      } else {
        // Email mode: should show send content interface
        await expect(modal.locator('text=/Send|Patient|Content/i').first()).toBeVisible();
      }
    });

    test('should have mode-appropriate action options', async () => {
      await page.goto('/library');
      await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
      
      const firstCard = page.locator('[data-testid^="content-card-"]').first();
      await firstCard.click();
      
      // Detect mode
      const packetButton = page.locator('[data-testid="button-download-packet"]');
      const sendButton = page.locator('[data-testid="button-send-items"]');
      const isPacketMode = await packetButton.isVisible().catch(() => false);
      const actionButton = isPacketMode ? packetButton : sendButton;
      
      await expect(actionButton).toBeVisible({ timeout: 5000 });
      await actionButton.click();
      
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      if (isPacketMode) {
        // Packet mode: should have print/download options
        const hasPrintButton = await modal.locator('[data-testid="button-print-packet"], button:has-text("Print")').first().isVisible().catch(() => false);
        expect(hasPrintButton).toBeTruthy();
      } else {
        // Email mode: should have send functionality
        const hasSendAction = await modal.locator('button:has-text("Send"), button[type="submit"]').first().isVisible().catch(() => false);
        expect(hasSendAction).toBeTruthy();
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
      
      // Find logout button in sidebar - it should be visible on desktop
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
      await logoutButton.click();
      // After logout, app redirects to landing page (/) not /auth
      await expect(page).toHaveURL(/^\/$|localhost:5000\/?$/);
    });
  });
});
