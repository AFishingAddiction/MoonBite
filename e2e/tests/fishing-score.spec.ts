import { test, expect } from '@playwright/test';

const MOCK_WEATHER = {
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
  current: {
    time: '2026-04-03T14:30',
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

test.describe('Fishing Score Display', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permission and set a fixed position
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });

    // Mock weather API so score can be computed without a live network call
    await page.route('**/api.open-meteo.com/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WEATHER) });
    });

    await page.goto('/');

    // Trigger location request — geolocation is pre-granted above
    await page.getByRole('button', { name: /use my location/i }).click();

    // Wait until the score is fully rendered before each test runs
    await expect(page.locator('.score-card__number')).toBeVisible({ timeout: 10000 });
  });

  test('displays Fishing Score section heading', async ({ page }) => {
    await expect(page.getByText(/fishing score/i).first()).toBeVisible();
  });

  test('shows a numeric score between 0 and 100', async ({ page }) => {
    const scoreText = await page.locator('.score-card__number').innerText();
    const score = parseInt(scoreText.trim(), 10);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);

    await expect(page.locator('.score-card__denom')).toContainText('/ 100');
  });

  test('shows Moon Phase factor in breakdown', async ({ page }) => {
    await expect(page.getByText(/moon phase/i)).toBeVisible();
  });

  test('shows Solunar factor in breakdown', async ({ page }) => {
    await expect(page.locator('.score-card__breakdown').getByText(/solunar/i)).toBeVisible();
  });

  test('shows Weather factor in breakdown', async ({ page }) => {
    await expect(page.locator('.score-card__breakdown').getByText(/weather/i)).toBeVisible();
  });
});
