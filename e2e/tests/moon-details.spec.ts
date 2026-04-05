import { test, expect } from '@playwright/test';

test.describe('Moon Details Screen — Navigation', () => {
  test('navigating to /moon directly shows the moon details page', async ({ page }) => {
    await page.goto('/moon');
    const heading = page.locator('h1.moon-detail__phase-name');
    await expect(heading).toBeVisible();
    const backLink = page.locator('a.moon-detail__back-link');
    await expect(backLink).toBeVisible();
  });

  test('back link navigates to / and shows home screen', async ({ page }) => {
    await page.goto('/moon');
    const backLink = page.locator('a.moon-detail__back-link');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('moon phase card on home screen is a link to /moon', async ({ page }) => {
    await page.goto('/');
    const moonCard = page.locator('section.moon-phase-card');
    await expect(moonCard).toBeVisible();
    const linkWrapper = page.locator('a[href="/moon"]');
    await expect(linkWrapper).toBeVisible();
    const cardInsideLink = page.locator('a[href="/moon"] section.moon-phase-card');
    await expect(cardInsideLink).toBeVisible();
  });

  test('clicking the home moon card navigates to /moon', async ({ page }) => {
    await page.goto('/');
    const moonCard = page.locator('section.moon-phase-card');
    await expect(moonCard).toBeVisible();
    await moonCard.click();
    await expect(page).toHaveURL(/\/moon$/);
  });
});

test.describe('Moon Details Screen — Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/moon');
    await expect(page.locator('h1.moon-detail__phase-name')).toBeVisible();
  });

  test('moon emoji is visible and has aria-hidden="true"', async ({ page }) => {
    const heroSection = page.locator('section[aria-labelledby="hero-heading"]');
    await expect(heroSection).toBeVisible();
    const emoji = heroSection.locator('span[aria-hidden="true"]').first();
    await expect(emoji).toBeVisible();
    await expect(emoji).toHaveAttribute('aria-hidden', 'true');
  });

  test('phase name h1 is visible and non-empty', async ({ page }) => {
    const heading = page.locator('h1#hero-heading.moon-detail__phase-name');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('illumination percentage is displayed', async ({ page }) => {
    const heroSection = page.locator('section[aria-labelledby="hero-heading"]');
    const illuminationText = heroSection.locator('p').filter({ hasText: '%' });
    await expect(illuminationText).toBeVisible();
  });

  test('score bar with role="meter" is visible in the hero', async ({ page }) => {
    const heroSection = page.locator('section[aria-labelledby="hero-heading"]');
    const scorebar = heroSection.locator('[role="meter"]');
    await expect(scorebar).toBeVisible();
  });

  test('score bar has aria-valuenow attribute set to a number 0–100', async ({ page }) => {
    const scorebar = page.locator('[role="meter"]').first();
    await expect(scorebar).toBeVisible();
    const valueNow = await scorebar.getAttribute('aria-valuenow');
    expect(valueNow).not.toBeNull();
    const numericValue = Number(valueNow);
    expect(numericValue).toBeGreaterThanOrEqual(0);
    expect(numericValue).toBeLessThanOrEqual(100);
  });
});

test.describe('Moon Details Screen — Stats Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/moon');
    await expect(page.locator('section[aria-labelledby="stats-heading"]')).toBeVisible();
  });

  test('stats section contains moon age label', async ({ page }) => {
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]');
    const label = statsSection.getByText(/moon age/i);
    await expect(label).toBeVisible();
  });

  test('stats section contains illuminated label', async ({ page }) => {
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]');
    const label = statsSection.getByText(/illuminated/i);
    await expect(label).toBeVisible();
  });

  test('stats section contains full moon label', async ({ page }) => {
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]');
    const label = statsSection.getByText(/to full|full moon/i);
    await expect(label).toBeVisible();
  });

  test('stats section contains new moon label', async ({ page }) => {
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]');
    const label = statsSection.getByText(/to new|new moon/i);
    await expect(label).toBeVisible();
  });

  test('all stat values are numeric', async ({ page }) => {
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]');
    // Stat cells should contain numeric text values (digits present)
    const statValues = statsSection.locator('[class*="stat"] [class*="value"], [class*="stat__value"]');
    const count = await statValues.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const text = await statValues.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
      expect(text).toMatch(/\d/);
    }
  });
});

