# Feature 13 — Location Bookmarks / Saved Locations

**Status:** Complete  
**Milestone:** 2 — Core Value

---

## Overview

Allow anglers to bookmark named fishing spots and instantly switch between them without re-granting GPS each session. A saved location overrides GPS coordinates app-wide — the fishing score, solunar table, and weather all recalculate for the pinned spot — making MoonBite practical for planning trips to favourite waters before leaving home.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | To save my current GPS location with a custom name | I can revisit my favourite spots without re-granting GPS every session |
| US-2 | Angler | To view a list of all my saved locations | I can pick a spot and see its fishing score |
| US-3 | Angler | To activate a saved location and have all scores update | I can plan for tomorrow's lake trip from my couch tonight |
| US-4 | Angler | To switch back to live GPS with one tap | I can return to real-time data when I'm on the water |
| US-5 | Angler | To delete saved locations I no longer need | I can keep my list tidy |
| US-6 | Angler | To see which saved location is currently active at a glance | I always know whose conditions I'm looking at |
| US-7 | Angler | To access my saved locations from the home screen | I don't have to dig through settings |

---

## UX Notes

### Workflow

The primary save flow is two taps: "Save Location" (in the location card on the home screen) → type a name → "Save". The manage flow is: tap "Saved Locations" link → see list → tap "Use" or "Delete".

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Activate location | Overrides GPS app-wide | Consistent data; user sees same score everywhere in the app |
| Switch back to GPS | Single "Switch to GPS" button | Obvious escape hatch; doesn't require navigating to /locations |
| Max locations | 10 | Avoids unbounded localStorage growth; more than enough for a typical angler's spots |
| Persistence | localStorage | No account required; works offline |
| Entry point | Location card link, not nav tab | Locations is a utility, not a primary data view; keeps nav lean |

### Accessibility (Fishing Context)

- All interactive elements have ≥ 44×44px touch targets
- Active state announced via `aria-label` and visible badge
- Form has proper `<label>` associations
- Destructive delete is clearly labelled

---

## UI Spec

### Location Card (Home Screen) — Updated

```
┌─────────────────────────────────────┐
│  📍 Your Location          [Saved Locations →] │
│                                     │
│  [Idle]  Use My Location btn        │
│  [GPS Granted]                      │
│    40.7128° N  74.0060° W           │
│    [Change Location]  [Save Location]│
│                                     │
│  [Active Saved Location]            │
│    Using saved location:            │
│    Lake Tahoe                       │
│    39.0968° N  120.0324° W          │
│    [Switch to GPS]                  │
└─────────────────────────────────────┘
```

### Saved Locations Screen (`/locations`)

```
┌─────────────────────────────────────┐
│ ← Back       📍 Saved Locations     │
├─────────────────────────────────────┤
│ [+ Save GPS Location]               │
│  ─ or inline name form ─            │
│  Name: [Lake Tahoe        ]         │
│         [Save]  [Cancel]            │
├─────────────────────────────────────┤
│ ✓ Currently using: Lake Tahoe       │
│                           [Use GPS] │
├─────────────────────────────────────┤
│ ● Lake Tahoe (Active)     [Use GPS] [Delete] │
│   39.0968° N, 120.0324° W           │
│                                     │
│ ○ Home Waters             [Use]     [Delete] │
│   40.7128° N, 74.0060° W            │
├─────────────────────────────────────┤
│  [empty state]                      │
│  No saved locations yet.            │
│  Tap "Save GPS Location" to start.  │
└─────────────────────────────────────┘
```

### Design Tokens

| Element | Token |
|---------|-------|
| Page background | `$color-surface-alt` |
| Card background | `$color-surface` |
| Active badge | `$color-primary` text on `$color-primary-light` bg |
| Active item border | `$color-primary` |
| Delete button | `$color-error` |
| Add button | `$color-accent` |

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/locations/saved-location.model.ts` | `SavedLocation` interface |
| `src/app/locations/saved-locations.service.ts` | CRUD + localStorage persistence + active location signal |
| `src/app/locations/saved-locations.service.spec.ts` | Unit tests |
| `src/app/locations/active-location.service.ts` | Bridge: saved location ?? GPS → unified `coords` signal |
| `src/app/locations/active-location.service.spec.ts` | Unit tests |
| `src/app/locations/saved-locations.component.ts` | Manage screen (`/locations`) |
| `src/app/locations/saved-locations.component.html` | Template |
| `src/app/locations/saved-locations.component.scss` | Styles |
| `src/app/locations/saved-locations.component.spec.ts` | Unit tests |
| `e2e/tests/saved-locations.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Add `/locations` lazy route |
| `src/app/location-display/location-display.component.ts` | Add save UI + active location display |
| `src/app/location-display/location-display.component.html` | Save form + active location + manage link |
| `src/app/location-display/location-display.component.scss` | New styles for save form & active banner |
| `src/app/scoring/fishing-score-display.component.ts` | Use `ActiveLocationService` instead of `GeolocationService` |
| `src/app/solunar/solunar-display.component.ts` | Use `ActiveLocationService` |
| `src/app/solunar/solunar-details.component.ts` | Use `ActiveLocationService` |
| `src/app/weather/weather-display.component.ts` | Use `ActiveLocationService` |
| `src/app/weather/weather-details.component.ts` | Use `ActiveLocationService` |

