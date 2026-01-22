import { test, expect } from '@playwright/test';

test.describe('Content Packet Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('should open packet modal when content is selected', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Wait for selection to register and packet button to appear
    const packetButton = page.locator('[data-testid="button-download-packet"]');
    await expect(packetButton).toBeVisible({ timeout: 5000 });
    await packetButton.click();
    
    // Verify packet modal opens with content
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Content Packet' })).toBeVisible();
  });

  test('should display packet content preview', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Wait for packet button and click
    const packetButton = page.locator('[data-testid="button-download-packet"]');
    await expect(packetButton).toBeVisible({ timeout: 5000 });
    await packetButton.click();
    
    // Check content preview is shown in the modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Should show educational content preview
    await expect(page.getByRole('heading', { name: 'Patient Education Materials' })).toBeVisible();
  });

  test('should have print and download options', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Wait for packet button and click
    const packetButton = page.locator('[data-testid="button-download-packet"]');
    await expect(packetButton).toBeVisible({ timeout: 5000 });
    await packetButton.click();
    
    // Verify modal opens with print/download functionality
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    const hasActions = await page.locator('[data-testid="button-print-packet"], [data-testid="button-download-txt"], button:has-text("Print"), button:has-text("Download")').first().isVisible();
    expect(hasActions).toBeTruthy();
  });

  test('should close packet modal', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Wait for packet button and click
    const packetButton = page.locator('[data-testid="button-download-packet"]');
    await expect(packetButton).toBeVisible({ timeout: 5000 });
    await packetButton.click();
    
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Close modal
    const closeButton = page.locator('[data-testid="button-close-packet"]');
    await closeButton.click();
    
    // Verify modal is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
