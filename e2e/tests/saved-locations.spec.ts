import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const LOCATIONS_KEY = 'moonbite_saved_locations';
const ACTIVE_KEY = 'moonbite_active_location_id';

const TEST_LOCATION = {
  id: 'e2e-test-1',
  name: 'Lake Tahoe',
  latitude: 39.0968,
  longitude: -120.0324,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const TEST_LOCATION_2 = {
  id: 'e2e-test-2',
  name: 'Home Waters',
  latitude: 40.7128,
  longitude: -74.006,
  createdAt: '2025-01-02T00:00:00.000Z',
};

async function seedLocations(page: Page, locations: object[], activeId?: string) {
  await page.addInitScript(
    ({ key, data, activeKey, id }) => {
      localStorage.setItem(key, JSON.stringify(data));
      if (id) localStorage.setItem(activeKey, id);
    },
    { key: LOCATIONS_KEY, data: locations, activeKey: ACTIVE_KEY, id: activeId ?? '' },
  );
}

// ─── 1. Route & basic render ───────────────────────────────────────────────────
test.describe('Saved Locations — Page render', () => {
  test('navigates to /locations', async ({ page }) => {
    await page.goto('/locations');
    await expect(page).toHaveURL(/\/locations/);
  });

  test('shows page title', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('.locations-page__title')).toBeVisible();
    await expect(page.locator('.locations-page__title')).toContainText('Saved Locations');
  });

  test('shows a back link', async ({ page }) => {
    await page.goto('/locations');
    const back = page.locator('.locations-page__back');
    await expect(back).toBeVisible();
  });

  test('back link navigates to /', async ({ page }) => {
    await page.goto('/locations');
    await page.locator('.locations-page__back').click();
    await expect(page).toHaveURL(/\/$/);
  });
});

// ─── 2. Empty state ────────────────────────────────────────────────────────────
test.describe('Saved Locations — Empty state', () => {
  test('shows empty state message when no saved locations', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('does not show the list when empty', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('[data-testid="locations-list"]')).not.toBeVisible();
  });
});

// ─── 3. With pre-seeded locations ─────────────────────────────────────────────
test.describe('Saved Locations — Location list', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION, TEST_LOCATION_2]);
  });

  test('shows the locations list', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('[data-testid="locations-list"]')).toBeVisible();
  });

  test('renders one item per saved location', async ({ page }) => {
    await page.goto('/locations');
    const items = page.locator('[data-testid="location-item"]');
    await expect(items).toHaveCount(2);
  });

  test('shows location name in each item', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('[data-testid="location-item"]').first()).toContainText('Lake Tahoe');
  });

  test('shows coordinates in each item', async ({ page }) => {
    await page.goto('/locations');
    const item = page.locator('[data-testid="location-item"]').first();
    await expect(item).toContainText('39.0968');
  });

  test('shows activate button for inactive locations', async ({ page }) => {
    await page.goto('/locations');
    const activateBtns = page.locator('[data-testid="activate-btn"]');
    await expect(activateBtns).toHaveCount(2);
  });

  test('shows delete button for each location', async ({ page }) => {
    await page.goto('/locations');
    const deleteBtns = page.locator('[data-testid="delete-btn"]');
    await expect(deleteBtns).toHaveCount(2);
  });

  test('deletes a location when delete is clicked', async ({ page }) => {
    await page.goto('/locations');
    const firstDelete = page.locator('[data-testid="delete-btn"]').first();
    await firstDelete.click();
    const items = page.locator('[data-testid="location-item"]');
    await expect(items).toHaveCount(1);
  });

  test('activating a location shows the active banner', async ({ page }) => {
    await page.goto('/locations');
    const firstActivate = page.locator('[data-testid="activate-btn"]').first();
    await firstActivate.click();
    await expect(page.locator('[data-testid="active-location-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-location-banner"]')).toContainText('Lake Tahoe');
  });

  test('activating a location shows active badge and replaces Use with Use GPS', async ({
    page,
  }) => {
    await page.goto('/locations');
    await page.locator('[data-testid="activate-btn"]').first().click();

    // The activated item should have "Use GPS" instead of "Use"
    const firstItem = page.locator('[data-testid="location-item"]').first();
    await expect(firstItem.locator('[data-testid="use-gps-btn"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="activate-btn"]')).not.toBeVisible();

    // Active badge should be present
    await expect(firstItem.locator('.locations-page__item-active-badge')).toBeVisible();
  });
});

