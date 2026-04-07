import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const SETTINGS_KEY = 'moonbite_settings';

const DEFAULT_SETTINGS = {
  unitSystem: 'metric',
  timeFormat: '12h',
};

const TEST_LOCATION = {
  id: 'e2e-settings-1',
  name: 'Lake Tahoe',
  latitude: 39.0968,
  longitude: -120.0324,
  createdAt: '2025-01-01T00:00:00.000Z',
};

async function seedSettings(page: Page, settings: object) {
  await page.addInitScript(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: SETTINGS_KEY, data: settings },
  );
}

async function seedLocations(page: Page, locations: object[]) {
  await page.addInitScript(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: 'moonbite_saved_locations', data: locations },
  );
}

// ─── 1. Settings tab in bottom nav ────────────────────────────────────────────
test.describe('Settings — Bottom nav tab', () => {
  test('Settings tab is visible in bottom nav', async ({ page }) => {
    await page.goto('/');
    const settingsTab = page.locator('.bottom-nav__tab-link', { hasText: 'Settings' });
    await expect(settingsTab).toBeVisible();
  });

  test('bottom nav has 5 tabs including Settings', async ({ page }) => {
    await page.goto('/');
    const tabs = page.locator('.bottom-nav__tab-link');
    await expect(tabs).toHaveCount(5);
  });
});

// ─── 2. Navigate to /settings via Settings tab ────────────────────────────────
test.describe('Settings — Navigation', () => {
  test('tapping Settings tab navigates to /settings', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bottom-nav__tab-link', { hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('direct navigation to /settings works', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('Settings tab is active on /settings route', async ({ page }) => {
    await page.goto('/settings');
    const settingsTab = page.locator('.bottom-nav__tab-link', { hasText: 'Settings' });
    await expect(settingsTab).toHaveClass(/bottom-nav__tab--active/);
  });

  test('Settings tab has aria-current="page" on /settings', async ({ page }) => {
    await page.goto('/settings');
    const settingsTab = page.locator('.bottom-nav__tab-link', { hasText: 'Settings' });
    await expect(settingsTab).toHaveAttribute('aria-current', 'page');
  });

  test('navigate from Home to /settings and back — Home tab active on return', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bottom-nav__tab-link', { hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await page.locator('.bottom-nav__tab-link', { hasText: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
    const homeTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    await expect(homeTab).toHaveClass(/bottom-nav__tab--active/);
  });
});

// ─── 3. Settings page heading ─────────────────────────────────────────────────
test.describe('Settings — Page heading', () => {
  test('Settings page heading is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('bottom nav is visible on /settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('nav.bottom-nav')).toBeVisible();
  });
});

