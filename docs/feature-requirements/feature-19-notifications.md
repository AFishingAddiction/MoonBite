# Feature 19 — Smart Notifications & Alerts

**Status:** Complete
**Milestone:** 3 — Engagement & Persistence

---

## Overview

Enable anglers to receive timely, actionable in-app notifications about fishing conditions at their saved locations. Notifications alert users to score changes, moon phase milestones, pressure trends, and location-specific updates — keeping them engaged with MoonBite without requiring background push from a server.

This is a **client-side MVP** implementation: notifications fire when the app is open or in the foreground. No backend scheduling or push service is required for MVP.

---

## Product Context

### Why Notifications Matter

Anglers check fishing forecasts to plan trips. Notifications reduce friction by bringing important updates directly to users:
- **Score spikes** ("Your favorite spot just got great!") → drives trip planning
- **Moon phase milestones** ("Full moon in 3 days") → long-range planning
- **Pressure drops** ("Falling pressure — fish may bite slower") → behavioral insight
- **Location updates** ("Lake Tahoe score improved to 72") → keeps users engaged with saved spots

### MVP Scope: Client-Side Only

For the initial release:
- Notifications trigger based on local state changes (score updates, date boundaries, stored history)
- No backend service, cron jobs, or database required
- Notifications appear when the app is **actively open** in the browser
- Future releases (Feature 22+) can add Web Push API for background notifications and server-side scheduling

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | To enable notifications for my favorite fishing spot | I'm alerted when conditions improve |
| US-2 | Angler | To receive a notification when today's score jumps 15+ points | I know great fishing is happening right now |
| US-3 | Angler | To receive a notification 3 days before a full moon | I can plan a trip during peak lunar activity |
| US-4 | Angler | To receive a notification when barometric pressure drops >2 hPa | I understand that fish may be sluggish or aggressive |
| US-5 | Angler | To control notification types (score/moon/pressure/other) in Settings | I'm not overwhelmed by alerts |
| US-6 | Angler | To disable notifications for specific locations | I can silence noisy spots while keeping others enabled |
| US-7 | Angler | To see a notification history in the app | I can review alerts I missed |
| US-8 | Developer | A clean notification service with testable trigger logic | I can add new notification types without modifying core state |

---

## Notification Types & Trigger Conditions

### Type 1: Score Jump Alert
**Trigger:** Today's score for a saved location increases by ≥15 points since last check.

**Message:** "📈 Lake Tahoe score jumped! Score rose from 45 to 72. Great fishing conditions ahead!"

**Metadata:** Location name, previous score, new score, timestamp

**Frequency:** Max 1 per location per day (dedupe on `scoreJump:{locationId}:{dateUtc}`)

**Action:** Tap → navigate to home (`/`)

---

### Type 2: Moon Phase Milestone
**Trigger:** Upcoming full moon or new moon in approximately 3 days (moon age within 2.5–3.5 days of milestone).

**Message:** "🌕 Full Moon in 3 days — expect strong feeding activity around dawn and dusk."

**Metadata:** Moon phase name, days until event, fishing insight

**Frequency:** Max 1 per milestone per day (dedupe on `moonMilestone:{full|new}:{dateUtc}`)

**Action:** Tap → navigate to `/moon`

---

### Type 3: Pressure Alert
**Trigger:** Barometric pressure drops >2 hPa since the last reading.

**Message:** "📉 Pressure dropping fast — fish may be sluggish. Check back when it stabilizes."

**Metadata:** Current pressure, change magnitude

**Frequency:** Max 1 per day per location (dedupe on `pressureAlert:{locationId}:{dateUtc}`)

**Action:** Tap → navigate to `/weather`

---

### Type 4: Test / Location Update
**Trigger:** User taps "Send test notification" in Settings, or future location-score threshold events.

**Message:** "📬 Notifications are working! You'll receive alerts about fishing conditions."

**Action:** No navigation (no actionUrl)

---

## Settings Integration

### PreferencesService Extension

Added to `preferences.model.ts`:

```typescript
export interface NotificationPreferences {
  readonly notificationsEnabled: boolean;
  readonly scoreJump: boolean;
  readonly moonMilestone: boolean;
  readonly pressureAlert: boolean;
  readonly locationUpdate: boolean;
  readonly mutedLocationIds: readonly string[];
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  notificationsEnabled: false,
  scoreJump: true,
  moonMilestone: true,
  pressureAlert: true,
  locationUpdate: true,
  mutedLocationIds: [],
};
```

Added to `PreferencesService`:
- `notificationPrefs: Signal<NotificationPreferences>`
- `notificationsEnabled: Signal<boolean>` (computed)
- `setNotificationsEnabled(enabled: boolean): void`
- `setNotificationType(type, enabled): void`
- `muteLocation(locationId): void`
- `unmuteLocation(locationId): void`
- `isTypeEnabled(type): boolean`
- `isLocationMuted(locationId): boolean`

