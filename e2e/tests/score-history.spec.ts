import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared test data — 5 days of seeded history records
// ---------------------------------------------------------------------------
const SEED_LAT = 37.3382;
const SEED_LNG = -121.8863;
const STORAGE_KEY = `moonbite_history_${SEED_LAT}_${SEED_LNG}`;

const seedRecords = [
  {
    date: '2026-04-07',
    score: 82,
    moonPhase: 'Waxing Gibbous',
    moonEmoji: '🌔',
    factors: { moon: 85, solunar: 78, weather: 84 },
  },
  {
    date: '2026-04-08',
    score: 91,
    moonPhase: 'Full Moon',
    moonEmoji: '🌕',
    factors: { moon: 95, solunar: 88, weather: 90 },
  },
  {
    date: '2026-04-09',
    score: 67,
    moonPhase: 'Waning Gibbous',
    moonEmoji: '🌖',
    factors: { moon: 70, solunar: 60, weather: 72 },
  },
  {
    date: '2026-04-10',
    score: 74,
    moonPhase: 'Waning Gibbous',
    moonEmoji: '🌖',
    factors: { moon: 72, solunar: 75, weather: 76 },
  },
  {
    date: '2026-04-11',
    score: 55,
    moonPhase: 'Last Quarter',
    moonEmoji: '🌗',
    factors: { moon: 50, solunar: 55, weather: 60 },
  },
];

const activeLocation = [
  {
    id: '1',
    name: 'Test Location',
    latitude: SEED_LAT,
    longitude: SEED_LNG,
    isActive: true,
  },
];

async function seedHistory(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) {
  await page.addInitScript(
    ({ key, records, lat, lng, locKey, locs }) => {
      localStorage.setItem(
        key,
        JSON.stringify({ latitude: lat, longitude: lng, records }),
      );
      localStorage.setItem(locKey, JSON.stringify(locs));
    },
    {
      key: STORAGE_KEY,
      records: seedRecords,
      lat: SEED_LAT,
      lng: SEED_LNG,
      locKey: 'moonbite_saved_locations',
      locs: activeLocation,
    },
  );
}

// ---------------------------------------------------------------------------
// 1. History tab visible in bottom nav
// ---------------------------------------------------------------------------
test.describe('Score History — Bottom Nav Tab', () => {
  test('History tab is present in bottom nav with label "History"', async ({ page }) => {
    await page.goto('/');
    const historyTab = page.locator('.bottom-nav__tab-link', { hasText: 'History' });
    await expect(historyTab).toBeVisible();
  });

  test('History tab link points to /history', async ({ page }) => {
    await page.goto('/');
    const historyTab = page.locator('.bottom-nav__tab-link[href="/history"]');
    await expect(historyTab).toBeVisible();
  });

  test('History tab is active on /history', async ({ page }) => {
    await page.goto('/history');
    const historyTab = page.locator('.bottom-nav__tab-link', { hasText: 'History' });
    await expect(historyTab).toHaveClass(/bottom-nav__tab--active/);
  });

  test('History tab has aria-current="page" on /history', async ({ page }) => {
    await page.goto('/history');
    const historyTab = page.locator('.bottom-nav__tab-link', { hasText: 'History' });
    await expect(historyTab).toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// 2. Navigate to /history
// ---------------------------------------------------------------------------
test.describe('Score History — Page Load', () => {
  test('navigating to /history loads without error and shows heading "Fishing History"', async ({
    page,
  }) => {
    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Fishing History' })).toBeVisible();
  });

  test('page has a single <main> element', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('main')).toHaveCount(1);
  });

  test('clicking History tab from Home navigates to /history', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bottom-nav__tab-link', { hasText: 'History' }).click();
    await expect(page).toHaveURL(/\/history$/);
  });
});

// ---------------------------------------------------------------------------
// 3. Empty state
// ---------------------------------------------------------------------------
test.describe('Score History — Empty State', () => {
  test('shows empty state message when no history in localStorage', async ({ page }) => {
    await page.goto('/history');
    await expect(
      page.getByText(/not enough history yet/i),
    ).toBeVisible();
  });

  test('empty state message mentions checking back after a few days', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByText(/check back after a few days/i)).toBeVisible();
  });

  test('does not show day list rows in empty state', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('.history__day-row')).toHaveCount(0);
  });

  test('does not render SVG chart in empty state', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('.history__chart svg')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Range toggle
// ---------------------------------------------------------------------------
test.describe('Score History — Range Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('7-day toggle button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: '7', exact: true })).toBeVisible();
  });

  test('14-day toggle button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: '14' })).toBeVisible();
  });

  test('30-day toggle button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: '30' })).toBeVisible();
  });

  test('7-day range is active by default', async ({ page }) => {
    const btn7 = page.getByRole('button', { name: '7', exact: true });
    await expect(btn7).toHaveClass(/active|selected|--active/);
  });

  test('clicking 14-day toggle makes it active', async ({ page }) => {
    const btn14 = page.getByRole('button', { name: '14' });
    await btn14.click();
    await expect(btn14).toHaveClass(/active|selected|--active/);
  });

  test('clicking 30-day toggle makes it active and deactivates 7-day', async ({ page }) => {
    const btn7 = page.getByRole('button', { name: '7', exact: true });
    const btn30 = page.getByRole('button', { name: '30' });
    await btn30.click();
    await expect(btn30).toHaveClass(/active|selected|--active/);
    await expect(btn7).not.toHaveClass(/active|selected|--active/);
  });
});

