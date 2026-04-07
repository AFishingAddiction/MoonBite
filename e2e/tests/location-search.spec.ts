import { test, expect } from '@playwright/test';

test.describe('Feature 18 — Location Search & Library', () => {
  test.beforeEach(async ({ page }) => {
    // Grant geolocation and navigate to the locations page
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    await page.goto('/locations');
  });

  test('should show the search input on the locations page', async ({ page }) => {
    const input = page.getByTestId('location-search-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /lake tahoe|e\.g\./i);
  });

  test('should show a clear button when search query is entered', async ({ page }) => {
    const input = page.getByTestId('location-search-input');
    await input.fill('Lake');
    await expect(page.getByTestId('search-clear-btn')).toBeVisible();
  });

  test('should clear the search when clear button is clicked', async ({ page }) => {
    const input = page.getByTestId('location-search-input');
    await input.fill('Lake Tahoe');
    await page.getByTestId('search-clear-btn').click();
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('search-clear-btn')).not.toBeVisible();
  });

  test('should show loading state while searching', async ({ page }) => {
    // Intercept to delay the response
    await page.route('**/nominatim.openstreetmap.org/**', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ json: [] });
    });

    const input = page.getByTestId('location-search-input');
    await input.fill('Lake Tahoe');

    await expect(page.getByTestId('search-loading')).toBeVisible();
  });

  test('should show no-results state for an unknown place', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({ json: [] }),
    );

    const input = page.getByTestId('location-search-input');
    await input.fill('Atlantis');
    await page.waitForTimeout(400); // past debounce

    await expect(page.getByTestId('search-no-results')).toBeVisible();
    await expect(page.getByTestId('search-no-results')).toContainText('Atlantis');
  });

  test('should show results list when API returns matches', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: [
          {
            place_id: 1,
            lat: '39.0968',
            lon: '-120.0324',
            display_name: 'Lake Tahoe, California, United States',
            address: { lake: 'Lake Tahoe', state: 'California', country: 'United States', country_code: 'us' },
          },
          {
            place_id: 2,
            lat: '39.185',
            lon: '-119.767',
            display_name: 'Lake Tahoe, Nevada, United States',
            address: { lake: 'Lake Tahoe', state: 'Nevada', country: 'United States', country_code: 'us' },
          },
        ],
      }),
    );

    const input = page.getByTestId('location-search-input');
    await input.fill('Lake Tahoe');
    await page.waitForTimeout(400);

    const results = page.getByTestId('search-result-item');
    await expect(results).toHaveCount(2);
    await expect(results.first()).toContainText('Lake Tahoe');
    await expect(results.first()).toContainText('39.0968');
  });

  test('should open confirmation panel when Add is clicked', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: [
          {
            place_id: 1,
            lat: '39.0968',
            lon: '-120.0324',
            display_name: 'Lake Tahoe, California, United States',
            address: { lake: 'Lake Tahoe', state: 'California', country: 'United States', country_code: 'us' },
          },
        ],
      }),
    );

    await page.getByTestId('location-search-input').fill('Lake Tahoe');
    await page.waitForTimeout(400);

    await page.getByTestId('search-add-btn').first().click();
    await expect(page.getByTestId('search-confirm-panel')).toBeVisible();
    await expect(page.getByTestId('confirm-name-input')).toHaveValue(
      'Lake Tahoe, California, United States',
    );
  });

  test('should add location to saved list after confirming', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: [
          {
            place_id: 1,
            lat: '39.0968',
            lon: '-120.0324',
            display_name: 'Lake Tahoe, California, United States',
            address: { lake: 'Lake Tahoe', state: 'California', country: 'United States', country_code: 'us' },
          },
        ],
      }),
    );

    await page.getByTestId('location-search-input').fill('Lake Tahoe');
    await page.waitForTimeout(400);
    await page.getByTestId('search-add-btn').first().click();
    await page.getByTestId('confirm-search-add-btn').click();

    // Confirmation panel should close and search should clear
    await expect(page.getByTestId('search-confirm-panel')).not.toBeVisible();
    await expect(page.getByTestId('location-search-input')).toHaveValue('');

    // Saved location should appear in list
    await expect(page.getByTestId('locations-list')).toBeVisible();
    const items = page.getByTestId('location-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Lake Tahoe, California, United States');
  });

  test('should allow renaming before saving', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: [
          {
            place_id: 1,
            lat: '39.0968',
            lon: '-120.0324',
            display_name: 'Lake Tahoe, California, United States',
            address: { lake: 'Lake Tahoe', state: 'California', country: 'United States', country_code: 'us' },
          },
        ],
      }),
    );

    await page.getByTestId('location-search-input').fill('Lake Tahoe');
    await page.waitForTimeout(400);
    await page.getByTestId('search-add-btn').first().click();

    const nameInput = page.getByTestId('confirm-name-input');
    await nameInput.fill('');
    await nameInput.fill('My Favourite Lake');
    await page.getByTestId('confirm-search-add-btn').click();

    const items = page.getByTestId('location-item');
    await expect(items.first()).toContainText('My Favourite Lake');
  });

  test('should cancel confirmation without saving', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: [
          {
            place_id: 1,
            lat: '39.0968',
            lon: '-120.0324',
            display_name: 'Lake Tahoe, California, United States',
            address: {},
          },
        ],
      }),
    );

    await page.getByTestId('location-search-input').fill('Lake Tahoe');
    await page.waitForTimeout(400);
    await page.getByTestId('search-add-btn').first().click();
    await page.getByTestId('cancel-search-add-btn').click();

    await expect(page.getByTestId('search-confirm-panel')).not.toBeVisible();
    await expect(page.getByTestId('locations-list')).not.toBeVisible();
  });

  test('should show retry button on network error', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.abort('failed'),
    );

    await page.getByTestId('location-search-input').fill('Lake Tahoe');
    await page.waitForTimeout(400);

    await expect(page.getByTestId('search-error')).toBeVisible();
    await expect(page.getByTestId('search-retry-btn')).toBeVisible();
  });

  test('should preserve saved locations list while searching', async ({ page }) => {
    // Pre-seed a saved location in localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'moonbite_saved_locations',
        JSON.stringify([
          { id: 'abc', name: 'Home Waters', latitude: 40.7128, longitude: -74.006, createdAt: '2025-01-01T00:00:00.000Z' },
        ]),
      );
    });
    await page.reload();

    await page.route('**/nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: [
          {
            place_id: 1,
            lat: '39.0968',
            lon: '-120.0324',
            display_name: 'Lake Tahoe, California, United States',
            address: {},
          },
        ],
      }),
    );

    await page.getByTestId('location-search-input').fill('Lake Tahoe');
    await page.waitForTimeout(400);

    // Search results visible
    await expect(page.getByTestId('search-results-list')).toBeVisible();
    // Saved locations still visible
    await expect(page.getByTestId('locations-list')).toBeVisible();
    await expect(page.getByTestId('locations-list')).toContainText('Home Waters');
  });
});
