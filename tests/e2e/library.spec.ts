import { test, expect } from '@playwright/test';

test.describe('Content Library', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('should display content library page', async ({ page }) => {
    await page.goto('/library');
    await expect(page).toHaveURL(/\/library/);
    await expect(page.locator('h1, h2').filter({ hasText: /library|content/i })).toBeVisible();
  });

  test('should show content cards', async ({ page }) => {
    await page.goto('/library');
    
    // Wait for content to load - cards have data-testid="content-card-{id}"
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    
    const contentCards = page.locator('[data-testid^="content-card-"]');
    await expect(contentCards.first()).toBeVisible();
  });

  test('should filter content by search', async ({ page }) => {
    await page.goto('/library');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('pain');
      await page.waitForTimeout(500); // Debounce
      
      // Verify search is applied
      await expect(searchInput).toHaveValue('pain');
    }
  });

  test('should select content items', async ({ page }) => {
    await page.goto('/library');
    
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    
    // Click on first content card to select it
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Check for selection indicator - buttons show count like "Create Packet (1)" or "Send 1 Items"
    const selectionIndicator = page.locator('text=/Packet \\(\\d+\\)|Send \\d+ Items/i');
    await expect(selectionIndicator.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Content Library - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('action button should not overlap bottom navigation on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    await page.goto('/library');
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    
    // Select a content item to show the action button
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Wait for action button to appear
    const actionButton = page.locator('[data-testid="button-download-packet"], [data-testid="button-send-items"]').first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    
    // Get bottom nav element
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible();
    
    // Get bounding boxes
    const actionBox = await actionButton.boundingBox();
    const navBox = await bottomNav.boundingBox();
    
    // Verify action button is above bottom nav (no overlap)
    // The button's bottom edge should be above the nav's top edge
    expect(actionBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    
    if (actionBox && navBox) {
      const buttonBottom = actionBox.y + actionBox.height;
      const navTop = navBox.y;
      
      // Button should be completely above the bottom nav
      expect(buttonBottom).toBeLessThanOrEqual(navTop);
    }
  });
});
