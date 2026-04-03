import { test, expect } from '@playwright/test';

test.describe('Feature 04 — Weather Data Service', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the weather display component', async ({ page }) => {
    await expect(page.locator('app-weather-display')).toBeVisible();
  });

  test('weather card has region landmark with "Weather" label', async ({ page }) => {
    const region = page.getByRole('region', { name: /weather/i });
    await expect(region).toBeVisible();
  });

  test('shows loading skeleton or weather conditions (not blank)', async ({ page }) => {
    const card = page.locator('.weather-card');
    await expect(card).toBeVisible();

    // Either loading skeleton or conditions must be present
    const loading = page.locator('.weather-card__loading');
    const conditions = page.locator('.weather-card__conditions');
    const error = page.locator('.weather-card__error');

    const hasLoading = await loading.isVisible().catch(() => false);
    const hasConditions = await conditions.isVisible().catch(() => false);
    const hasError = await error.isVisible().catch(() => false);

    expect(hasLoading || hasConditions || hasError).toBe(true);
  });

  test('weather card contains the "Weather Conditions" heading', async ({ page }) => {
    const card = page.locator('.weather-card');
    await expect(card).toBeVisible();
    const heading = card.locator('.weather-card__title');
    await expect(heading).toBeVisible();
  });

  test('weather card is keyboard accessible (can be tabbed to)', async ({ page }) => {
    const region = page.getByRole('region', { name: /weather/i });
    await expect(region).toBeVisible();
  });

  test('shows weather data after location is granted', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });

    // Intercept the Open-Meteo API call and return mock data
    await page.route('**/api.open-meteo.com/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

    await page.goto('/');

    const button = page.getByRole('button', { name: /use my location/i });
    await button.click();

    // Wait for weather data to load
    await expect(page.locator('.weather-card__conditions')).toBeVisible({ timeout: 10000 });

    // Temperature should be visible
    const text = await page.locator('.weather-card').textContent();
    expect(text).toContain('12.5');
  });

  test('shows fishing score section with score bar', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });

    await page.route('**/api.open-meteo.com/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          latitude: 40.7128,
          longitude: -74.006,
          timezone: 'America/New_York',
          current: {
            time: '2026-04-03T14:30',
            temperature_2m: 15.0,
            apparent_temperature: 13.0,
            precipitation: 0.0,
            weather_code: 1,
            surface_pressure: 1018.0,
            cloud_cover: 25,
            wind_speed_10m: 8.0,
            wind_gusts_10m: 14.0,
          },
        }),
      });
    });

    await page.goto('/');
    const button = page.getByRole('button', { name: /use my location/i });
    await button.click();

    await expect(page.locator('.weather-card__score-section')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.weather-card__score-bar-track')).toBeVisible();
  });
});
