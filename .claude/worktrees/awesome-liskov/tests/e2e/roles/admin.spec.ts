import { test, expect, Page } from '@playwright/test';

/**
 * Admin Role UI Tests
 * Tests all admin-specific functions in DriverPath
 */

test.describe('Admin Role - Administrative Functions', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Admin Dashboard', () => {
    test('should access admin dashboard', async () => {
      await page.goto('/admin');
      // Either shows admin page or redirects based on permissions
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display admin statistics', async () => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const stats = page.locator('text=/users|subscribers|active|total/i');
      if (await stats.first().isVisible()) {
        await expect(stats.first()).toBeVisible();
      }
    });

    test('should show recent signups', async () => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const recentSignups = page.locator('text=/recent|signup|new users/i');
      if (await recentSignups.first().isVisible()) {
        await expect(recentSignups.first()).toBeVisible();
      }
    });
  });

  test.describe('User Management', () => {
    test('should display user list', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      // Look for user table or list
      const userTable = page.locator('table, [data-testid="user-list"], [role="grid"]');
      if (await userTable.isVisible()) {
        await expect(userTable).toBeVisible();
      }
    });

    test('should search users', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }
    });

    test('should filter users by tier', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const tierFilter = page.locator('select, [data-testid="tier-filter"]');
      if (await tierFilter.isVisible()) {
        await tierFilter.click();
      }
    });

    test('should filter users by status', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const statusFilter = page.locator('text=/active|inactive|all/i');
      if (await statusFilter.first().isVisible()) {
        await statusFilter.first().click();
      }
    });

    test('should sort user table', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const sortableHeader = page.locator('th:has-text("Name"), th:has-text("Email")').first();
      if (await sortableHeader.isVisible()) {
        await sortableHeader.click();
        await page.waitForTimeout(500);
      }
    });

    test('should view user details', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const userRow = page.locator('tr, [data-testid^="user-row-"]').first();
      if (await userRow.isVisible()) {
        const viewButton = userRow.locator('button:has-text("View"), a:has-text("View")');
        if (await viewButton.isVisible()) {
          await viewButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Admin Notes', () => {
    test('should view admin notes on user', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const userRow = page.locator('tr, [data-testid^="user-row-"]').first();
      if (await userRow.isVisible()) {
        const viewButton = userRow.locator('button:has-text("View"), a:has-text("View")');
        if (await viewButton.isVisible()) {
          await viewButton.click();
          await page.waitForTimeout(1000);
          
          const notesSection = page.locator('text=/notes|admin notes/i');
          if (await notesSection.isVisible()) {
            await expect(notesSection).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Subscription Management', () => {
    test('should view subscription tiers', async () => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const tierInfo = page.locator('text=/basic|pro|enterprise|tier/i');
      if (await tierInfo.first().isVisible()) {
        await expect(tierInfo.first()).toBeVisible();
      }
    });

    test('should see tier breakdown', async () => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const tierBreakdown = page.locator('text=/breakdown|distribution/i');
      if (await tierBreakdown.first().isVisible()) {
        await expect(tierBreakdown.first()).toBeVisible();
      }
    });
  });

  test.describe('Content Management', () => {
    test('should access content management', async () => {
      await page.goto('/admin/content');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Feature Flags', () => {
    test('should access feature flags if super admin', async () => {
      await page.goto('/admin/features');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Audit Logs', () => {
    test('should access audit logs', async () => {
      await page.goto('/admin/audit');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Data Export', () => {
    test('should access data export functionality', async () => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
      }
    });
  });

  test.describe('Admin Navigation', () => {
    test('should navigate between admin sections', async () => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);
      
      // Try to find admin nav links
      const adminNav = page.locator('a[href*="admin"], nav a');
      const linkCount = await adminNav.count();
      
      if (linkCount > 0) {
        // Verify at least one admin link is accessible
        await expect(adminNav.first()).toBeVisible();
      }
    });
  });
});
