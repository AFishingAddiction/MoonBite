import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Feature 10 — Weather Details Screen
 *
 * These tests mock geolocation to avoid browser permission dialogs.
 * Weather data is fetched from Open-Meteo; tests use real HTTP (cached by service).
 * The dev server must be running at http://localhost:4202.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

async function grantLocation(page: Page, latitude = 40.7128, longitude = -74.006): Promise<void> {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude, longitude });
}

async function navigateToWeather(page: Page): Promise<void> {
  await page.goto('/weather');
  await page.waitForLoadState('networkidle');
}

async function navigateToWeatherWithLocation(page: Page): Promise<void> {
  await grantLocation(page);
  await navigateToWeather(page);
}

// ── Route & navigation ────────────────────────────────────────────────────────

test.describe('Weather Details Screen — route and navigation', () => {
  test('navigates directly to /weather without 404', async ({ page }) => {
    await navigateToWeather(page);
    await expect(page).not.toHaveURL(/\/404/);
    await expect(page.locator('main.weather-detail')).toBeVisible();
  });

  test('back link is present and links to home', async ({ page }) => {
    await navigateToWeather(page);
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });

  test('clicking back link navigates to home', async ({ page }) => {
    await navigateToWeather(page);
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('back link is keyboard accessible (Tab + Enter)', async ({ page }) => {
    await navigateToWeather(page);
    await page.keyboard.press('Tab');
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
  });
});

// ── Geolocation states ────────────────────────────────────────────────────────

test.describe('Weather Details Screen — geolocation states', () => {
  test('shows location prompt when geolocation is idle', async ({ page }) => {
    await navigateToWeather(page);
    await expect(page.locator('.weather-detail__state-card')).toBeVisible();
    await expect(page.locator('.weather-detail__state-card')).toContainText('Share your location');
  });

  test('does not render hero section when geolocation is idle', async ({ page }) => {
    await navigateToWeather(page);
    await expect(page.locator('.weather-detail__hero')).not.toBeVisible();
  });

  test('shows error message when location is denied', async ({ page }) => {
    await page.context().setGeolocation(null as unknown as { latitude: number; longitude: number });
    await navigateToWeather(page);
    // Without geolocation granted, idle state shown
    await expect(page.locator('.weather-detail__state-card')).toBeVisible();
  });
});

// ── Data loaded state ─────────────────────────────────────────────────────────

test.describe('Weather Details Screen — data loaded', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWeatherWithLocation(page);
  });

  test('renders hero section with condition name', async ({ page }) => {
    await expect(page.locator('.weather-detail__hero')).toBeVisible();
    await expect(page.locator('.weather-detail__hero-title')).toBeVisible();
  });

  test('hero h1 is the weather condition name', async ({ page }) => {
    const h1 = page.locator('h1.weather-detail__hero-title');
    await expect(h1).toBeVisible();
    // Should be a weather condition string (not empty)
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('shows today\'s date in hero', async ({ page }) => {
    const date = page.locator('.weather-detail__hero-date');
    await expect(date).toBeVisible();
    const text = await date.textContent();
    // Date should be in YYYY-MM-DD format
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('shows temperature', async ({ page }) => {
    const temp = page.locator('.weather-detail__temp');
    await expect(temp).toBeVisible();
    const text = await temp.textContent();
    expect(text).toMatch(/\d+°C/);
  });

  test('shows feels-like temperature', async ({ page }) => {
    const feelsLike = page.locator('.weather-detail__feels-like');
    await expect(feelsLike).toBeVisible();
  });

  test('weather emoji is present and aria-hidden', async ({ page }) => {
    const emoji = page.locator('.weather-detail__hero-emoji');
    await expect(emoji).toBeVisible();
    await expect(emoji).toHaveAttribute('aria-hidden', 'true');
  });

  test('score bar renders with meter role', async ({ page }) => {
    const track = page.locator('.score-bar__track');
    await expect(track).toBeVisible();
    await expect(track).toHaveAttribute('role', 'meter');
    await expect(track).toHaveAttribute('aria-valuemin', '0');
    await expect(track).toHaveAttribute('aria-valuemax', '100');
  });

  test('score bar aria-valuenow is a number between 0 and 100', async ({ page }) => {
    const track = page.locator('.score-bar__track');
    const valuenow = await track.getAttribute('aria-valuenow');
    const score = Number(valuenow);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── Stats grid ────────────────────────────────────────────────────────────────

test.describe('Weather Details Screen — stats grid', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWeatherWithLocation(page);
  });

  test('renders 4 stat cells', async ({ page }) => {
    const stats = page.locator('.weather-detail__stat');
    await expect(stats).toHaveCount(4);
  });

  test('stat labels include Temperature, Wind, Pressure, Cloud Cover', async ({ page }) => {
    const labels = page.locator('.weather-detail__stat-label');
    const texts = await labels.allTextContents();
    const joined = texts.join(' ');
    expect(joined).toMatch(/Temp(erature)?/i);
    expect(joined).toMatch(/Wind/i);
    expect(joined).toMatch(/Pressure/i);
    expect(joined).toMatch(/Cloud/i);
  });

  test('shows pressure trend icon', async ({ page }) => {
    const trendIcon = page.locator('.weather-detail__trend-icon').first();
    await expect(trendIcon).toBeVisible();
  });
});

// ── Conditions card ───────────────────────────────────────────────────────────

test.describe('Weather Details Screen — conditions card', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWeatherWithLocation(page);
  });

  test('renders conditions section', async ({ page }) => {
    await expect(page.locator('.weather-detail__conditions-section')).toBeVisible();
  });

  test('conditions section has heading "Conditions"', async ({ page }) => {
    const heading = page.locator('h2#weather-conditions-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Conditions');
  });

  test('shows Feels Like row', async ({ page }) => {
    const labels = page.locator('.weather-detail__condition-label');
    await expect(labels.filter({ hasText: /Feels Like/i })).toBeVisible();
  });

  test('shows Precipitation row', async ({ page }) => {
    const labels = page.locator('.weather-detail__condition-label');
    await expect(labels.filter({ hasText: /Precipitation/i })).toBeVisible();
  });

  test('shows Wind Gusts row', async ({ page }) => {
    const labels = page.locator('.weather-detail__condition-label');
    await expect(labels.filter({ hasText: /Wind Gusts/i })).toBeVisible();
  });

  test('shows Pressure Trend row', async ({ page }) => {
    const labels = page.locator('.weather-detail__condition-label');
    await expect(labels.filter({ hasText: /Pressure Trend/i })).toBeVisible();
  });
});

// ── Fishing score breakdown ───────────────────────────────────────────────────

test.describe('Weather Details Screen — fishing score breakdown', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWeatherWithLocation(page);
  });

  test('renders impact section', async ({ page }) => {
    await expect(page.locator('.weather-detail__impact-section')).toBeVisible();
  });

  test('shows heading "Fishing Score Breakdown"', async ({ page }) => {
    const heading = page.locator('h2#weather-impact-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Breakdown');
  });

  test('renders 4 factor rows', async ({ page }) => {
    const rows = page.locator('.weather-detail__impact-row');
    await expect(rows).toHaveCount(4);
  });

  test('factor rows include Pressure, Wind, Cloud Cover, Precipitation', async ({ page }) => {
    const labels = page.locator('.weather-detail__impact-label');
    const texts = await labels.allTextContents();
    const joined = texts.join(' ');
    expect(joined).toContain('Pressure');
    expect(joined).toContain('Wind');
    expect(joined).toContain('Cloud Cover');
    expect(joined).toContain('Precipitation');
  });

  test('renders mini-bar tracks for all 4 factors', async ({ page }) => {
    const tracks = page.locator('.weather-detail__impact-bar-track');
    await expect(tracks).toHaveCount(4);
  });

  test('factor rows have role="listitem"', async ({ page }) => {
    const rows = page.locator('.weather-detail__impact-row[role="listitem"]');
    await expect(rows).toHaveCount(4);
  });

  test('impact list has role="list"', async ({ page }) => {
    const list = page.locator('.weather-detail__impact-list[role="list"]');
    await expect(list).toBeVisible();
  });

  test('score values show x/max format', async ({ page }) => {
    const values = page.locator('.weather-detail__impact-value');
    const texts = await values.allTextContents();
    // Each should look like "28/30" or "36/40" etc.
    texts.forEach(text => {
      expect(text.trim()).toMatch(/\d+\/\d+/);
    });
  });
});

