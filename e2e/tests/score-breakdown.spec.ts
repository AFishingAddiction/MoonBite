import { test, expect } from '@playwright/test';

test.describe('Score Breakdown Screen — Navigation', () => {
  test('navigating to /score directly shows the score breakdown page', async ({ page }) => {
    await page.goto('/score');
    const main = page.locator('main.score-detail');
    await expect(main).toBeVisible();
    const backLink = page.locator('a.score-detail__back-link');
    await expect(backLink).toBeVisible();
  });

  test('back link navigates to / and shows home screen', async ({ page }) => {
    await page.goto('/score');
    const backLink = page.locator('a.score-detail__back-link');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('home screen score card is wrapped in a link to /score', async ({ page }) => {
    await page.goto('/');
    const scoreLink = page.locator('a[href="/score"]');
    await expect(scoreLink).toBeVisible();
  });

  test('clicking the home score card navigates to /score', async ({ page }) => {
    await page.goto('/');
    const scoreLink = page.locator('a[href="/score"]');
    await expect(scoreLink).toBeVisible();
    await scoreLink.click();
    await expect(page).toHaveURL(/\/score$/);
  });
});

test.describe('Score Breakdown Screen — Idle State', () => {
  test('shows location prompt when no geolocation granted', async ({ page }) => {
    await page.goto('/score');
    const prompt = page.locator('.score-detail__location-prompt');
    await expect(prompt).toBeVisible();
  });

  test('does not show score number in idle state', async ({ page }) => {
    await page.goto('/score');
    const number = page.locator('.score-detail__number');
    await expect(number).not.toBeVisible();
  });
});

test.describe('Score Breakdown Screen — Hero Section', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/score');
    // Wait for the score to load
    await page.waitForSelector('.score-detail__number', { timeout: 10000 });
  });

  test('shows a heading for the score breakdown page', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('shows the composite score number', async ({ page }) => {
    const number = page.locator('.score-detail__number');
    await expect(number).toBeVisible();
    const text = await number.textContent();
    expect(text?.trim()).toMatch(/\d+/);
  });

  test('shows the tier label', async ({ page }) => {
    const label = page.locator('.score-detail__tier-label');
    await expect(label).toBeVisible();
    const text = await label.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
    expect(text).toMatch(/conditions/i);
  });

  test('score bar with role="meter" is visible', async ({ page }) => {
    const meter = page.locator('[role="meter"]').first();
    await expect(meter).toBeVisible();
  });

  test('composite score bar has aria-valuenow 0–100', async ({ page }) => {
    const meter = page.locator('.score-detail__hero [role="meter"]');
    await expect(meter).toBeVisible();
    const valueNow = await meter.getAttribute('aria-valuenow');
    expect(valueNow).not.toBeNull();
    const n = Number(valueNow);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(100);
  });
});

test.describe('Score Breakdown Screen — Factor Breakdown Section', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/score');
    await page.waitForSelector('.score-detail__factor', { timeout: 10000 });
  });

  test('shows three factor rows', async ({ page }) => {
    const factors = page.locator('.score-detail__factor');
    await expect(factors).toHaveCount(3);
  });

  test('factor section has a heading', async ({ page }) => {
    const heading = page.locator('section[aria-labelledby="factors-heading"] h2');
    await expect(heading).toBeVisible();
  });

  test('moon phase factor links to /moon', async ({ page }) => {
    const moonLink = page.locator('.score-detail__factor a[href="/moon"]');
    await expect(moonLink).toBeVisible();
  });

  test('solunar factor links to /solunar', async ({ page }) => {
    const solunarLink = page.locator('.score-detail__factor a[href="/solunar"]');
    await expect(solunarLink).toBeVisible();
  });

  test('weather factor links to /weather', async ({ page }) => {
    const weatherLink = page.locator('.score-detail__factor a[href="/weather"]');
    await expect(weatherLink).toBeVisible();
  });

  test('each factor row has a score bar with role="meter"', async ({ page }) => {
    const meters = page.locator('.score-detail__factor [role="meter"]');
    await expect(meters).toHaveCount(3);
  });

  test('each factor meter has aria-valuenow set to a number 0–100', async ({ page }) => {
    const meters = page.locator('.score-detail__factor [role="meter"]');
    const count = await meters.count();
    for (let i = 0; i < count; i++) {
      const valueNow = await meters.nth(i).getAttribute('aria-valuenow');
      expect(valueNow).not.toBeNull();
      const n = Number(valueNow);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    }
  });

  test('factor rows show weight percentages', async ({ page }) => {
    const factorsSection = page.locator('section[aria-labelledby="factors-heading"]');
    await expect(factorsSection.getByText(/30%/)).toBeVisible();
    await expect(factorsSection.getByText(/35%/)).toHaveCount(2);
  });
});

test.describe('Score Breakdown Screen — Algorithm & Advice', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/score');
    await page.waitForSelector('.score-detail__algorithm', { timeout: 10000 });
  });

  test('algorithm explanation section is visible', async ({ page }) => {
    const section = page.locator('.score-detail__algorithm');
    await expect(section).toBeVisible();
  });

  test('algorithm section has a heading', async ({ page }) => {
    const section = page.locator('section[aria-labelledby="algorithm-heading"]');
    await expect(section.locator('h2')).toBeVisible();
  });

  test('algorithm explanation contains meaningful text', async ({ page }) => {
    const section = page.locator('.score-detail__algorithm');
    const text = await section.textContent();
    expect(text?.trim().length).toBeGreaterThan(50);
  });

  test('advice section is visible', async ({ page }) => {
    const section = page.locator('.score-detail__advice-section');
    await expect(section).toBeVisible();
  });

  test('advice section has a heading', async ({ page }) => {
    const section = page.locator('section[aria-labelledby="advice-heading"]');
    await expect(section.locator('h2')).toBeVisible();
  });

  test('advice paragraph is non-empty', async ({ page }) => {
    const adviceSection = page.locator('.score-detail__advice-section');
    const para = adviceSection.locator('p').first();
    await expect(para).toBeVisible();
    const text = await para.textContent();
    expect(text?.trim().length).toBeGreaterThanOrEqual(20);
  });
});

test.describe('Score Breakdown Screen — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/score');
  });

  test('page has a single <main> element', async ({ page }) => {
    const mains = page.locator('main');
    await expect(mains).toHaveCount(1);
  });

  test('back link is keyboard focusable', async ({ page }) => {
    await page.keyboard.press('Tab');
    const backLink = page.locator('a.score-detail__back-link');
    await expect(backLink).toBeFocused();
  });
});

test.describe('Score Breakdown Screen — Responsive', () => {
  test('renders without horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/score');
    await expect(page.locator('main.score-detail')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });
});
