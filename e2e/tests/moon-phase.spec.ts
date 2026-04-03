import { test, expect } from '@playwright/test';

const MOON_PHASE_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

const MOON_PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

test.describe('Feature 02 — Moon Phase Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('moon phase card is visible on page load', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    await expect(card).toBeVisible();
  });

  test('moon phase component element is present in the DOM', async ({ page }) => {
    await expect(page.locator('app-moon-phase-display')).toBeVisible();
  });

  test('moon emoji is displayed in an aria-hidden span', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    const emojiSpan = card.locator('span[aria-hidden="true"]').first();
    await expect(emojiSpan).toBeVisible();

    const text = await emojiSpan.textContent();
    const isValidEmoji = MOON_PHASE_EMOJIS.some((emoji) => text?.includes(emoji));
    expect(isValidEmoji, `Expected one of ${MOON_PHASE_EMOJIS.join(' ')} but got "${text}"`).toBe(
      true,
    );
  });

  test('phase name is displayed', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });

    // At least one of the eight canonical phase names must be visible inside the card.
    const visiblePhaseNames = await Promise.all(
      MOON_PHASE_NAMES.map((name) => card.getByText(name).isVisible().catch(() => false)),
    );

    const anyVisible = visiblePhaseNames.some(Boolean);
    expect(
      anyVisible,
      `Expected one of [${MOON_PHASE_NAMES.join(', ')}] to be visible in the moon phase card`,
    ).toBe(true);
  });

  test('illumination percentage is displayed near the ILLUMINATED label', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });

    // The stat block carries an aria-label such as "Illumination: 72 percent"
    const illuminationStat = card.locator('[aria-label*="Illumination"]');
    await expect(illuminationStat).toBeVisible();

    // A percentage value in the form "72%" must be visible within that stat block
    const percentValue = illuminationStat.locator('text=/\\d+%/');
    await expect(percentValue).toBeVisible();
  });

  test('ILLUMINATED label text is visible', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    // The spec renders the label as "ILLUMINATED" (uppercase, aria-hidden)
    await expect(card.getByText(/illuminated/i)).toBeVisible();
  });

  test('lunar cycle day is displayed near the LUNAR CYCLE label', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });

    // The stat block carries an aria-label such as "Lunar cycle: Day 9"
    const lunarCycleStat = card.locator('[aria-label*="Lunar cycle"]');
    await expect(lunarCycleStat).toBeVisible();

    // A "Day N" value must be visible within that stat block
    const dayValue = lunarCycleStat.locator('text=/Day \\d+/');
    await expect(dayValue).toBeVisible();
  });

  test('LUNAR CYCLE label text is visible', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    // The spec renders the label as "LUNAR CYCLE" (uppercase, aria-hidden)
    await expect(card.getByText(/lunar cycle/i)).toBeVisible();
  });

  test('score bar is accessible with role="meter"', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    const meter = card.getByRole('meter');
    await expect(meter).toBeVisible();
  });

  test('score bar aria-valuenow is between 0 and 100', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    const meter = card.getByRole('meter');
    await expect(meter).toBeVisible();

    const valueNowRaw = await meter.getAttribute('aria-valuenow');
    expect(valueNowRaw, 'aria-valuenow attribute must be present on the meter element').not.toBeNull();

    const valueNow = Number(valueNowRaw);
    expect(Number.isInteger(valueNow), `aria-valuenow "${valueNowRaw}" should be an integer`).toBe(
      true,
    );
    expect(valueNow).toBeGreaterThanOrEqual(0);
    expect(valueNow).toBeLessThanOrEqual(100);
  });

  test('score bar has correct aria-valuemin and aria-valuemax', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    const meter = card.getByRole('meter');

    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  test('score badge displays a numeric value between 0 and 100', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    const badge = card.locator('.moon-phase-card__score-badge');
    await expect(badge).toBeVisible();

    const badgeText = await badge.textContent();
    const score = Number(badgeText?.trim());
    expect(Number.isInteger(score), `Score badge text "${badgeText}" should be an integer`).toBe(
      true,
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('score section shows FISHING CONTRIBUTION label', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Moon phase information' });
    await expect(card.getByText(/fishing contribution/i)).toBeVisible();
  });
});