test.describe('Moon Details Screen — Fishing Advice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/moon');
    await expect(page.locator('section[aria-labelledby="score-heading"]')).toBeVisible();
  });

  test('score section has a heading visible', async ({ page }) => {
    const scoreSection = page.locator('section[aria-labelledby="score-heading"]');
    const heading = scoreSection.locator('[id="score-heading"]');
    await expect(heading).toBeVisible();
  });

  test('advice paragraph is visible and non-empty', async ({ page }) => {
    const scoreSection = page.locator('section[aria-labelledby="score-heading"]');
    const advice = scoreSection.locator('p').first();
    await expect(advice).toBeVisible();
    const text = await advice.textContent();
    expect(text?.trim().length).toBeGreaterThanOrEqual(10);
  });
});

test.describe('Moon Details Screen — 7-Day Forecast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/moon');
    await expect(page.locator('section[aria-labelledby="forecast-heading"]')).toBeVisible();
  });

  test('forecast section heading is visible', async ({ page }) => {
    const forecastSection = page.locator('section[aria-labelledby="forecast-heading"]');
    const heading = forecastSection.getByText(/7-day lunar forecast|lunar forecast/i);
    await expect(heading).toBeVisible();
  });

  test('forecast list has exactly 7 items', async ({ page }) => {
    const forecastList = page.locator('ol[aria-label="7-day lunar forecast"]');
    await expect(forecastList).toBeVisible();
    const items = forecastList.locator('li');
    await expect(items).toHaveCount(7);
  });

  test('first forecast card shows a moon emoji character', async ({ page }) => {
    const forecastList = page.locator('ol[aria-label="7-day lunar forecast"]');
    const firstItem = forecastList.locator('li').first();
    await expect(firstItem).toBeVisible();
    const text = await firstItem.textContent();
    // Moon phase emojis are in the range U+1F311–U+1F31E
    expect(text).toMatch(/[\u{1F311}-\u{1F31E}]/u);
  });

  test('first forecast card has aria-current="date" attribute', async ({ page }) => {
    const forecastList = page.locator('ol[aria-label="7-day lunar forecast"]');
    const firstItem = forecastList.locator('li').first();
    await expect(firstItem).toHaveAttribute('aria-current', 'date');
  });
});

test.describe('Moon Details Screen — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/moon');
    await expect(page.locator('h1.moon-detail__phase-name')).toBeVisible();
  });

  test('page has a single <main> element', async ({ page }) => {
    const mainElements = page.locator('main');
    await expect(mainElements).toHaveCount(1);
  });

  test('back link is keyboard focusable', async ({ page }) => {
    await page.keyboard.press('Tab');
    const backLink = page.locator('a.moon-detail__back-link');
    await expect(backLink).toBeFocused();
  });

  test('moon emojis have aria-hidden="true"', async ({ page }) => {
    // Check hero emoji
    const heroSection = page.locator('section[aria-labelledby="hero-heading"]');
    const heroEmoji = heroSection.locator('span[aria-hidden="true"]').first();
    await expect(heroEmoji).toHaveAttribute('aria-hidden', 'true');

    // Check first forecast card emoji
    const forecastList = page.locator('ol[aria-label="7-day lunar forecast"]');
    const firstItemEmoji = forecastList.locator('li').first().locator('[aria-hidden="true"]').first();
    await expect(firstItemEmoji).toHaveAttribute('aria-hidden', 'true');
  });

  test('score bar has correct ARIA meter attributes', async ({ page }) => {
    const scorebar = page.locator('[role="meter"]').first();
    await expect(scorebar).toHaveAttribute('role', 'meter');
    await expect(scorebar).toHaveAttribute('aria-valuemin', '0');
    await expect(scorebar).toHaveAttribute('aria-valuemax', '100');
  });
});

test.describe('Moon Details Screen — Responsive', () => {
  test('on mobile viewport page renders without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/moon');
    await expect(page.locator('h1.moon-detail__phase-name')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('on mobile forecast list allows horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/moon');
    const forecastList = page.locator('ol[aria-label="7-day lunar forecast"]');
    await expect(forecastList).toBeVisible();
    const overflowX = await forecastList.evaluate(
      (el) => window.getComputedStyle(el).overflowX,
    );
    expect(['auto', 'scroll']).toContain(overflowX);
  });
});
