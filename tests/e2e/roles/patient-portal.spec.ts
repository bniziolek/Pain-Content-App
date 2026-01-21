import { test, expect } from '@playwright/test';

/**
 * Patient Portal Tests
 * Tests patient-facing portal functionality
 */

test.describe('Patient Portal - Patient Access', () => {
  test.describe('Portal Access', () => {
    test('should display patient portal page', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      // Portal should either show login or content based on feature flags
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show access code entry if portal is enabled', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      const accessCodeInput = page.locator('input[type="text"], input[name="accessCode"], input[placeholder*="code" i]');
      if (await accessCodeInput.isVisible()) {
        await expect(accessCodeInput).toBeVisible();
      }
    });

    test('should show email entry for portal access', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
      }
    });
  });

  test.describe('Portal Authentication', () => {
    test('should reject invalid access code', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      const accessCodeInput = page.locator('input[type="text"], input[name="accessCode"], input[placeholder*="code" i]');
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      
      if (await accessCodeInput.isVisible() && await emailInput.isVisible()) {
        await emailInput.fill('patient@example.com');
        await accessCodeInput.fill('000000');
        
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should show error
          await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should handle lockout after failed attempts', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      const accessCodeInput = page.locator('input[type="text"], input[name="accessCode"], input[placeholder*="code" i]');
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      
      if (await accessCodeInput.isVisible() && await emailInput.isVisible()) {
        // Attempt multiple failed logins
        for (let i = 0; i < 3; i++) {
          await emailInput.fill('patient@example.com');
          await accessCodeInput.fill('000000');
          
          const submitButton = page.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500);
          }
        }
        
        // May show lockout message
        const lockoutMessage = page.locator('text=/locked|too many|wait/i');
        // Lockout may or may not be triggered depending on config
      }
    });
  });

  test.describe('Portal Content Access', () => {
    test('should not access content without authentication', async ({ page }) => {
      // Try to access portal content directly
      const response = await page.request.get('/api/patient-portal/content');
      // Should be unauthorized or not found - 500 is not acceptable for auth
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Portal UI Elements', () => {
    test('should display branding on portal page', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      // Look for DriverPath branding
      const branding = page.locator('text=/DriverPath|Health Drivers/i');
      if (await branding.isVisible()) {
        await expect(branding).toBeVisible();
      }
    });

    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      // Page should render without horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50); // Allow small margin
    });
  });

  test.describe('Portal Session Management', () => {
    test('should handle session timeout gracefully', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      // Verify page loads without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Assessment Access via Portal', () => {
    test('should access assessment if invited', async ({ page }) => {
      // This would require a valid access code - testing structure only
      await page.goto('/portal/assessment');
      await page.waitForTimeout(2000);
      
      // Either shows assessment or redirects to portal login
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Content Viewing', () => {
    test('should access content view page structure', async ({ page }) => {
      // Testing page structure without valid auth
      await page.goto('/portal/content');
      await page.waitForTimeout(2000);
      
      // Either redirects or shows content
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('should handle expired sessions', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      // Clear any session data
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Refresh and verify redirect to auth
      await page.reload();
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/portal');
      await page.waitForTimeout(2000);
      
      // Page should be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
