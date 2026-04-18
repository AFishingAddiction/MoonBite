import { test, expect } from '@playwright/test';

/**
 * Feature 17 — Share Score / Daily Report
 *
 * Web Share API is unavailable in Playwright's headless Chromium, so all tests
 * exercise the clipboard/modal fallback path, which is the desktop experience.
 */

const MOCK_WEATHER = {
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
  current: {
    time: '2026-04-18T14:30',
    temperature_2m: 12.5,
    apparent_temperature: 10.2,
    precipitation: 0.0,
    weather_code: 2,
    surface_pressure: 1013.25,
    cloud_cover: 45,
    wind_speed_10m: 18.5,
    wind_gusts_10m: 22.0,
  },
};

test.describe('Share Score — Feature 17', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation and fix position so payload() becomes non-null
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });

    // Mock weather API so fishing score can be computed without a live request
    await page.route('**/api.open-meteo.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_WEATHER),
      });
    });

    // Mock clipboard so writeText never throws
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    });

    await page.goto('/');

    // Trigger location request — permission is pre-granted above
    await page.getByRole('button', { name: /use my location/i }).click();

    // Wait until the score card renders before each test
    await expect(page.locator('.score-card__number')).toBeVisible({ timeout: 10000 });
  });

  // ─── Button presence & accessibility ──────────────────────────────────────

  test('share button is present on the home screen', async ({ page }) => {
    await expect(page.getByRole('button', { name: /share today/i })).toBeVisible();
  });

  test('share button has a descriptive aria-label', async ({ page }) => {
    const btn = page.getByRole('button', { name: /share today/i });
    await expect(btn).toBeVisible();
    const label = await btn.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('share button meets 44×44 minimum touch target size', async ({ page }) => {
    const btn = page.getByRole('button', { name: /share today/i });
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  // ─── Fallback modal (Web Share API unavailable in headless Chromium) ───────

  test('clicking Share opens the fallback modal', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText("Share Today's Score");
  });

  test('modal preview contains MoonBite branding', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('dialog')).toContainText('MoonBite');
  });

  test('modal preview contains a moonbite.app URL', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('dialog')).toContainText('moonbite.app');
  });

  test('modal has Copy to Clipboard button', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('button', { name: /copy to clipboard/i })).toBeVisible();
  });

  test('modal has Close button', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible();
  });

  test('Close button dismisses the modal', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('clicking the backdrop outside the modal card closes the modal', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click the overlay area away from the modal card (top-left corner of the backdrop)
    await page.locator('.share-button__overlay').click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Copy button is keyboard-focusable', async ({ page }) => {
    await page.getByRole('button', { name: /share today/i }).click();
    const copyBtn = page.getByRole('button', { name: /copy to clipboard/i });
    await copyBtn.focus();
    await expect(copyBtn).toBeFocused();
  });
});
