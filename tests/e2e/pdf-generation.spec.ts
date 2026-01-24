import { test, expect } from '@playwright/test';

test.describe('Content Action Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"], input[name="email"]', 'admin@driverpath.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('should open modal when content is selected', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Detect which mode we're in and get the action button
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
      await expect(modal.locator('text=/Send|Patient Email|Content/i').first()).toBeVisible();
    }
  });

  test('should display modal with appropriate content preview', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Detect mode and click action button
    const packetButton = page.locator('[data-testid="button-download-packet"]');
    const sendButton = page.locator('[data-testid="button-send-items"]');
    const isPacketMode = await packetButton.isVisible().catch(() => false);
    const actionButton = isPacketMode ? packetButton : sendButton;
    
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    if (isPacketMode) {
      // Packet mode: should show patient education materials preview
      await expect(modal.locator('text=/Patient Education Materials/i').first()).toBeVisible();
    } else {
      // Email mode: should show patient email field or content selection
      const hasEmailField = await modal.locator('input[type="email"], [placeholder*="email" i]').first().isVisible().catch(() => false);
      const hasContentInfo = await modal.locator('text=/Content|Selected|Items/i').first().isVisible().catch(() => false);
      expect(hasEmailField || hasContentInfo).toBeTruthy();
    }
  });

  test('should have appropriate action buttons', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Detect mode and click action button
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
      // Email mode: should have send button
      const hasSendAction = await modal.locator('button:has-text("Send"), button[type="submit"]').first().isVisible().catch(() => false);
      expect(hasSendAction).toBeTruthy();
    }
  });

  test('should close modal', async ({ page }) => {
    await page.goto('/library');
    
    // Select content
    await page.waitForSelector('[data-testid^="content-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="content-card-"]').first();
    await firstCard.click();
    
    // Detect mode and click action button
    const packetButton = page.locator('[data-testid="button-download-packet"]');
    const sendButton = page.locator('[data-testid="button-send-items"]');
    const isPacketMode = await packetButton.isVisible().catch(() => false);
    const actionButton = isPacketMode ? packetButton : sendButton;
    
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Close modal using appropriate close method
    if (isPacketMode) {
      const closeButton = modal.locator('[data-testid="button-close-packet"], button:has-text("Close")').first();
      await closeButton.click();
    } else {
      // For send modal, use Cancel or X button
      const closeButton = modal.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
    
    // Verify modal is closed
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