### `SavedLocationsService` API

```typescript
interface SavedLocation {
  readonly id: string;        // crypto.randomUUID()
  readonly name: string;      // trimmed, non-empty
  readonly latitude: number;
  readonly longitude: number;
  readonly createdAt: string; // ISO date string
}

class SavedLocationsService {
  static readonly MAX_LOCATIONS = 10;
  readonly locations: Signal<SavedLocation[]>;
  readonly activeLocation: Signal<SavedLocation | null>; // computed
  add(name, lat, lng): SavedLocation | null;  // null if max reached or empty name
  remove(id): void;   // clears active if removed location was active
  setActive(id | null): void;
}
```

### `ActiveLocationService` API

```typescript
interface ActiveCoords {
  readonly latitude: number;
  readonly longitude: number;
  readonly name: string | null; // null = GPS (unnamed)
}

class ActiveLocationService {
  readonly coords: Signal<ActiveCoords | null>; // null = no location available
  readonly status: Signal<GeolocationState['status'] | 'granted'>;
  readonly isLocating: Signal<boolean>;  // false when saved location active
  readonly hasError: Signal<boolean>;    // false when saved location active
}
```

Priority: `savedLocation.activeLocation()` > `GeolocationService.state`.

---

## Acceptance Criteria

```gherkin
Feature: Location Bookmarks / Saved Locations

  Scenario: Save current GPS location from home screen
    Given the user has granted GPS permission
    When the user taps "Save Location" in the location card
    Then an inline name form appears with a text input
    When the user types "Lake Tahoe" and taps "Save"
    Then the location is added to the saved locations list
    And the location is persisted in localStorage

  Scenario: View saved locations screen
    Given the user has at least one saved location
    When the user taps "Saved Locations" from the location card
    Then the /locations screen renders with a list of saved spots
    And each entry shows the name and coordinates

  Scenario: Activate a saved location
    Given the user is on the /locations screen with a saved location "Lake Tahoe"
    When the user taps "Use" next to "Lake Tahoe"
    Then "Lake Tahoe" is marked as the active location
    And the fishing score recalculates using Lake Tahoe's coordinates
    And the location card shows "Using saved location: Lake Tahoe"

  Scenario: Active location shown on home screen
    Given a saved location "Lake Tahoe" is active
    When the user views the home screen
    Then the location card shows "Using saved location: Lake Tahoe" with its coordinates
    And a "Switch to GPS" button is visible

  Scenario: Switch back to GPS
    Given a saved location is active
    When the user taps "Switch to GPS" on the location card
    Then no saved location is active
    And the location card reverts to showing GPS state

  Scenario: Delete a saved location
    Given the user is on /locations with location "Lake Tahoe"
    When the user taps "Delete" next to "Lake Tahoe"
    Then "Lake Tahoe" is removed from the list
    And if it was the active location, no location is active

  Scenario: Empty state on /locations screen
    Given the user has no saved locations
    When the user navigates to /locations
    Then the empty-state message is visible
    And no location list is rendered

  Scenario: Max locations enforced
    Given the user already has 10 saved locations
    When the user attempts to add an 11th location
    Then the "Save GPS Location" button is disabled
    And a "Maximum of 10 locations" message is shown

  Scenario: Saved locations persist across sessions
    Given the user saves a location "Lake Tahoe"
    When the user closes and reopens the app
    Then "Lake Tahoe" is still in the saved locations list

  Scenario: Score details screens use active saved location
    Given "Lake Tahoe" is the active location
    When the user navigates to /solunar or /weather
    Then the data shown is calculated for Lake Tahoe's coordinates
    And the loading/error state does not show (location is available)
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Save success rate | 100% — location saved immediately on confirm |
| Persistence | 100% — survives page reload |
| Score accuracy | Score matches manual calculation for saved coords |
| Unit test coverage | ≥ 85% (statements, branches, functions, lines) |
| WCAG 2.1 AA compliance | All interactive elements labelled and focusable |

---

## Implementation Notes

- **`crypto.randomUUID()`** used for ID generation (available in all modern browsers + JSDOM 20+).
- **`ActiveLocationService`** is the single source of truth for coordinates across all display components; `GeolocationService` is not injected by any display component directly.
- **localStorage keys:** `moonbite_saved_locations` (JSON array), `moonbite_active_location_id` (string).
- **`SavedLocationsService`** uses `signal()` + `computed()` for reactive state; localStorage reads happen once at construction time.
- **`LocationDisplayComponent`** adds `RouterLink` import for the "Saved Locations →" link.

---

## Out of Scope

| Item | Future Feature |
|------|---------------|
| Location search by name/address | Feature 18 (Location Search & Library) |
| Rename saved locations | Feature 14 (User Settings) |
| Sorting / reordering saved locations | Feature 14 |
| Share a saved location | Feature 17 (Share Score) |
| Cloud sync of saved locations | Feature 22 (Premium) |

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService` + `GeolocationState` interface |
| Feature 05 | `FishingScoreService.getScore(lat, lng, date)` |
| Feature 12 | Bottom nav; routing infrastructure |
| Feature 07 | SCSS design tokens |