// ---------------------------------------------------------------------------
// 5. Day list renders
// ---------------------------------------------------------------------------
test.describe('Score History — Day List', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('renders one row per seeded record (5 rows)', async ({ page }) => {
    const rows = page.locator('.history__day-row');
    await expect(rows).toHaveCount(5);
  });

  test('day list is scrollable (overflow container exists)', async ({ page }) => {
    const list = page.locator('.history__day-list');
    await expect(list).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Day row content
// ---------------------------------------------------------------------------
test.describe('Score History — Day Row Content', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('each row shows a score number', async ({ page }) => {
    const rows = page.locator('.history__day-row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const scoreEl = rows.nth(i).locator('.history__day-score');
      await expect(scoreEl).toBeVisible();
      const text = await scoreEl.textContent();
      expect(text?.trim()).toMatch(/\d+/);
    }
  });

  test('each row shows a date', async ({ page }) => {
    const rows = page.locator('.history__day-row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const dateEl = rows.nth(i).locator('.history__day-date');
      await expect(dateEl).toBeVisible();
      const text = await dateEl.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('each row shows a moon phase emoji', async ({ page }) => {
    const rows = page.locator('.history__day-row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const emojiEl = rows.nth(i).locator('.history__day-moon');
      await expect(emojiEl).toBeVisible();
    }
  });

  test('rows display the correct score values from seeded data', async ({ page }) => {
    // Highest score in seed is 91 — verify it appears
    await expect(page.locator('.history__day-score', { hasText: '91' })).toBeVisible();
    // Lowest score in seed is 55 — verify it appears
    await expect(page.locator('.history__day-score', { hasText: '55' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Best badge
// ---------------------------------------------------------------------------
test.describe('Score History — Best Badge', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('exactly one row has the BEST badge', async ({ page }) => {
    const badges = page.locator('.history__best-badge');
    await expect(badges).toHaveCount(1);
  });

  test('BEST badge appears on the highest-scoring day (score 91)', async ({ page }) => {
    const topRow = page.locator('.history__day-row', {
      has: page.locator('.history__day-score', { hasText: '91' }),
    });
    await expect(topRow.locator('.history__best-badge')).toBeVisible();
  });

  test('BEST badge text is visible to users', async ({ page }) => {
    await expect(page.getByText('BEST')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. SVG chart renders
// ---------------------------------------------------------------------------
test.describe('Score History — SVG Chart', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('an <svg> element is present when history records exist', async ({ page }) => {
    await expect(page.locator('.history__chart svg')).toBeVisible();
  });

  test('chart SVG contains bar elements for each record', async ({ page }) => {
    const bars = page.locator('.history__chart svg .history__bar');
    await expect(bars).toHaveCount(5);
  });
});

// ---------------------------------------------------------------------------
// 9. SVG accessibility
// ---------------------------------------------------------------------------
test.describe('Score History — SVG Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('chart SVG has role="img"', async ({ page }) => {
    const svg = page.locator('.history__chart svg');
    await expect(svg).toHaveAttribute('role', 'img');
  });

  test('chart SVG has a non-empty aria-label', async ({ page }) => {
    const svg = page.locator('.history__chart svg');
    const label = await svg.getAttribute('aria-label');
    expect(label).not.toBeNull();
    expect(label!.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Day detail sheet
// ---------------------------------------------------------------------------
test.describe('Score History — Day Detail Sheet', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
  });

  test('clicking a day row opens a <dialog> element', async ({ page }) => {
    const firstRow = page.locator('.history__day-row').first();
    await firstRow.click();
    await expect(page.locator('dialog')).toBeVisible();
  });

  test('detail dialog shows a score breakdown heading', async ({ page }) => {
    const firstRow = page.locator('.history__day-row').first();
    await firstRow.click();
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading')).toBeVisible();
  });

  test('detail dialog shows the score value for the tapped day', async ({ page }) => {
    // Click the row with score 82
    const targetRow = page.locator('.history__day-row', {
      has: page.locator('.history__day-score', { hasText: '82' }),
    });
    await targetRow.click();
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('82')).toBeVisible();
  });

  test('detail dialog shows factor breakdown (moon, solunar, weather)', async ({ page }) => {
    const firstRow = page.locator('.history__day-row').first();
    await firstRow.click();
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/moon/i)).toBeVisible();
    await expect(dialog.getByText(/solunar/i)).toBeVisible();
    await expect(dialog.getByText(/weather/i)).toBeVisible();
  });

  test('dialog is not open before any row is clicked', async ({ page }) => {
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 11. Sheet close
// ---------------------------------------------------------------------------
test.describe('Score History — Sheet Dismiss', () => {
  test.beforeEach(async ({ page }) => {
    await seedHistory(page);
    await page.goto('/history');
    // Open the dialog
    await page.locator('.history__day-row').first().click();
    await expect(page.locator('dialog')).toBeVisible();
  });

  test('pressing Escape dismisses the dialog', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('clicking the close button dismisses the dialog', async ({ page }) => {
    const dialog = page.locator('dialog');
    const closeBtn = dialog.getByRole('button', { name: /close/i });
    await closeBtn.click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 12. Home screen link to /history
// ---------------------------------------------------------------------------
test.describe('Score History — Home Screen Link', () => {
  test('home page has a link pointing to /history', async ({ page }) => {
    await page.goto('/');
    const historyLink = page.locator('a[href="/history"]').first();
    await expect(historyLink).toBeVisible();
  });

  test('home page history link has accessible text (View trend / View history)', async ({
    page,
  }) => {
    await page.goto('/');
    const historyLink = page.locator('a[href="/history"]').first();
    const text = await historyLink.textContent();
    expect(text?.toLowerCase()).toMatch(/view\s+(trend|history)/i);
  });

  test('clicking home history link navigates to /history', async ({ page }) => {
    await page.goto('/');
    const historyLink = page.locator('a[href="/history"]').first();
    await historyLink.click();
    await expect(page).toHaveURL(/\/history$/);
  });
});
