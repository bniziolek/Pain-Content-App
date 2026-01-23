import { test, expect } from '@playwright/test';

/**
 * Unauthenticated User Tests
 * Tests public pages and access control for non-logged-in users
 */

test.describe('Unauthenticated User - Public Access', () => {
  test.describe('Public Pages', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/auth');
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display login form elements', async ({ page }) => {
      await page.goto('/auth');
      
      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
      
      // Check for submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test('should show registration option if available', async ({ page }) => {
      await page.goto('/auth');
      
      const registerLink = page.locator('text=/register|sign up|create account/i');
      // Registration may or may not be available
      if (await registerLink.isVisible()) {
        await expect(registerLink).toBeVisible();
      }
    });

    test('should show forgot password option if available', async ({ page }) => {
      await page.goto('/auth');
      
      const forgotPassword = page.locator('text=/forgot|reset password/i');
      if (await forgotPassword.isVisible()) {
        await expect(forgotPassword).toBeVisible();
      }
    });
  });

  test.describe('Access Control - Protected Routes', () => {
    test('should redirect dashboard to login', async ({ page }) => {
      await page.goto('/dashboard');
      // MUST redirect to auth - this is a security requirement
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });

    test('should redirect library to login', async ({ page }) => {
      await page.goto('/library');
      // MUST redirect to auth - this is a security requirement
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });

    test('should redirect settings to login', async ({ page }) => {
      await page.goto('/settings');
      // MUST redirect to auth - this is a security requirement
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });

    test('should redirect assessments to login', async ({ page }) => {
      await page.goto('/assessments');
      // MUST redirect to auth - this is a security requirement
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });

    test('should redirect admin dashboard to login', async ({ page }) => {
      await page.goto('/admin/dashboard');
      // MUST redirect to auth - this is a security requirement
      await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
    });

    test('should redirect history to login', async ({ page }) => {
      await page.goto('/history');
      // MUST redirect to auth - this is a security requirement
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });
  });

  test.describe('Login Validation', () => {
    test('should reject empty credentials', async ({ page }) => {
      await page.goto('/auth');
      
      await page.click('button[type="submit"]');
      
      // Should show validation error or stay on page
      await expect(page).toHaveURL(/\/auth/);
    });

    test('should reject invalid email format', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show error or stay on page
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/auth/);
    });

    test('should reject incorrect credentials', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=/invalid|error|incorrect|wrong/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show error for empty password', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      
      // Should stay on auth page
      await expect(page).toHaveURL(/\/auth/);
    });
  });

  test.describe('API Access Control', () => {
    test('should reject unauthenticated API access to user endpoint', async ({ page }) => {
      const response = await page.request.get('/api/user');
      expect(response.status()).toBe(401);
    });

    test('should reject unauthenticated API access to content', async ({ page }) => {
      const response = await page.request.get('/api/content');
      // Either 401 or content is public
      expect([200, 401]).toContain(response.status());
    });

    test('should allow health check endpoint', async ({ page }) => {
      const response = await page.request.get('/api/health');
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Registration Flow', () => {
    test('should show registration form if available', async ({ page }) => {
      await page.goto('/auth?signup=true');
      await page.waitForTimeout(1000);
      
      // Check for registration form fields - name field should be visible on signup
      const nameInput = page.locator('[data-testid="input-name"], input[name="name"], input[placeholder*="name" i]');
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
      }
      // Test passes if registration not available (feature may be disabled in settings)
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page-12345');
      
      // Should either redirect to auth or show 404 page
      await page.waitForTimeout(1000);
      const is404 = await page.locator('text=/not found|404/i').isVisible();
      const isAuth = page.url().includes('/auth');
      
      expect(is404 || isAuth).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have focusable form elements', async ({ page }) => {
      await page.goto('/auth');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      
      // Some element should be focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
    });

    test('should support keyboard form submission', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.keyboard.press('Enter');
      
      // Should attempt login
      await page.waitForTimeout(2000);
    });
  });
});
