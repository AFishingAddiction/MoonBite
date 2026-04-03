import { test, expect } from '@playwright/test';

test.describe('Fishing Score Display', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permission and set a fixed position
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });

    await page.goto('/');
  });

  test('displays Fishing Score section heading', async ({ page }) => {
    await expect(page.getByText(/fishing score/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows a numeric score between 0 and 100', async ({ page }) => {
    // Wait for the score number to appear
    const scoreLocator = page.locator('app-fishing-score-display');
    await expect(scoreLocator).toBeVisible({ timeout: 10000 });

    const text = await scoreLocator.textContent();
    // Extract digits — score should be a number
    const match = text?.match(/\b(\d{1,3})\s*\/\s*100\b/);
    expect(match).not.toBeNull();

    const score = parseInt(match![1], 10);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('shows Moon Phase factor in breakdown', async ({ page }) => {
    await expect(page.getByText(/moon phase/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows Solunar factor in breakdown', async ({ page }) => {
    await expect(page.getByText(/solunar/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows Weather factor in breakdown', async ({ page }) => {
    await expect(page.getByText(/weather/i)).toBeVisible({ timeout: 10000 });
  });
});
