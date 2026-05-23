import { test, expect } from '@playwright/test';

test.describe('Spotting App Smoke Test', () => {
  test('should load the authentication page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify baseline branding and forms
    await expect(page).toHaveTitle(/Spotting/i);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