// ─── 4. Units section ─────────────────────────────────────────────────────────
test.describe('Settings — Units section', () => {
  test('UNITS section heading is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('UNITS')).toBeVisible();
  });

  test('Metric button is visible in unit segmented control', async ({ page }) => {
    await page.goto('/settings');
    const metricBtn = page.getByRole('button', { name: 'Metric' });
    await expect(metricBtn).toBeVisible();
  });

  test('Imperial button is visible in unit segmented control', async ({ page }) => {
    await page.goto('/settings');
    const imperialBtn = page.getByRole('button', { name: 'Imperial' });
    await expect(imperialBtn).toBeVisible();
  });

  test('Metric button has aria-pressed attribute', async ({ page }) => {
    await page.goto('/settings');
    const metricBtn = page.getByRole('button', { name: 'Metric' });
    const ariaPressed = await metricBtn.getAttribute('aria-pressed');
    expect(ariaPressed === 'true' || ariaPressed === 'false').toBe(true);
  });

  test('Imperial button has aria-pressed attribute', async ({ page }) => {
    await page.goto('/settings');
    const imperialBtn = page.getByRole('button', { name: 'Imperial' });
    const ariaPressed = await imperialBtn.getAttribute('aria-pressed');
    expect(ariaPressed === 'true' || ariaPressed === 'false').toBe(true);
  });

  test('Metric is selected by default (aria-pressed="true")', async ({ page }) => {
    await page.goto('/settings');
    const metricBtn = page.getByRole('button', { name: 'Metric' });
    await expect(metricBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('Imperial is not selected by default (aria-pressed="false")', async ({ page }) => {
    await page.goto('/settings');
    const imperialBtn = page.getByRole('button', { name: 'Imperial' });
    await expect(imperialBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking Imperial sets Imperial aria-pressed="true"', async ({ page }) => {
    await page.goto('/settings');
    const imperialBtn = page.getByRole('button', { name: 'Imperial' });
    await imperialBtn.click();
    await expect(imperialBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking Imperial sets Metric aria-pressed="false"', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Imperial' }).click();
    const metricBtn = page.getByRole('button', { name: 'Metric' });
    await expect(metricBtn).toHaveAttribute('aria-pressed', 'false');
  });
});

// ─── 5. Display section — Time Format toggle ──────────────────────────────────
test.describe('Settings — Display section', () => {
  test('DISPLAY section heading is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('DISPLAY')).toBeVisible();
  });

  test('Time Format label is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Time Format')).toBeVisible();
  });

  test('Time Format control has role="switch"', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: /time format/i });
    await expect(toggle).toBeVisible();
  });

  test('Time Format switch has aria-checked attribute', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: /time format/i });
    const ariaChecked = await toggle.getAttribute('aria-checked');
    expect(ariaChecked === 'true' || ariaChecked === 'false').toBe(true);
  });

  test('clicking Time Format switch toggles aria-checked', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: /time format/i });
    const initialChecked = await toggle.getAttribute('aria-checked');
    await toggle.click();
    const newChecked = await toggle.getAttribute('aria-checked');
    expect(newChecked).not.toBe(initialChecked);
  });
});

// ─── 6. Saved Locations section ───────────────────────────────────────────────
test.describe('Settings — Saved Locations section', () => {
  test('SAVED LOCATIONS section heading is visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('SAVED LOCATIONS')).toBeVisible();
  });

  test('shows empty state when no saved locations', async ({ page }) => {
    await page.goto('/settings');
    // Either an empty-state message or an empty list — the section itself must be present
    const section = page.locator('[data-testid="settings-saved-locations"]');
    await expect(section).toBeVisible();
  });

  test('shows location rows when saved locations exist', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
    await page.goto('/settings');
    await expect(page.getByText('Lake Tahoe')).toBeVisible();
  });

  test('shows rename (pencil) button for each location', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
    await page.goto('/settings');
    const renameBtn = page.locator('[data-testid="rename-btn"]').first();
    await expect(renameBtn).toBeVisible();
  });
});

// ─── 7. Rename inline edit flow ───────────────────────────────────────────────
test.describe('Settings — Rename location', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
  });

  test('tapping rename button shows an inline text input', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    const input = page.locator('[data-testid="rename-input"]').first();
    await expect(input).toBeVisible();
  });

  test('rename input is pre-filled with the current location name', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    const input = page.locator('[data-testid="rename-input"]').first();
    await expect(input).toHaveValue('Lake Tahoe');
  });

  test('confirm button is visible during inline rename', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    await expect(page.locator('[data-testid="rename-confirm-btn"]').first()).toBeVisible();
  });

  test('cancel button is visible during inline rename', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    await expect(page.locator('[data-testid="rename-cancel-btn"]').first()).toBeVisible();
  });

  test('confirming rename updates the location name in the list', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    const input = page.locator('[data-testid="rename-input"]').first();
    await input.fill('My Favorite Spot');
    await page.locator('[data-testid="rename-confirm-btn"]').first().click();
    await expect(page.getByText('My Favorite Spot')).toBeVisible();
  });

  test('cancelling rename leaves the original name unchanged', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    const input = page.locator('[data-testid="rename-input"]').first();
    await input.fill('Something Else');
    await page.locator('[data-testid="rename-cancel-btn"]').first().click();
    await expect(page.getByText('Lake Tahoe')).toBeVisible();
  });
});