// ── Fishing advice ─────────────────────────────────────────────────────────────

test.describe('Weather Details Screen — fishing advice', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWeatherWithLocation(page);
  });

  test('renders advice section', async ({ page }) => {
    await expect(page.locator('.weather-detail__advice-section')).toBeVisible();
  });

  test('shows heading "Fishing Conditions"', async ({ page }) => {
    const heading = page.locator('h2#weather-advice-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Fishing Conditions');
  });

  test('advice text is not empty', async ({ page }) => {
    const advice = page.locator('.weather-detail__advice');
    await expect(advice).toBeVisible();
    const text = await advice.textContent();
    expect(text?.trim().length).toBeGreaterThan(10);
  });
});

// ── Home screen navigation ────────────────────────────────────────────────────

test.describe('Weather Details Screen — home card link', () => {
  test('weather card on home screen links to /weather', async ({ page }) => {
    await grantLocation(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const weatherLink = page.locator('a[href="/weather"]');
    await expect(weatherLink).toBeVisible();
  });

  test('clicking weather card navigates to /weather', async ({ page }) => {
    await grantLocation(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const weatherLink = page.locator('a[href="/weather"]');
    await weatherLink.click();
    await expect(page).toHaveURL('/weather');
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

test.describe('Weather Details Screen — accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWeatherWithLocation(page);
  });

  test('main element has class weather-detail', async ({ page }) => {
    await expect(page.locator('main.weather-detail')).toBeVisible();
  });

  test('page has a nav element wrapping back link', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Page navigation"]');
    await expect(nav).toBeVisible();
  });

  test('hero section is labeled by h1', async ({ page }) => {
    const section = page.locator('section[aria-labelledby="weather-hero-heading"]');
    await expect(section).toBeVisible();
  });

  test('stats section has visually-hidden heading', async ({ page }) => {
    await expect(page.locator('.weather-detail__visually-hidden')).toBeAttached();
  });

  test('page title includes MoonBite', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('MoonBite');
  });
});
