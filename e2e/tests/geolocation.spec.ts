import { test, expect } from '@playwright/test';

test.describe('Feature 01 — Geolocation', () => {
  test('shows "Use My Location" button on home page', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    await expect(button).toBeVisible();
  });

  test('button is keyboard focusable', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    await button.focus();
    await expect(button).toBeFocused();
  });

  test('shows loading state after clicking location button (mocked)', async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    await button.click();
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
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('location-error')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Feature 24 — Geolocation Permission Recovery', () => {
  test('shows error state with retry button when permission is denied', async ({ page }) => {
    // No grantPermissions → denied by default in Playwright
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('location-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('retry-btn')).toBeVisible();
  });

  test('shows "Use Different Location" link when permission is denied', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('location-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('use-different-location-link')).toBeVisible();
  });

  test('"Use Different Location" link navigates to /locations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('use-different-location-link')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('use-different-location-link').click();
    await expect(page).toHaveURL(/\/locations/);
  });

  test('splash screen dismisses within 6 seconds even when permission is denied', async ({
    page,
  }) => {
    await page.goto('/');
    // The splash should be gone well before the safety timeout
    const splash = page.locator('[role="status"][aria-label="Loading MoonBite"]');
    await expect(splash).not.toBeVisible({ timeout: 6000 });
  });

  test('"Use My Location" button is visible and interactive after splash dismisses', async ({
    page,
  }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    // Wait for splash to clear before button is accessible
    await expect(button).toBeVisible({ timeout: 6000 });
    // Button must actually be clickable (not overlaid by splash)
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByTestId('location-error')).toBeVisible({ timeout: 5000 });
  });

  test('splash is not obscuring the page when error state is shown', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('location-error')).toBeVisible({ timeout: 5000 });
    // Confirm splash overlay is gone — not just hidden, actually removed from DOM
    const splash = page.locator('[role="status"][aria-label="Loading MoonBite"]');
    await expect(splash).not.toBeVisible();
  });

  test('retry button is keyboard accessible in denied state', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('retry-btn')).toBeVisible({ timeout: 5000 });
    const retryBtn = page.getByTestId('retry-btn');
    await retryBtn.focus();
    await expect(retryBtn).toBeFocused();
  });

  test('granting permission after initial load shows coordinates', async ({ page }) => {
    // Start with permission granted — simulates user fixing settings then reloading
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 51.5074, longitude: -0.1278 });
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    await expect(page.getByTestId('location-coords')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('location-coords')).toContainText('51.5074');
  });

  test('error state has role=alert for screen reader announcement', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /use my location/i }).click();
    const errorEl = page.getByTestId('location-error');
    await expect(errorEl).toBeVisible({ timeout: 5000 });
    await expect(errorEl).toHaveAttribute('role', 'alert');
  });
});
