import { test, expect } from '@playwright/test';

test.describe('Responsive Design — Feature 07', () => {
  // ── Card fills grid cell ─────────────────────────────────────────────────────

  test('moon card fills its grid cell at tablet viewport (2-col layout)', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/');

    const cell = page.locator('.home__data-grid-cell').first();
    const card = page.locator('.moon-phase-card');

    const cellBB = await cell.boundingBox();
    const cardBB = await card.boundingBox();

    expect(cellBB).not.toBeNull();
    expect(cardBB).not.toBeNull();
    // Card must fill the cell width (within 1px rounding tolerance)
    expect(Math.abs(cardBB!.width - cellBB!.width)).toBeLessThanOrEqual(1);
  });

  test('solunar card fills its grid cell at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/');

    const cells = page.locator('.home__data-grid-cell');
    const cell = cells.nth(1);
    const card = page.locator('.solunar-card');

    const cellBB = await cell.boundingBox();
    const cardBB = await card.boundingBox();

    expect(cellBB).not.toBeNull();
    expect(cardBB).not.toBeNull();
    expect(Math.abs(cardBB!.width - cellBB!.width)).toBeLessThanOrEqual(1);
  });

  test('weather card fills its grid cell at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/');

    const cells = page.locator('.home__data-grid-cell');
    const cell = cells.nth(2);
    const card = page.locator('.weather-card');

    const cellBB = await cell.boundingBox();
    const cardBB = await card.boundingBox();

    expect(cellBB).not.toBeNull();
    expect(cardBB).not.toBeNull();
    expect(Math.abs(cardBB!.width - cellBB!.width)).toBeLessThanOrEqual(1);
  });

  // ── No double-spacing ────────────────────────────────────────────────────────

  test('data cards have no extra vertical margin causing double-spacing at mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const moonCard = page.locator('.moon-phase-card');
    const solunarCard = page.locator('.solunar-card');

    const moonBB = await moonCard.boundingBox();
    const solunarBB = await solunarCard.boundingBox();

    expect(moonBB).not.toBeNull();
    expect(solunarBB).not.toBeNull();

    // The gap between moon card bottom and solunar card top should be ≤ $space-lg (24px).
    // Before the fix, card margins (32px each) stack onto the grid gap making it ~88px.
    const gap = solunarBB!.y - (moonBB!.y + moonBB!.height);
    expect(gap).toBeLessThanOrEqual(30); // allow a few px for rounding
  });

  // ── Location bar fills content width ─────────────────────────────────────────

  test('location display fills the full home container width on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Compare to the wrapper div, not the padded .home root
    const locationWrapper = page.locator('.home__location');
    const locationDisplay = page.locator('.location-display');

    const wrapperBB = await locationWrapper.boundingBox();
    const locationBB = await locationDisplay.boundingBox();

    expect(wrapperBB).not.toBeNull();
    expect(locationBB).not.toBeNull();
    // Location display must fill its wrapper cell (width: 100%)
    expect(Math.abs(locationBB!.width - wrapperBB!.width)).toBeLessThanOrEqual(2);
  });

  // ── Single column on narrow mobile ──────────────────────────────────────────

  test('data grid stacks to single column on 360px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');

    const cells = page.locator('.home__data-grid-cell');
    await expect(cells).toHaveCount(3);

    const cell0BB = await cells.nth(0).boundingBox();
    const cell1BB = await cells.nth(1).boundingBox();
    const cell2BB = await cells.nth(2).boundingBox();

    expect(cell0BB).not.toBeNull();
    expect(cell1BB).not.toBeNull();
    expect(cell2BB).not.toBeNull();

    // All cells have the same x position (single column — they stack vertically)
    expect(Math.abs(cell0BB!.x - cell1BB!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(cell1BB!.x - cell2BB!.x)).toBeLessThanOrEqual(1);

    // Each cell is below the previous one
    expect(cell1BB!.y).toBeGreaterThan(cell0BB!.y);
    expect(cell2BB!.y).toBeGreaterThan(cell1BB!.y);
  });

  test('no card overflows the viewport horizontally on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const moonBB = await page.locator('.moon-phase-card').boundingBox();
    const solunarBB = await page.locator('.solunar-card').boundingBox();
    const weatherBB = await page.locator('.weather-card').boundingBox();

    expect(moonBB).not.toBeNull();
    expect(solunarBB).not.toBeNull();
    expect(weatherBB).not.toBeNull();

    // Right edge of each card must be within the 375px viewport
    expect(moonBB!.x + moonBB!.width).toBeLessThanOrEqual(376);
    expect(solunarBB!.x + solunarBB!.width).toBeLessThanOrEqual(376);
    expect(weatherBB!.x + weatherBB!.width).toBeLessThanOrEqual(376);
  });

  // ── Touch target size ────────────────────────────────────────────────────────

  test('location display primary button has touch target of at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // The primary CTA in the location display — "Share My Location" or retry button
    const btn = page.locator('.location-display__btn').first();
    const isVisible = await btn.isVisible();
    if (!isVisible) return; // button only shown in certain states

    const bb = await btn.boundingBox();
    expect(bb).not.toBeNull();
    expect(bb!.height).toBeGreaterThanOrEqual(44);
    expect(bb!.width).toBeGreaterThanOrEqual(44);
  });
});
