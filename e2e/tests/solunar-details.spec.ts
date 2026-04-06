import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Feature 09 — Solunar Peak Times Details Screen
 *
 * These tests mock geolocation to avoid browser permission dialogs.
 * The dev server must be running at http://localhost:4202.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

async function grantLocation(page: Page, latitude = 40.7128, longitude = -74.006): Promise<void> {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude, longitude });
}

async function navigateToSolunar(page: Page): Promise<void> {
  await page.goto('/solunar');
  await page.waitForLoadState('networkidle');
}

async function navigateToSolunarWithLocation(page: Page): Promise<void> {
  await grantLocation(page);
  await navigateToSolunar(page);
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Solunar Details Screen — route and navigation', () => {
  test('navigates directly to /solunar without 404', async ({ page }) => {
    await navigateToSolunar(page);
    await expect(page).not.toHaveURL(/\/404/);
    await expect(page.locator('main.solunar-detail')).toBeVisible();
  });

  test('back link is present and links to home', async ({ page }) => {
    await navigateToSolunar(page);
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });

  test('clicking back link navigates to home', async ({ page }) => {
    await navigateToSolunar(page);
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('back link is keyboard accessible (Tab + Enter)', async ({ page }) => {
    await navigateToSolunar(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
  });

  test('navigates from home solunar card to /solunar', async ({ page }) => {
    await grantLocation(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const solunarLink = page.getByRole('link', { name: /view solunar details/i });
    await expect(solunarLink).toBeVisible();
    await solunarLink.click();
    await expect(page).toHaveURL('/solunar');
  });
});

test.describe('Solunar Details Screen — idle / denied states', () => {
  test('shows location prompt when geolocation is not granted', async ({ page }) => {
    // Do NOT grant geolocation — browser default is idle/denied
    await navigateToSolunar(page);
    const stateCard = page.locator('.solunar-detail__state-card');
    await expect(stateCard).toBeVisible();
  });

  test('does not render hero section when location not granted', async ({ page }) => {
    await navigateToSolunar(page);
    const hero = page.locator('.solunar-detail__hero');
    await expect(hero).not.toBeVisible();
  });
});

test.describe('Solunar Details Screen — data state (location granted)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSolunarWithLocation(page);
  });

  test('renders h1 "Solunar Table"', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /solunar table/i })).toBeVisible();
  });

  test('does not show state card when location is granted', async ({ page }) => {
    await expect(page.locator('.solunar-detail__state-card')).not.toBeVisible();
  });

  test('renders rating stars element', async ({ page }) => {
    const stars = page.locator('.solunar-detail__rating-stars');
    await expect(stars).toBeVisible();
    const text = await stars.textContent();
    // Rating stars are ★ and ☆ characters
    expect(text).toMatch(/[★☆]/);
  });

  test('renders score bar with meter role', async ({ page }) => {
    const meter = page.locator('[role="meter"]').first();
    await expect(meter).toBeVisible();
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
    const valueNow = await meter.getAttribute('aria-valuenow');
    expect(Number(valueNow)).toBeGreaterThanOrEqual(0);
    expect(Number(valueNow)).toBeLessThanOrEqual(100);
  });
});

test.describe('Solunar Details Screen — stats grid', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSolunarWithLocation(page);
  });

  test('renders exactly 4 stat cells', async ({ page }) => {
    const stats = page.locator('.solunar-detail__stat');
    await expect(stats).toHaveCount(4);
  });

  test('shows "Rating" label', async ({ page }) => {
    await expect(page.getByText('Rating', { exact: true })).toBeVisible();
  });

  test('shows "Score" label', async ({ page }) => {
    await expect(page.getByText('Score', { exact: true })).toBeVisible();
  });

  test('shows "Moon Overhead" label', async ({ page }) => {
    await expect(page.getByText('Moon Overhead', { exact: true })).toBeVisible();
  });

  test('shows "Moon Underfoot" label', async ({ page }) => {
    await expect(page.getByText('Moon Underfoot', { exact: true })).toBeVisible();
  });

  test('transit times are in HH:MM UTC format', async ({ page }) => {
    const statValues = page.locator('.solunar-detail__stat-value--time');
    await expect(statValues).toHaveCount(2);
    const texts = await statValues.allTextContents();
    texts.forEach(t => {
      expect(t.trim()).toMatch(/^\d{2}:\d{2} UTC$/);
    });
  });
});

