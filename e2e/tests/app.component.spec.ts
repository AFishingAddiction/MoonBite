import { test, expect } from '@playwright/test';

// Component tests use the running app at localhost:4202
// For true component isolation, consider @playwright/experimental-ct-angular

test.describe('AppComponent', () => {
  test('renders root component', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('app-root');
    await expect(root).toBeVisible();
  });

  test('displays project description', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('MoonBite combines solunar tables, moon phase, weather forecast, and barometric pressure into a single daily "fishing score" for your location.');
  });
});
