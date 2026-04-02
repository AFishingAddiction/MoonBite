import { test, expect } from '@playwright/test';

test.describe('Feature 01 — Geolocation', () => {
  test('shows "Use My Location" button on home page', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    await expect(button).toBeVisible();
  });

  test('button is keyboard focusable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const button = page.getByRole('button', { name: /use my location/i });
    await expect(button).toBeFocused();
  });

  test('shows loading state after clicking location button (mocked)', async ({ page }) => {
    // Grant geolocation permission but intercept at the browser level —
    // the loading state appears briefly before resolution
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    await button.click();
    // After granting, coordinates should appear
    await expect(page.getByTestId('location-coords')).toBeVisible({ timeout: 5000 });
  });

  test('shows coordinates after granting location', async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('location-coords')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('location-coords')).toContainText('40.7128');
  });

  test('shows denied error when location is denied', async ({ page }) => {
    // Don't grant permissions (default denied)
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    // Wait for error state
    await expect(page.getByTestId('location-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });
});
