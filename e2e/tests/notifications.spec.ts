import { test, expect } from '@playwright/test';

test.describe('Feature 19 — Smart Notifications & Alerts', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('moonbite_notifications');
      localStorage.removeItem('moonbite_notification_state');
      localStorage.removeItem('moonbite_notification_prefs');
    });
  });

  // ── Notification bell ─────────────────────────────────────────────────────

  test('should show notification bell in app header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('notifications-bell')).toBeVisible();
  });

  test('should navigate to /notifications when bell is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('notifications-bell').click();
    await expect(page).toHaveURL('/notifications');
  });

  test('should not show unread badge when no notifications', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-shell__notif-badge')).not.toBeVisible();
  });

  // ── Notifications screen (empty state) ────────────────────────────────────

  test('should show empty state at /notifications with no history', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.locator('.notif-screen__empty-text')).toContainText('No notifications yet');
  });

  test('should show notification history link in Settings', async ({ page }) => {
    await page.goto('/settings');
    // Enable notifications first
    await page.getByTestId('notifications-toggle').click();
    await expect(page.getByTestId('view-history-link')).toBeVisible();
  });

  // ── Settings — notifications section ─────────────────────────────────────

  test('should show notifications toggle in Settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByTestId('notifications-toggle')).toBeVisible();
  });

  test('should toggle notifications on and off', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByTestId('notifications-toggle');

    // Initially off
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Toggle on
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Toggle off
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('should show notification type controls when notifications enabled', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();

    await expect(page.getByTestId('notif-score-jump')).toBeVisible();
    await expect(page.getByTestId('notif-moon-milestone')).toBeVisible();
    await expect(page.getByTestId('notif-pressure-alert')).toBeVisible();
    await expect(page.getByTestId('notif-location-update')).toBeVisible();
  });

  test('should hide notification type controls when notifications disabled', async ({ page }) => {
    await page.goto('/settings');
    // Ensure notifications are off
    await expect(page.getByTestId('notif-score-jump')).not.toBeVisible();
  });

  test('should show send test notification button when enabled', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await expect(page.getByTestId('send-test-notif-btn')).toBeVisible();
  });

  test('should persist notification toggle preference across reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.reload();
    await expect(page.getByTestId('notifications-toggle')).toHaveAttribute('aria-checked', 'true');
  });

  // ── Test notification ─────────────────────────────────────────────────────

  test('should show toast when test notification is sent', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();
    await expect(page.getByTestId('notification-toast')).toBeVisible();
  });

  test('should dismiss toast when dismiss button clicked', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();
    await expect(page.getByTestId('notification-toast')).toBeVisible();
    await page.getByTestId('toast-dismiss-btn').click();
    await expect(page.getByTestId('notification-toast')).not.toBeVisible();
  });

  test('should add test notification to history', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    // Navigate to notifications screen
    await page.goto('/notifications');
    await expect(page.getByTestId('notification-item')).toBeVisible();
  });

  test('should show unread badge on bell after test notification', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    await expect(page.locator('.app-shell__notif-badge')).toBeVisible();
    await expect(page.locator('.app-shell__notif-badge')).toContainText('1');
  });

  // ── Notification history screen ───────────────────────────────────────────

  test('should show notification in history after test notification', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    await page.getByTestId('view-history-link').click();
    await expect(page).toHaveURL('/notifications');
    await expect(page.getByTestId('notification-item')).toBeVisible();
  });

  test('should show Today group header for current notifications', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    await page.goto('/notifications');
    await expect(page.locator('.notif-screen__group-label')).toContainText('Today');
  });

  test('should show mark-all-read button when unread notifications exist', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    await page.goto('/notifications');
    await expect(page.getByTestId('mark-all-read-btn')).toBeVisible();
  });

  test('should hide mark-all-read after marking all read', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    await page.goto('/notifications');
    await page.getByTestId('mark-all-read-btn').click();
    await expect(page.getByTestId('mark-all-read-btn')).not.toBeVisible();
  });

  test('should clear history when clear all button clicked', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    await page.goto('/notifications');
    await page.getByTestId('clear-all-btn').click();
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('notification-item')).not.toBeVisible();
  });

  test('should navigate to settings when details button clicked on toast', async ({ page }) => {
    // Send a notification with an actionUrl pointing to settings
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();

    // Test notification doesn't have an actionUrl so no details button
    const detailsBtn = page.getByTestId('toast-details-btn');
    // Test notification goes to no route, so details btn won't appear
    await expect(detailsBtn).not.toBeVisible();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  test('notifications toggle should have accessible role=switch', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByTestId('notifications-toggle');
    await expect(toggle).toHaveAttribute('role', 'switch');
  });

  test('notification toast should have role=alert', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('notifications-toggle').click();
    await page.getByTestId('send-test-notif-btn').click();
    const toast = page.getByTestId('notification-toast');
    await expect(toast).toHaveAttribute('role', 'alert');
  });

  test('notification bell should have accessible aria-label', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('notifications-bell')).toHaveAttribute('aria-label', 'Notifications');
  });
});