Persisted to `localStorage` under key `moonbite_notification_prefs`.

### Settings Screen — NOTIFICATIONS Section

```
NOTIFICATIONS

┌───────────────────────────────────────────┐
│  Notifications             [ Toggle ON  ] │   ← master switch (role="switch")
├───────────────────────────────────────────┤
│  Alert types                              │
│  ☑ 📈 Score jumps (15+ points)           │   ← checkboxes
│  ☑ 🌕 Moon phase milestones              │
│  ☑ 📉 Pressure drops                     │
│  ☑ 🎣 Test & other alerts               │
├───────────────────────────────────────────┤
│  [Lake Lanier ✕]  [Potomac ✕]            │   ← muted location chips (if any)
├───────────────────────────────────────────┤
│  [Send test notification]  [View history →]│
└───────────────────────────────────────────┘
```

**Key interactions:**
- Master toggle OFF → type checkboxes hidden; descriptive hint text shown
- Master toggle ON → type checkboxes visible and functional
- Muted chips show `✕` button; tap to unmute (`aria-label="Unmute {name}"`)
- "Send test notification" → fires a test alert immediately, shows toast
- "View history →" → navigates to `/notifications`; shows unread badge if count > 0

---

## In-App Notification Display

### Toast Component (`NotificationToastComponent`)

Fixed-position overlay rendered in `app.component.html` via `<app-notification-toast />`.

```
┌─────────────────────────────────────────────┐  ← fixed, top: $space-md
│ [ICON]  Title text                          │     max-width: 480px, centered
│         Message line 1 (max 2 lines)        │     left border: 4px solid type-color
│  ─────────────────────────────────────────  │
│                     [Dismiss] [Details →]   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← progress bar, 5s auto-dismiss
└─────────────────────────────────────────────┘
```

**Behavior:**
- Auto-dismisses after 5 seconds; progress bar tracks countdown
- "Dismiss" button → `notificationService.dismissToast()`
- "Details" button → navigates to `actionUrl`, then dismisses (only shown when `actionUrl` set)
- `role="alert"` + `aria-live="assertive"` for screen reader announcement

**Type accent colors (left border):**
| Type | Color |
|---|---|
| `scoreJump` | `$color-primary-light` (green) |
| `moonMilestone` | `#7c5cbf` (purple) |
| `pressureAlert` | `$color-accent` (amber) |
| `locationUpdate` | `#0891b2` (teal) |

**CSS classes:**
```
.notif-toast
.notif-toast--{type}     ← scoreJump / moonMilestone / pressureAlert / locationUpdate
.notif-toast__body
.notif-toast__icon
.notif-toast__content
.notif-toast__title
.notif-toast__message
.notif-toast__actions
.notif-toast__btn
.notif-toast__btn--dismiss
.notif-toast__btn--details
.notif-toast__progress
```

### Notification History Screen (`/notifications`)

```
┌─────────────────────────────────────────────┐
│  Notifications     [Mark all read] [Clear]  │  ← green header
├─────────────────────────────────────────────┤
│  TODAY                                      │  ← date group label (uppercase)
│  ┌─────────────────────────────────────┐   │
│  │ 📈  Score jumped!           2:34 PM │   │  ← unread: bold title + dot
│  │     Score rose from 45 to 72        │   │
│  └─────────────────────────────────────┘   │
│  YESTERDAY                                  │
│  ...                                        │
│  APRIL 23, 2026                             │  ← older dates: formatted
│  ...                                        │
├─────────────────────────────────────────────┤
│  (empty state: 🔔 No notifications yet)    │
└─────────────────────────────────────────────┘
```

**Groups:** Today / Yesterday / formatted date (e.g. "April 23, 2026")

**Item interaction:** Tap → `markRead(id)` + `router.navigateByUrl(actionUrl)`

**CSS classes:**
```
.notif-screen
.notif-screen__header
.notif-screen__title
.notif-screen__header-actions
.notif-screen__action-btn
.notif-screen__action-btn--danger
.notif-screen__empty
.notif-screen__empty-icon
.notif-screen__empty-text
.notif-screen__empty-hint
.notif-screen__list
.notif-screen__group
.notif-screen__group-label
.notif-screen__card
.notif-screen__item
.notif-screen__item--unread
.notif-screen__item-btn
.notif-screen__item-icon
.notif-screen__item-body
.notif-screen__item-title
.notif-screen__item-message
.notif-screen__item-time
.notif-screen__unread-dot
.notif-screen__divider
```

### App Header Bell

Notification bell icon in `app.component.html` top-right:
- `<a routerLink="/notifications" data-testid="notifications-bell" aria-label="Notifications">🔔</a>`
- Red badge (`.app-shell__notif-badge`) shows unread count when > 0

