import { test, expect } from '@playwright/test';

test.describe('Home Screen — Feature 06', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders app brand in the header', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('banner')).toContainText('MoonBite');
  });

  test('renders app tagline in the header', async ({ page }) => {
    await expect(page.getByRole('banner')).toContainText('fishing intelligence');
  });

  test("renders today's date in the header", async ({ page }) => {
    const today = new Date();
    // Match the year at minimum — robust across midnight boundaries
    await expect(page.getByRole('banner')).toContainText(String(today.getFullYear()));
  });

  test('renders all five data panels', async ({ page }) => {
    // Fishing score
    await expect(page.getByRole('region', { name: /fishing score/i })).toBeVisible();
    // Location
    await expect(page.getByRole('region', { name: /location/i })).toBeVisible();
    // Moon phase
    await expect(page.getByRole('region', { name: /moon phase/i })).toBeVisible();
    // Solunar
    await expect(page.getByRole('region', { name: /solunar/i })).toBeVisible();
    // Weather
    await expect(page.getByRole('region', { name: /weather/i })).toBeVisible();
  });

  test('fishing score panel appears before location panel in the page', async ({ page }) => {
    const scoreRegion = page.getByRole('region', { name: /fishing score/i });
    const locationRegion = page.getByRole('region', { name: /location/i });

    const scoreBB = await scoreRegion.boundingBox();
    const locationBB = await locationRegion.boundingBox();

    expect(scoreBB).not.toBeNull();
    expect(locationBB).not.toBeNull();
    expect(scoreBB!.y).toBeLessThan(locationBB!.y);
  });

  test('location panel appears before data cards', async ({ page }) => {
    const locationRegion = page.getByRole('region', { name: /location/i });
    const moonRegion = page.getByRole('region', { name: /moon phase/i });

    const locationBB = await locationRegion.boundingBox();
    const moonBB = await moonRegion.boundingBox();

    expect(locationBB).not.toBeNull();
    expect(moonBB).not.toBeNull();
    expect(locationBB!.y).toBeLessThan(moonBB!.y);
  });

  test('page has correct document title', async ({ page }) => {
    await expect(page).toHaveTitle(/MoonBite/);
  });

  test('default route "/" renders home content', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('region', { name: /fishing score/i })).toBeVisible();
  });
});
