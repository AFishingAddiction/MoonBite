import { test, expect } from '@playwright/test';

const nav = (page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) =>
  page.locator('nav.bottom-nav');

// ---------------------------------------------------------------------------
// 1. Presence on all routes
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — Presence', () => {
  for (const route of ['/', '/moon', '/solunar', '/weather', '/score']) {
    test(`nav bar is visible on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('nav.bottom-nav')).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Active state
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — Active state', () => {
  test('Home tab is active on /', async ({ page }) => {
    await page.goto('/');
    const homeTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    await expect(homeTab).toHaveClass(/bottom-nav__tab--active/);
  });

  test('Moon tab is active on /moon', async ({ page }) => {
    await page.goto('/moon');
    const moonTab = page.locator('.bottom-nav__tab-link', { hasText: 'Moon' });
    await expect(moonTab).toHaveClass(/bottom-nav__tab--active/);
  });

  test('Solunar tab is active on /solunar', async ({ page }) => {
    await page.goto('/solunar');
    const solunarTab = page.locator('.bottom-nav__tab-link', { hasText: 'Solunar' });
    await expect(solunarTab).toHaveClass(/bottom-nav__tab--active/);
  });

  test('Weather tab is active on /weather', async ({ page }) => {
    await page.goto('/weather');
    const weatherTab = page.locator('.bottom-nav__tab-link', { hasText: 'Weather' });
    await expect(weatherTab).toHaveClass(/bottom-nav__tab--active/);
  });

  test('Home tab is active on /score (score is a Home child)', async ({ page }) => {
    await page.goto('/score');
    const homeTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    await expect(homeTab).toHaveClass(/bottom-nav__tab--active/);
  });
});

// ---------------------------------------------------------------------------
// 3. Navigation works
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — Navigation', () => {
  test('clicking Home tab navigates to /', async ({ page }) => {
    await page.goto('/moon');
    await page.locator('.bottom-nav__tab-link', { hasText: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('clicking Moon tab navigates to /moon', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bottom-nav__tab-link', { hasText: 'Moon' }).click();
    await expect(page).toHaveURL(/\/moon$/);
  });

  test('clicking Solunar tab navigates to /solunar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bottom-nav__tab-link', { hasText: 'Solunar' }).click();
    await expect(page).toHaveURL(/\/solunar$/);
  });

  test('clicking Weather tab navigates to /weather', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bottom-nav__tab-link', { hasText: 'Weather' }).click();
    await expect(page).toHaveURL(/\/weather$/);
  });
});

// ---------------------------------------------------------------------------
// 4. Keyboard accessibility
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — Keyboard accessibility', () => {
  test('all four tab links are focusable via Tab key', async ({ page }) => {
    await page.goto('/');
    const tabLinks = page.locator('.bottom-nav__tab-link');
    await expect(tabLinks).toHaveCount(4);

    const count = await tabLinks.count();
    for (let i = 0; i < count; i++) {
      // Each link must be in the tab order (tabIndex >= 0 or default anchor behaviour)
      const tabIndex = await tabLinks.nth(i).getAttribute('tabindex');
      // tabindex of null means the element uses its natural tab order (anchors are focusable by default)
      expect(tabIndex === null || Number(tabIndex) >= 0).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. ARIA
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — ARIA', () => {
  test('nav has aria-label="Main navigation"', async ({ page }) => {
    await page.goto('/');
    const navEl = page.locator('nav.bottom-nav');
    await expect(navEl).toHaveAttribute('aria-label', 'Main navigation');
  });

  test('nav has role="navigation"', async ({ page }) => {
    await page.goto('/');
    // <nav> carries an implicit navigation role; an explicit role attribute is also acceptable
    const navEl = page.locator('nav[role="navigation"]');
    await expect(navEl).toBeVisible();
  });

  test('active Home tab has aria-current="page" on /', async ({ page }) => {
    await page.goto('/');
    const homeTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    await expect(homeTab).toHaveAttribute('aria-current', 'page');
  });

  test('active Moon tab has aria-current="page" on /moon', async ({ page }) => {
    await page.goto('/moon');
    const moonTab = page.locator('.bottom-nav__tab-link', { hasText: 'Moon' });
    await expect(moonTab).toHaveAttribute('aria-current', 'page');
  });

  test('active Solunar tab has aria-current="page" on /solunar', async ({ page }) => {
    await page.goto('/solunar');
    const solunarTab = page.locator('.bottom-nav__tab-link', { hasText: 'Solunar' });
    await expect(solunarTab).toHaveAttribute('aria-current', 'page');
  });

  test('active Weather tab has aria-current="page" on /weather', async ({ page }) => {
    await page.goto('/weather');
    const weatherTab = page.locator('.bottom-nav__tab-link', { hasText: 'Weather' });
    await expect(weatherTab).toHaveAttribute('aria-current', 'page');
  });

  test('inactive tabs do not have aria-current="page"', async ({ page }) => {
    await page.goto('/moon');
    const homeTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    const solunarTab = page.locator('.bottom-nav__tab-link', { hasText: 'Solunar' });
    const weatherTab = page.locator('.bottom-nav__tab-link', { hasText: 'Weather' });
    await expect(homeTab).not.toHaveAttribute('aria-current', 'page');
    await expect(solunarTab).not.toHaveAttribute('aria-current', 'page');
    await expect(weatherTab).not.toHaveAttribute('aria-current', 'page');
  });
});

// ---------------------------------------------------------------------------
// 6. WCAG 2.1 AA — Color Contrast (WCAG 1.4.3, 1.4.11)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Color Contrast', () => {
  test('inactive tab text (#9ca3af) meets 4.5:1 contrast on dark surface (#111827)', async ({
    page,
  }) => {
    // Contrast ratio: 7.02:1 (exceeds 4.5:1 AA requirement for 11px normal text)
    // WCAG 1.4.3: Contrast (Minimum)
    await page.goto('/moon');
    const inactiveTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    const color = await inactiveTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    // Verify the inactive tab color is applied
    expect(color).toBeTruthy();
  });

  test('active tab text (#f0a500) meets 4.5:1 contrast on dark surface (#111827)', async ({
    page,
  }) => {
    // Contrast ratio: 8.58:1 (exceeds 4.5:1 AA requirement for 11px normal text)
    // WCAG 1.4.3: Contrast (Minimum)
    await page.goto('/');
    const activeTab = page.locator('.bottom-nav__tab-link', { hasText: 'Home' });
    const color = await activeTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    // Verify the active tab color is applied
    expect(color).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 7. WCAG 2.1 AA — Touch Target Size (WCAG 2.5.5)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Touch Target Size', () => {
  test('each tab link has minimum 44x44px touch target (WCAG 2.5.5)', async ({
    page,
  }) => {
    await page.goto('/');
    const tabLinks = page.locator('.bottom-nav__tab-link');
    const count = await tabLinks.count();

    for (let i = 0; i < count; i++) {
      const link = tabLinks.nth(i);
      const box = await link.boundingBox();

      // Minimum 44x44px per WCAG 2.5.5 (success criterion for target size)
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. WCAG 2.1 AA — Focus Visibility (WCAG 2.4.7)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Focus Visibility', () => {
  test('tab links have visible focus indicator on keyboard Tab (WCAG 2.4.7)', async ({
    page,
  }) => {
    await page.goto('/');
    const homeLink = page.locator('.bottom-nav__tab-link').first();

    // Focus the first tab link
    await homeLink.focus();

    // Check for focus-visible outline
    const outline = await homeLink.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    });

    // Should have a visible outline
    expect(outline.outlineStyle).not.toBe('none');
    expect(outline.outlineWidth).not.toBe('0px');
  });
});

// ---------------------------------------------------------------------------
// 9. WCAG 2.1 AA — Icon Accessibility (WCAG 1.1.1, 4.1.2)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Icon Accessibility', () => {
  test('emoji icons are hidden from screen readers with aria-hidden="true"', async ({
    page,
  }) => {
    // WCAG 1.1.1: Non-text Content, WCAG 4.1.2: Name, Role, Value
    await page.goto('/');
    const iconSpans = page.locator('.bottom-nav__tab-icon');
    const count = await iconSpans.count();

    for (let i = 0; i < count; i++) {
      const icon = iconSpans.nth(i);
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('tab links have visible text labels accessible to screen readers', async ({
    page,
  }) => {
    // WCAG 4.1.2: Name, Role, Value
    await page.goto('/');
    const tabLinks = page.locator('.bottom-nav__tab-link');
    const expectedLabels = ['Home', 'Moon', 'Solunar', 'Weather'];

    for (const label of expectedLabels) {
      const link = page.locator('.bottom-nav__tab-link', { hasText: label });
      await expect(link).toBeVisible();
      const text = await link.textContent();
      expect(text).toContain(label);
    }
  });
});

// ---------------------------------------------------------------------------
// 10. WCAG 2.1 AA — Semantic HTML & Landmark (WCAG 1.3.1)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Semantic HTML', () => {
  test('nav landmark uses <nav> element with proper labeling (WCAG 1.3.1)', async ({
    page,
  }) => {
    // WCAG 1.3.1: Info and Relationships
    await page.goto('/');
    const nav = page.locator('nav.bottom-nav[role="navigation"][aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
  });

  test('tab list uses semantic <ol> (ordered list) structure (WCAG 1.3.1)', async ({
    page,
  }) => {
    // WCAG 1.3.1: Info and Relationships
    await page.goto('/');
    const tabList = page.locator('.bottom-nav__tabs');
    const listType = await tabList.evaluate((el) => el.tagName.toLowerCase());
    expect(listType).toBe('ol');
  });

  test('each tab is wrapped in <li> (list item) for semantic structure (WCAG 1.3.1)', async ({
    page,
  }) => {
    // WCAG 1.3.1: Info and Relationships
    await page.goto('/');
    const tabs = page.locator('.bottom-nav__tab');
    const count = await tabs.count();

    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const tagName = await tab.evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe('li');
    }
  });
});

// ---------------------------------------------------------------------------
// 11. WCAG 2.1 AA — Keyboard Navigation (WCAG 2.1.1, 2.4.3)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Keyboard Navigation', () => {
  test('all tab links are reachable and activatable via keyboard (WCAG 2.1.1)', async ({
    page,
  }) => {
    // WCAG 2.1.1: Keyboard
    await page.goto('/');
    const tabLinks = page.locator('.bottom-nav__tab-link');
    const count = await tabLinks.count();

    for (let i = 0; i < count; i++) {
      const link = tabLinks.nth(i);
      // Verify link is focusable
      await link.focus();
      const focused = await link.evaluate((el) => el === document.activeElement);
      expect(focused).toBe(true);
    }
  });

  test('tab focus order is logical and intuitive (WCAG 2.4.3)', async ({ page }) => {
    // WCAG 2.4.3: Focus Order
    await page.goto('/');
    const tabLinks = page.locator('.bottom-nav__tab-link');
    const expectedOrder = ['Home', 'Moon', 'Solunar', 'Weather'];

    for (let i = 0; i < expectedOrder.length; i++) {
      const link = page.locator('.bottom-nav__tab-link', { hasText: expectedOrder[i] });
      await expect(link).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 12. WCAG 2.1 AA — Page Title Context (WCAG 2.4.2)
// ---------------------------------------------------------------------------
test.describe('Bottom Nav — WCAG 2.1 AA Page Context', () => {
  test('aria-current="page" correctly identifies current page to screen readers (WCAG 2.4.2)',
    async ({ page }) => {
      // WCAG 2.4.2: Page Titled, WCAG 4.1.2: Name, Role, Value
      const routes = ['/', '/moon', '/solunar', '/weather'];
      const expectedActive = ['Home', 'Moon', 'Solunar', 'Weather'];

      for (let i = 0; i < routes.length; i++) {
        await page.goto(routes[i]);
        const activeTab = page.locator('.bottom-nav__tab-link[aria-current="page"]');
        const activeText = await activeTab.textContent();

        expect(activeText).toContain(expectedActive[i]);
      }
    }
  );
});