---

## Architecture

### Files Added

| File | Purpose |
|---|---|
| `src/app/notifications/notification.model.ts` | `AppNotification` interface, `NotificationType` union, `NotificationPreferences` interface |
| `src/app/notifications/notification.service.ts` | Signal-based store: notify, dismiss, read, clear, trigger checks, deduplication, localStorage persistence |
| `src/app/notifications/notification.service.spec.ts` | 50+ unit tests (service logic, deduplication, persistence) |
| `src/app/notifications/notification-toast.component.{ts,html,scss}` | Fixed toast overlay component |
| `src/app/notifications/notification-toast.component.spec.ts` | Toast component unit tests |
| `src/app/notifications/notifications-screen.component.{ts,html,scss}` | `/notifications` history screen |
| `src/app/notifications/notifications-screen.component.spec.ts` | Screen component unit tests |
| `e2e/tests/notifications.spec.ts` | 24 Playwright acceptance tests |

### Files Modified

| File | Change |
|---|---|
| `src/app/preferences/preferences.model.ts` | Added `NotificationPreferences` interface + `DEFAULT_NOTIFICATION_PREFS` |
| `src/app/preferences/preferences.service.ts` | Added notification prefs signal, getters, setters, mute/unmute, `isTypeEnabled`, `isLocationMuted`, localStorage persistence |
| `src/app/preferences/preferences.service.spec.ts` | Added notification preferences test suite (~25 tests) |
| `src/app/settings/settings.component.{ts,html,scss}` | Added NOTIFICATIONS section: master toggle, type checkboxes, muted chips, test button, history link |
| `src/app/app.component.{ts,html,scss}` | Injected `NotificationService`, added bell icon + badge in header, `runNotificationChecks()` on score load |
| `src/app/app.routes.ts` | Added `/notifications` lazy route |

### Core Model

```typescript
// notification.model.ts

export type NotificationType = 'scoreJump' | 'moonMilestone' | 'pressureAlert' | 'locationUpdate';

export interface AppNotification {
  readonly id: string;              // crypto.randomUUID()
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly icon: string;            // emoji
  readonly locationId?: string;
  readonly locationName?: string;
  readonly actionUrl?: string;      // route to navigate on tap
  readonly timestamp: string;       // ISO 8601
  readonly read: boolean;
}
```