// ─── 8. Persistence across reloads ───────────────────────────────────────────
test.describe('Settings — Persistence', () => {
  test('Imperial selection persists after page reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Imperial' }).click();
    await expect(page.getByRole('button', { name: 'Imperial' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Imperial' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('Metric selection persists after page reload (default)', async ({ page }) => {
    await page.goto('/settings');
    // Ensure Metric is set (default)
    await page.getByRole('button', { name: 'Metric' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Metric' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('Time Format toggle state persists after page reload', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: /time format/i });
    const initialChecked = await toggle.getAttribute('aria-checked');
    await toggle.click();
    const changedChecked = await toggle.getAttribute('aria-checked');
    await page.reload();
    const reloadedChecked = await page.getByRole('switch', { name: /time format/i }).getAttribute('aria-checked');
    expect(reloadedChecked).toBe(changedChecked);
    expect(reloadedChecked).not.toBe(initialChecked);
  });

  test('renamed location name persists after page reload', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
    await page.goto('/settings');
    await page.locator('[data-testid="rename-btn"]').first().click();
    await page.locator('[data-testid="rename-input"]').first().fill('Persisted Name');
    await page.locator('[data-testid="rename-confirm-btn"]').first().click();
    await page.reload();
    await expect(page.getByText('Persisted Name')).toBeVisible();
  });

  test('pre-seeded Imperial setting loads correctly from localStorage', async ({ page }) => {
    await seedSettings(page, { ...DEFAULT_SETTINGS, unitSystem: 'imperial' });
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: 'Imperial' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Metric' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

// ─── 9. Integration tests (skipped — require real GPS + weather API) ──────────
test.describe('Settings — Integration (skipped)', () => {
  // These tests require a real GPS location fix and a live weather API response.
  // They cannot run reliably in CI without network mocking of the entire data pipeline.
  // They should be promoted to integration/contract tests when API mocking is set up.

  test.skip('switching to Imperial shows °F on weather screen', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Imperial' }).click();
    await page.locator('.bottom-nav__tab-link', { hasText: 'Weather' }).click();
    await expect(page.getByText('°F')).toBeVisible();
    await expect(page.getByText('mph')).toBeVisible();
    await expect(page.getByText('inHg')).toBeVisible();
  });

  test.skip('switching to Metric shows °C on weather screen', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Metric' }).click();
    await page.locator('.bottom-nav__tab-link', { hasText: 'Weather' }).click();
    await expect(page.getByText('°C')).toBeVisible();
    await expect(page.getByText('km/h')).toBeVisible();
    await expect(page.getByText('hPa')).toBeVisible();
  });

  test.skip('enabling 24h time format shows HH:MM on solunar screen', async ({ page }) => {
    // Requires real solunar data to be loaded. The 24h check would look for
    // times in the pattern /\b([01]\d|2[0-3]):[0-5]\d\b/ without AM/PM suffix.
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: /time format/i });
    // Assume off = 12h; click once to enable 24h
    await toggle.click();
    await page.locator('.bottom-nav__tab-link', { hasText: 'Solunar' }).click();
    const timeText = await page.locator('[data-testid="peak-time"]').first().textContent();
    expect(timeText).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
  });
});

// ─── 10. Accessibility ────────────────────────────────────────────────────────
test.describe('Settings — Accessibility', () => {
  test('unit control buttons meet minimum touch target size (44x44px)', async ({ page }) => {
    await page.goto('/settings');
    const metricBtn = page.getByRole('button', { name: 'Metric' });
    const box = await metricBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });

  test('Time Format switch meets minimum touch target size (44x44px)', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: /time format/i });
    const box = await toggle.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });

  test('rename button has an aria-label describing the location', async ({ page }) => {
    await seedLocations(page, [TEST_LOCATION]);
    await page.goto('/settings');
    const renameBtn = page.locator('[data-testid="rename-btn"]').first();
    const label = await renameBtn.getAttribute('aria-label');
    expect(label).toContain('Lake Tahoe');
  });
});
