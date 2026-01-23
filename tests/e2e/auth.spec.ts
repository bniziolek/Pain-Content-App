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
    
    // Should redirect away from auth page to dashboard
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    
    // Main content area should be visible (indicates logged in)
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
    
    // Should stay on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    
    // Navigate to settings where logout is accessible
    await page.goto('/settings');
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")').first();
    await logoutButton.click();
    
    // After logout, verify we can't access protected routes
    await page.waitForTimeout(1000);
    await page.goto('/dashboard');
    
    // Should redirect to auth page because we're logged out
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });
});