test.describe('Solunar Details Screen — periods list', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSolunarWithLocation(page);
  });

  test('renders solunar periods', async ({ page }) => {
    const periods = page.locator('.solunar-detail__period');
    const count = await periods.count();
    expect(count).toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(4);
  });

  test('each period shows MAJOR or MINOR type label', async ({ page }) => {
    const types = page.locator('.solunar-detail__period-type');
    const count = await types.count();
    for (let i = 0; i < count; i++) {
      const text = await types.nth(i).textContent();
      expect(text?.trim()).toMatch(/^(MAJOR|MINOR)$/);
    }
  });

  test('each period shows a time range', async ({ page }) => {
    const times = page.locator('.solunar-detail__period-time');
    const count = await times.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await times.nth(i).textContent();
      expect(text).toMatch(/\d{2}:\d{2} UTC/);
    }
  });

  test('periods list has accessible role and label', async ({ page }) => {
    const list = page.locator('[role="list"][aria-label="Solunar periods"]');
    await expect(list).toBeVisible();
  });
});

test.describe('Solunar Details Screen — advice section', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSolunarWithLocation(page);
  });

  test('renders "Fishing Conditions" section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /fishing conditions/i })).toBeVisible();
  });

  test('renders non-empty advice text', async ({ page }) => {
    const advice = page.locator('.solunar-detail__advice');
    await expect(advice).toBeVisible();
    const text = await advice.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Solunar Details Screen — 7-day forecast', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSolunarWithLocation(page);
  });

  test('renders "7-Day Solunar Forecast" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /7-day solunar forecast/i })).toBeVisible();
  });

  test('renders exactly 7 forecast cards', async ({ page }) => {
    const cards = page.locator('.solunar-detail__forecast-card');
    await expect(cards).toHaveCount(7);
  });

  test('today forecast card has aria-current="date"', async ({ page }) => {
    const todayCard = page.locator('.solunar-detail__forecast-card--today');
    await expect(todayCard).toBeVisible();
    await expect(todayCard).toHaveAttribute('aria-current', 'date');
  });

  test('non-today forecast cards do not have aria-current', async ({ page }) => {
    const cards = page.locator('.solunar-detail__forecast-card');
    const count = await cards.count();
    for (let i = 1; i < count; i++) {
      await expect(cards.nth(i)).not.toHaveAttribute('aria-current', 'date');
    }
  });

  test('each forecast card shows a date', async ({ page }) => {
    const dates = page.locator('.solunar-detail__forecast-date');
    await expect(dates).toHaveCount(7);
  });

  test('each forecast card shows rating stars', async ({ page }) => {
    const ratings = page.locator('.solunar-detail__forecast-rating');
    await expect(ratings).toHaveCount(7);
    const texts = await ratings.allTextContents();
    texts.forEach(t => {
      expect(t.trim()).toMatch(/[★☆]/);
    });
  });

  test('each forecast card shows a score', async ({ page }) => {
    const scores = page.locator('.solunar-detail__forecast-score');
    await expect(scores).toHaveCount(7);
    const texts = await scores.allTextContents();
    texts.forEach(t => {
      const n = Number(t.trim());
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    });
  });

  test('forecast list has aria-label', async ({ page }) => {
    const list = page.locator('ol[aria-label="7-day solunar forecast"]');
    await expect(list).toBeVisible();
  });
});

test.describe('Solunar Details Screen — accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSolunarWithLocation(page);
  });

  test('page has a main landmark', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('back link has accessible aria-label', async ({ page }) => {
    const link = page.locator('.solunar-detail__back-link');
    await expect(link).toHaveAttribute('aria-label', /back to home/i);
  });

  test('score bar has meter role with aria attributes', async ({ page }) => {
    const meter = page.locator('[role="meter"]').first();
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
    await expect(meter).toHaveAttribute('aria-valuenow');
  });
});

test.describe('Solunar Details Screen — responsive layout', () => {
  test('mobile: forecast list has horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateToSolunarWithLocation(page);
    const list = page.locator('.solunar-detail__forecast-list');
    const overflowX = await list.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });

  test('tablet: forecast list is visible without scroll', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToSolunarWithLocation(page);
    const cards = page.locator('.solunar-detail__forecast-card');
    await expect(cards).toHaveCount(7);
  });
});
