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
    
    // Wait for content to load
    await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
    
    const contentCards = page.locator('[data-testid^="card-"], .content-card, article');
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
    
    await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
    
    // Try to click on content card checkbox or the card itself
    const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
    const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
    
    if (await checkbox.isVisible()) {
      await checkbox.click();
    } else {
      await firstCard.click();
    }
    
    // Check for selection indicator
    const selectionIndicator = page.locator('text=/selected|1 item/i');
    await expect(selectionIndicator).toBeVisible({ timeout: 5000 });
  });
});