// ─── 4. Active location ────────────────────────────────────────────────────────
test.describe('Saved Locations — Active location', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION, TEST_LOCATION_2], TEST_LOCATION.id);
  });

  test('shows active location banner when a location is pre-seeded as active', async ({
    page,
  }) => {
    await page.goto('/locations');
    const banner = page.locator('[data-testid="active-location-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Lake Tahoe');
  });

  test('"Switch to GPS" in banner clears the active location', async ({ page }) => {
    await page.goto('/locations');
    await page.locator('[data-testid="switch-to-gps-btn"]').click();
    await expect(page.locator('[data-testid="active-location-banner"]')).not.toBeVisible();
  });

  test('clearing active replaces Use GPS with Use on the deactivated item', async ({ page }) => {
    await page.goto('/locations');
    await page.locator('[data-testid="switch-to-gps-btn"]').click();
    const activateBtns = page.locator('[data-testid="activate-btn"]');
    await expect(activateBtns).toHaveCount(2);
  });
});

// ─── 5. Persistence ───────────────────────────────────────────────────────────
test.describe('Saved Locations — Persistence', () => {
  test('saved locations survive page reload', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
    await page.goto('/locations');
    await expect(page.locator('[data-testid="location-item"]')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-testid="location-item"]')).toHaveCount(1);
  });

  test('active location survives page reload', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION], TEST_LOCATION.id);
    await page.goto('/locations');
    await expect(page.locator('[data-testid="active-location-banner"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-testid="active-location-banner"]')).toBeVisible();
  });
});

// ─── 6. Location card link on home screen ─────────────────────────────────────
test.describe('Home Screen — Location card Saved Locations link', () => {
  test('shows "Saved Locations" link in location card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.location-display__manage-link')).toBeVisible();
  });

  test('clicking "Saved Locations" link navigates to /locations', async ({ page }) => {
    await page.goto('/');
    await page.locator('.location-display__manage-link').click();
    await expect(page).toHaveURL(/\/locations/);
  });
});

// ─── 7. Active location shown on home screen ─────────────────────────────────
test.describe('Home Screen — Active saved location display', () => {
  test('shows active saved location name on home screen when one is set', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION], TEST_LOCATION.id);
    await page.goto('/');
    const activeSaved = page.locator('[data-testid="active-saved-location"]');
    await expect(activeSaved).toBeVisible();
    await expect(activeSaved).toContainText('Lake Tahoe');
  });

  test('"Switch to GPS" on home screen clears active location', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION], TEST_LOCATION.id);
    await page.goto('/');
    await page.locator('[data-testid="use-gps-btn"]').click();
    await expect(page.locator('[data-testid="active-saved-location"]')).not.toBeVisible();
  });
});

// ─── 8. /locations on bottom nav ──────────────────────────────────────────────
test.describe('Saved Locations — Bottom nav visibility', () => {
  test('bottom nav is visible on /locations', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('nav.bottom-nav')).toBeVisible();
  });
});

// ─── 9. Accessibility ─────────────────────────────────────────────────────────
test.describe('Saved Locations — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
  });

  test('delete button has descriptive aria-label', async ({ page }) => {
    await page.goto('/locations');
    const deleteBtn = page.locator('[data-testid="delete-btn"]').first();
    const label = await deleteBtn.getAttribute('aria-label');
    expect(label).toContain('Lake Tahoe');
  });

  test('activate button has descriptive aria-label', async ({ page }) => {
    await page.goto('/locations');
    const activateBtn = page.locator('[data-testid="activate-btn"]').first();
    const label = await activateBtn.getAttribute('aria-label');
    expect(label).toContain('Lake Tahoe');
  });

  test('locations list has an accessible label', async ({ page }) => {
    await page.goto('/locations');
    const list = page.locator('[data-testid="locations-list"]');
    const label = await list.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('back link meets minimum touch target size', async ({ page }) => {
    await page.goto('/locations');
    const back = page.locator('.locations-page__back');
    const box = await back.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