### NotificationService API

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly history: Signal<AppNotification[]>;         // newest first, max 100, 30-day pruned
  readonly activeToast: Signal<AppNotification | null>;
  readonly unreadCount: Signal<number>;                // computed

  notify(type, title, message, icon, options?): AppNotification;
  dismissToast(): void;
  markRead(id: string): void;
  markAllRead(): void;
  clearHistory(): void;

  // Trigger checks (called from AppComponent on score/weather load)
  checkScoreJump(score, locationId, locationName, enabled, muted): boolean;
  checkMoonMilestone(moonAge, enabled): boolean;
  checkPressureAlert(pressureHpa, locationId, locationName, enabled, muted): boolean;
  sendTestNotification(): void;
}
```

### Deduplication

All trigger checks use a `deduplicationKeys` array in `TriggerState` (persisted to localStorage under `moonbite_notification_state`). Keys have the format `{type}:{qualifier}:{dateUtc}` (e.g. `scoreJump:loc1:2026-04-28`). Up to 500 dedup keys are retained; oldest are pruned automatically.

### Trigger State

```typescript
interface TriggerState {
  lastScoreByLocationId: Record<string, number>;
  lastPressureByLocationId: Record<string, { hpa: number; dateUtc: string }>;
  deduplicationKeys: string[];
}
```

### localStorage Keys

| Key | Contents |
|---|---|
| `moonbite_notifications` | `AppNotification[]` — history (max 100, pruned to 30 days on load) |
| `moonbite_notification_state` | `TriggerState` — last scores, last pressures, dedup keys |
| `moonbite_notification_prefs` | `NotificationPreferences` — user settings |

---

## Settings SCSS Additions

New classes added to `settings.component.scss`:

```scss
.settings__toggle              // 48×28px toggle button (role="switch")
.settings__toggle--on          // background: $color-primary when ON
.settings__toggle-thumb        // 20px sliding circle
.settings__notif-sub           // padding wrapper for sub-sections
.settings__notif-sublabel      // uppercase small label
.settings__checkbox-row        // flex row for type checkbox + label
.settings__checkbox            // styled <input type="checkbox">
.settings__checkbox-label
.settings__muted-chips         // flex-wrap container for chips
.settings__muted-chip          // individual muted location chip
.settings__muted-chip-remove   // ✕ remove button on chip
.settings__notif-actions       // row for test button + history link
.settings__notif-test-btn      // ghost-style test button
.settings__notif-history-link  // link to /notifications
.settings__notif-badge         // red unread count badge
```

New classes added to `app.component.scss`:

```scss
.app-shell__notif-btn          // bell icon link (36×36px, rounded)
.app-shell__notif-badge        // absolute red badge (top-right of bell)
```

---

## Acceptance Criteria

```gherkin
Feature: Smart Notifications & Alerts

  Scenario: Notifications toggle in Settings
    Given the user opens Settings
    When they toggle Notifications ON
    Then type checkboxes become visible
    And the toggle has aria-checked="true"
    And preferences persist to localStorage

  Scenario: Toggle persists across page reload
    Given the user enables notifications in Settings
    When the page reloads
    Then the toggle still shows ON (aria-checked="true")

  Scenario: Send test notification
    Given notifications are enabled
    When the user taps "Send test notification"
    Then a toast appears with a test message
    And the notification is added to history

  Scenario: Toast dismiss
    Given a toast is visible
    When the user clicks "Dismiss"
    Then the toast disappears

  Scenario: Unread badge on bell
    Given a test notification has been sent
    When the user views the app header
    Then the bell shows a red badge with count "1"

  Scenario: Notification history screen
    Given at least one notification exists
    When the user navigates to /notifications
    Then notifications are shown grouped by date (Today/Yesterday/date)
    And each item shows icon, title, message, and timestamp

  Scenario: Mark all read
    Given unread notifications exist at /notifications
    When the user clicks "Mark all read"
    Then the mark-all-read button disappears
    And unread dots are removed

  Scenario: Clear all notifications
    Given notifications exist at /notifications
    When the user clicks "Clear all"
    Then the empty state is shown

  Scenario: Score jump deduplication
    Given a score jump alert fired for Location A today
    When the score for Location A rises again today
    Then no second alert fires
    And history shows only the first alert

  Scenario: Moon milestone trigger
    Given moon age is within 3 days of a full moon
    And moon milestone type is enabled
    Then a notification fires with actionUrl="/moon"
    And it does not fire twice on the same day

  Scenario: Pressure alert trigger
    Given a prior pressure reading exists
    When pressure drops more than 2 hPa
    And pressure alert type is enabled
    Then a notification fires with actionUrl="/weather"

  Scenario: Muted location chips
    Given a location is added to mutedLocationIds
    When the Settings screen is open with notifications ON
    Then the location appears as a chip
    When the user clicks ✕ on the chip
    Then it is removed from mutedLocationIds

  Scenario: Accessibility — toggle role
    Given the Settings screen is open
    Then the notifications toggle has role="switch"

  Scenario: Accessibility — toast role
    Given a toast is visible
    Then it has role="alert"

  Scenario: Accessibility — bell aria-label
    Given the home screen is visible
    Then the bell link has aria-label="Notifications"
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Notification opt-in rate | ≥40% of users |
| Score jump alert accuracy | 100% (≥15pt threshold respected) |
| Moon milestone precision | 100% (fires on correct day) |
| False alert rate | <5% |
| Unit test coverage | ≥85% branches |
| E2E coverage | 24 Playwright scenarios |

---

## Out of Scope — MVP

| Item | Future Feature |
|---|---|
| Web Push Notifications (background) | Feature 22 |
| Server-side notification scheduling | Feature 22 |
| Notification sounds/vibration | Post-MVP |
| Scheduled "quiet hours" | Feature 20 |
| Email / SMS alerts | Feature 22 |
| Notification A/B testing | Feature 21 |

---

## Dependencies

| Feature | Provides |
|---|---|
| Feature 01 | Current user location (for pressure alerts) |
| Feature 04 | Weather data & barometric pressure |
| Feature 02 | Moon phase calculations |
| Feature 05 | Fishing score calculation |
| Feature 14 | Preferences service (notification settings persistence) |

---

## Implementation Notes

- **Trigger entry point:** `AppComponent.runNotificationChecks()` is called after each score fetch. It reads `PreferencesService.notificationPrefs()` to decide which checks to run and passes `enabled`/`muted` flags directly to `NotificationService`.
- **No NgModules:** all components are standalone; `NotificationService` is `providedIn: 'root'`.
- **History cap:** max 100 entries in memory and localStorage; 30-day pruning on `loadHistory()` at service init.
- **Dedup cap:** max 500 dedup keys retained; oldest pruned to prevent unbounded localStorage growth.
- **Toast timer:** managed entirely inside `NotificationService.showToast()` with a `setTimeout`; `NotificationToastComponent` drives its own progress bar via `setInterval` started from `startProgress()`.
- **Settings model duplication:** `NotificationPreferences` was defined in both `notification.model.ts` and `preferences.model.ts`. The canonical definition lives in `preferences.model.ts`; `notification.model.ts` re-exports it for convenience.
