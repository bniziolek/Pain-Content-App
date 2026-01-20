import { test, expect } from '@playwright/test';

test.describe('PDF Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('should open PDF configuration dialog', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
    const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
    const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
    
    if (await checkbox.isVisible()) {
      await checkbox.click();
    } else {
      await firstCard.click();
    }
    
    // Open packet modal
    const packetButton = page.locator('button:has-text("Packet"), button:has-text("Download")');
    await packetButton.first().click();
    
    // Click Generate PDF
    const generatePdfButton = page.locator('[data-testid="button-generate-pdf"], button:has-text("Generate PDF")');
    await generatePdfButton.click();
    
    // Verify PDF dialog opens with configuration options
    await expect(page.locator('[data-testid="input-patient-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-clinician-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-packet-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="textarea-cover-message"]')).toBeVisible();
  });

  test('should show character counter for cover message', async ({ page }) => {
    await page.goto('/library');
    
    // Select content and open PDF dialog
    await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
    const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
    const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
    
    if (await checkbox.isVisible()) {
      await checkbox.click();
    } else {
      await firstCard.click();
    }
    
    const packetButton = page.locator('button:has-text("Packet"), button:has-text("Download")');
    await packetButton.first().click();
    
    const generatePdfButton = page.locator('[data-testid="button-generate-pdf"], button:has-text("Generate PDF")');
    await generatePdfButton.click();
    
    // Type in cover message
    const messageInput = page.locator('[data-testid="textarea-cover-message"]');
    await messageInput.fill('This is a test message for the patient.');
    
    // Check character counter is visible and updated
    await expect(page.locator('text=/\\d+\/500/')).toBeVisible();
  });

  test('should update preview when patient name is entered', async ({ page }) => {
    await page.goto('/library');
    
    // Select content and open PDF dialog
    await page.waitForSelector('[data-testid^="card-"], .content-card, article', { timeout: 10000 });
    const firstCard = page.locator('[data-testid^="card-"], .content-card, article').first();
    const checkbox = firstCard.locator('input[type="checkbox"], [role="checkbox"]');
    
    if (await checkbox.isVisible()) {
      await checkbox.click();
    } else {
      await firstCard.click();
    }
    
    const packetButton = page.locator('button:has-text("Packet"), button:has-text("Download")');
    await packetButton.first().click();
    
    const generatePdfButton = page.locator('[data-testid="button-generate-pdf"], button:has-text("Generate PDF")');
    await generatePdfButton.click();
    
    // Enter patient name
    const patientNameInput = page.locator('[data-testid="input-patient-name"]');
    await patientNameInput.fill('John Smith');
    
    // Check preview updates
    await expect(page.locator('text=/Prepared for.*John Smith/i')).toBeVisible();
  });
});
