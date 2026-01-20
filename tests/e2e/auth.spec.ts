import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    await expect(page.locator('[data-testid="user-menu"], .user-menu, nav')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    
    // Find and click logout
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign out")');
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
    
    // Look for logout option if there's a dropdown
    const logoutButton = page.locator('text=/logout|sign out/i').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
    
    await expect(page).toHaveURL(/\/auth/);
  });
});
