import { test, expect } from '@playwright/test';

// Component tests use the running app at localhost:4202
// For true component isolation, consider @playwright/experimental-ct-angular

test.describe('AppComponent', () => {
  test('renders root component', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('app-root');
    await expect(root).toBeVisible();
  });

  test('renders location display component', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-location-display')).toBeVisible();
  });
});
