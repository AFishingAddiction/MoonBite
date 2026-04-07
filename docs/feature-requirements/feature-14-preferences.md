# Feature 14 — User Settings & Preferences

**Status:** Complete  
**Milestone:** 2 — Core Value

---

## Overview

Allow anglers to customize how MoonBite displays data: choose metric or imperial units for temperature, wind speed, pressure, and precipitation; select 12-hour or 24-hour time format; and manage saved locations (rename, reorder). Settings are persisted to localStorage and applied app-wide without reloading.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | US angler | To see temperatures in °F instead of °C | The weather data is immediately relevant to my local experience |
| US-2 | US angler | To see wind speed in mph instead of km/h | I can interpret forecasts using units I'm familiar with |
| US-3 | US angler | To see barometric pressure in inHg instead of hPa | I can compare readings to my home weather station |
| US-4 | US angler | To see precipitation in inches instead of millimeters | I understand rainfall amounts in familiar units |
| US-5 | International angler | To use 24-hour time format for solunar peak times | I prefer ISO/military time for clarity |
| US-6 | US angler | To use 12-hour time format (AM/PM) for solunar peak times | I naturally read time with AM/PM indicators |
| US-7 | Angler | To rename a saved location | I can clarify or correct its name anytime |
| US-8 | Angler | To reorder my saved locations | I can organize them by frequency of use or geography |
| US-9 | Angler | To access settings from a 5th navigation tab | Settings feel like a first-class feature, not hidden |
| US-10 | Angler | To see my current unit & time preferences at a glance | I always know what format I'm viewing |

---

## Scope Decisions

### IN Scope — Feature 14

| Item | Rationale |
|------|-----------|
| Unit system toggle (Metric ↔ Imperial) | Core need for US market; affects all weather displays |
| Temperature unit conversion (°C ↔ °F) | Most visible data field; essential for usability |
| Wind speed conversion (km/h ↔ mph) | Weather details screen heavily relies on this |
| Pressure conversion (hPa ↔ inHg) | Score breakdown explains pressure contribution; anglers compare to barometers |
| Precipitation conversion (mm ↔ in) | Weather details and scoring explanation reference rainfall |
| Time format toggle (24h ↔ 12h AM/PM) | Solunar peak times formatted as strings; no current preference exists |
| Rename saved locations | Deferred from Feature 13 |
| Reorder saved locations | Deferred from Feature 13 (drag-and-drop or arrow buttons) |
| Settings screen (`/settings`) | 5th nav tab; localStorage-backed preferences signal |
| Apply settings app-wide without reload | Signals trigger reactive updates in all display components |

### OUT of Scope — Future Features

| Item | Future Feature |
|------|---------------|
| Persistent theme (light/dark mode) | Feature 16 (Branding) |
| Notifications & alerts (frequency, quiet hours) | Feature 19 (Notifications) |
| Fishing journal preferences (tags, filters) | Feature 20 (Catch Logging) |
| Export/import settings | Feature 22 (Premium) |
| Cloud sync of preferences | Feature 22 (Premium) |
| Advanced score weighting (custom fishing style) | Future enhancement |

---

## UX Notes

### Workflow

**Access:** Tap the ⚙️ Settings icon in bottom nav (5th tab, between Weather and nothing).

**Settings screen layout:**
1. **Unit System** — Toggle buttons (Metric / Imperial) with live preview
2. **Time Format** — Toggle buttons (12-hour / 24-hour) with example
3. **Saved Locations** — Manage section: rename inline, reorder with drag or ↑↓ arrows
4. **Footer** — "Settings saved automatically" confirmation

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Unit persistence | localStorage key `moonbite_preferences` | Survives page reload; no account required |
| Preference scope | App-wide via `PreferencesService` signal | Every display component reads from single source of truth |
| Settings apply | Immediate (no "Save" button needed) | Reduce friction; users expect instant feedback |
| Imperial preset | US geolocation → imperial auto-selected | Sensible default; can toggle anytime |
| Time format | Matches device locale initially; user override persists | Minimize configuration for international users |
| Saved location rename | Inline edit or modal form (TBD) | Faster than navigation to separate screen |
| Saved location reorder | Drag-and-drop (touch-friendly) or ↑↓ buttons | Mobile-first; accessible to all abilities |
| Max reordering | 10 items (same as max saved locations from Feature 13) | No performance concern; UX remains clean |

### Accessibility (Fishing Context)

- Unit toggles have clear labels and visual feedback (selected state)
- Time format example shown in real-time as user toggles
- Rename form has `<label>` association; keyboard accessible
- Reorder buttons (↑↓) are ≥ 44×44px touch targets
- Settings changes announced via `aria-live="polite"` region
- All controls focusable; no color-only affordances

---

## UI Spec

### Settings Screen (`/settings`) — Default State

```
┌─────────────────────────────────────┐
│  ⚙️  Settings                        │  ← page header, $color-primary bg
├─────────────────────────────────────┤
│                                     │
│  UNITS                              │  ← section label, $color-text-secondary
│ ┌─────────────────────────────────┐ │
│ │  Unit System                    │ │  ← $color-surface, $radius-md
│ │  Metric / Imperial              │ │
│ │  ┌──────────┬──────────┐        │ │
│ │  │  Metric  │ Imperial │        │ │  ← segmented control, $color-primary fill
│ │  └──────────┴──────────┘        │ │
│ └─────────────────────────────────┘ │
│                                     │
│  DISPLAY                            │  ← section label
│ ┌─────────────────────────────────┐ │
│ │  Time Format              ╔═══╗ │ │
│ │  24-hour                  ║ ● ║ │ │  ← toggle switch, $color-primary-light
│ │                           ╚═══╝ │ │
│ └─────────────────────────────────┘ │
│                                     │
│  SAVED LOCATIONS                    │  ← section label
│ ┌─────────────────────────────────┐ │
│ │  📍 Home                   ✏️   │ │  ← location row
│ │─────────────────────────────────│ │
│ │  📍 Favorite Lake          ✏️   │ │
│ │─────────────────────────────────│ │
│ │  📍 Current GPS            ✏️   │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  🏠      🌙      ☀️      ☁️     ⚙️  │  ← bottom nav, ⚙️ active
└─────────────────────────────────────┘
```

### Rename Inline Edit — Active State

```
│ ┌─────────────────────────────────┐ │
│ │  📍 ┌────────────────────┐  ✓ ✗│ │  ← input, confirm/cancel icons
│ │     │ Favorite Lake      │     │ │
│ │     └────────────────────┘     │ │
│ │─────────────────────────────────│ │
│ │  📍 Current GPS            ✏️   │ │
│ └─────────────────────────────────┘ │
```

### Display Component Integration — Example (Weather Details)

**Before:** `24.5°C | 18.3 km/h | 1013.5 hPa | 2.5 mm`

**After (Imperial, 12h):** `76°F | 11.4 mph | 29.92 inHg | 0.10 in`

**After (Metric, 24h):** `24.5°C | 18.3 km/h | 1013.5 hPa | 2.5 mm`

### Component Breakdown

| Component | File | Responsibility |
|---|---|---|
| `SettingsComponent` | `settings/settings.component` | Page shell, section layout |
| `UnitSystemToggleComponent` | `settings/unit-system-toggle.component` | Segmented Metric/Imperial control |
| `ToggleSwitchComponent` | `settings/toggle-switch.component` | Reusable `role="switch"` toggle |
| `SavedLocationsListComponent` | `settings/saved-locations-list.component` | Location rows with rename state |
| `LocationRowComponent` | `settings/location-row.component` | Read view + inline edit view |

### Interaction Patterns

**Unit System Segmented Control**
- Two-segment control: "Metric" | "Imperial"
- Active: `$color-primary` bg, white text; inactive: `$color-surface-alt`, `$color-text-secondary`
- All four units (temperature, wind, precipitation, pressure) change atomically
- `$transition-base` (250ms) on background swap

**Time Format Toggle**
- `role="switch"`, `aria-checked` reflects state
- Label updates to "12-hour" / "24-hour" with current state

**Rename Inline Edit**
1. Tap ✏️ → name text replaced by `<input>` prefilled with current name; ✏️ → ✓ / ✗
2. Focus jumps to input automatically
3. Confirm (✓ or Enter): trim, validate non-empty (max 50 chars), commit to `SavedLocationsService`
4. Cancel (✗ or Escape): discard; return to read view
5. Only one row editable at a time

### Design Tokens

| Element | Token |
|---|---|
| Page header | `$color-primary` bg, `$color-surface` text |
| Section labels | `$color-text-secondary`, uppercase eyebrow (`<h2>` visually) |
| Settings cards | `$color-surface`, `$radius-md`, `1px $color-border` |
| Segmented control active | `$color-primary` bg, `$color-surface` text |
| Segmented control inactive | `$color-surface-alt`, `$color-text-secondary` |
| Toggle switch on | `$color-primary-light` track, white thumb |
| Toggle switch off | `$color-border` track, white thumb |
| Rename input focused | `$color-primary` border |
| Confirm icon | `$color-primary` |
| Cancel icon | `$color-error` |

### WCAG Accessibility Notes

- Segmented control: `role="group"` + `aria-label="Unit system"`; each segment is `<button aria-pressed>`
- Toggle: `role="switch"`, `aria-checked`; `aria-labelledby` from visible label; 44×44px touch target
- Rename input: `aria-label="Rename [location name]"`; confirm/cancel buttons have descriptive `aria-label`
- Focus returns to ✏️ after cancel; to location name text after save
- Escape always cancels; Enter always confirms
- Section labels rendered as `<h2>` for document structure
- `prefers-reduced-motion`: skip toggle animation, keep state instantaneous

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/preferences/preferences.model.ts` | `UserPreferences` interface |
| `src/app/preferences/preferences.service.ts` | CRUD + localStorage + reactive signal |
| `src/app/preferences/preferences.service.spec.ts` | Unit tests |
| `src/app/preferences/preferences.pipe.ts` | Pipes for unit conversion (optional; see below) |
| `src/app/preferences/unit-converter.service.ts` | Conversion logic (shared by pipes & services) |
| `src/app/preferences/unit-converter.service.spec.ts` | Unit tests |
| `src/app/settings/settings.component.ts` | Main settings screen (`/settings`) |
| `src/app/settings/settings.component.html` | Template |
| `src/app/settings/settings.component.scss` | Styles |
| `src/app/settings/settings.component.spec.ts` | Unit tests |
| `e2e/tests/settings.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Add `/settings` lazy route |
| `src/app/bottom-nav/bottom-nav.component.ts` | Add ⚙️ Settings tab (5th item) |
| `src/app/bottom-nav/bottom-nav.component.html` | Settings nav link |
| `src/app/bottom-nav/bottom-nav.component.scss` | Settings tab styles |
| `src/app/weather/weather-display.component.ts` | Inject `PreferencesService`; use converted values |
| `src/app/weather/weather-details.component.ts` | Inject `PreferencesService`; format output |
| `src/app/scoring/score-breakdown.component.ts` | Inject `PreferencesService`; convert pressure/wind |
| `src/app/solunar/solunar-display.component.ts` | Format peak times per `PreferencesService.timeFormat()` |
| `src/app/solunar/solunar-details.component.ts` | Format peak times per preference |
| `src/app/locations/saved-locations.component.ts` | Add rename modal + reorder UI + link to settings |
| `src/app/locations/saved-locations.service.ts` | Add `rename(id, newName)` method; add `order` field to `SavedLocation` |
| `src/app/app.config.ts` | Provide `PreferencesService` |

### `UserPreferences` Interface & `PreferencesService` API

```typescript
export interface UserPreferences {
  readonly unitSystem: 'metric' | 'imperial';      // default: inferred from geolocation
  readonly timeFormat: '12h' | '24h';              // default: inferred from device locale
  readonly savedLocationOrder: string[];           // array of SavedLocation IDs in display order
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly preferences: Signal<UserPreferences>;
  readonly unitSystem: Signal<'metric' | 'imperial'>;
  readonly timeFormat: Signal<'12h' | '24h'>;
  readonly savedLocationOrder: Signal<string[]>;

  // Setters (auto-persist to localStorage)
  setUnitSystem(system: 'metric' | 'imperial'): void;
  setTimeFormat(format: '12h' | '24h'): void;
  reorderSavedLocations(ids: string[]): void;

  // Getters for conversion helpers
  convertTemperature(celsius: number): number;         // returns °C or °F
  convertWindSpeed(kmh: number): number;               // returns km/h or mph
  convertPressure(hpa: number): number;                // returns hPa or inHg
  convertPrecipitation(mm: number): number;            // returns mm or in
  getTemperatureUnit(): '°C' | '°F';
  getWindSpeedUnit(): 'km/h' | 'mph';
  getPressureUnit(): 'hPa' | 'inHg';
  getPrecipitationUnit(): 'mm' | 'in';
  formatTime(hh24: number, mm: number): string;       // e.g., "2:34 PM" or "14:34"
}
```

### Unit Conversion Formulas

```typescript
// Temperature: (°C × 9/5) + 32 = °F
celsius: 24.5 → fahrenheit: 76.1 → display: 76°F (rounded)

// Wind: km/h ÷ 1.609 = mph
kmh: 18.3 → mph: 11.4 → display: 11.4 mph

// Pressure: hPa ÷ 33.864 = inHg
hpa: 1013.5 → inhg: 29.92 → display: 29.92 inHg

// Precipitation: mm ÷ 25.4 = inches
mm: 2.5 → inches: 0.098 → display: 0.10 in
```

### `SavedLocationsService` Update

Add to `SavedLocation` interface:

```typescript
interface SavedLocation {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly createdAt: string;
  readonly order?: number;  // NEW: sort position (0-indexed)
}

class SavedLocationsService {
  // Existing methods
  add(name, lat, lng): SavedLocation | null;
  remove(id): void;
  setActive(id | null): void;

  // NEW methods for Feature 14
  rename(id: string, newName: string): void;           // updates name; persists
  reorder(ids: string[]): void;                        // reorders by ID array
  getOrdered(): Signal<SavedLocation[]>;               // computed sorted list
}
```

---

## Acceptance Criteria

```gherkin
Feature: User Settings & Preferences

  Scenario: Access settings from bottom nav
    Given the user is on any screen
    When the user taps the ⚙️ Settings tab in the bottom nav
    Then the /settings screen loads
    And the user sees "Units", "Time Format", and "Saved Locations" sections

  Scenario: Toggle unit system to imperial
    Given the user is on /settings with unit system set to Metric
    When the user taps the "Imperial" button
    Then "Imperial" becomes selected
    And a preview shows "72°F | 8.9 mph | 30.12 inHg"

  Scenario: Unit changes apply app-wide
    Given the user switches to Imperial on /settings
    When the user navigates to /weather
    Then all temperatures display in °F
    And all wind speeds display in mph
    And all pressures display in inHg

  Scenario: Toggle time format to 24-hour
    Given the user is on /settings with "12-hour (12:34 AM)" selected
    When the user taps "24-hour"
    Then "24-hour" becomes selected
    And an example time displays as "14:34"

  Scenario: Time format changes apply to solunar details
    Given the user switches to 24-hour format on /settings
    When the user navigates to /solunar
    Then all peak times display in HH:MM format (e.g., "14:30" not "2:30 PM")

  Scenario: Preferences persist across sessions
    Given the user sets unit system to Imperial and time format to 24-hour
    When the user closes and reopens the app
    Then Imperial and 24-hour remain selected

  Scenario: Rename saved location from settings
    Given the user is on /settings with saved location "Lake Tahoe"
    When the user taps "Edit" or inline name field
    Then a rename form appears
    When the user types "South Tahoe" and taps "Save"
    Then the location is renamed in the list
    And the name persists across sessions

  Scenario: Reorder saved locations by drag
    Given the user is on /settings with 3 saved locations
    When the user drags "Home Waters" above "Lake Tahoe"
    Then "Home Waters" moves to the top of the list
    And the new order persists

  Scenario: Reorder saved locations with arrow buttons
    Given the user is on /settings with arrow buttons next to each location
    When the user taps the ↓ button next to "Lake Tahoe"
    Then "Lake Tahoe" moves down one position
    And locations are reordered instantly

  Scenario: Settings saved confirmation
    Given the user makes any preference change on /settings
    Then a "✓ Settings saved automatically" message appears
    And no manual save button is required

  Scenario: Preference defaults on fresh install
    Given a new user has never opened MoonBite before
    When the app loads
    Then unit system defaults to Metric (or Imperial if US geolocation detected)
    And time format defaults to 12-hour (or 24-hour if non-US locale detected)

  Scenario: Unit conversion accuracy
    Given the user selects Imperial units
    When the user views weather data showing 24.5°C
    Then the display shows "76°F" (rounded to nearest degree)
    And wind "18.3 km/h" displays as "11.4 mph"
    And pressure "1013.5 hPa" displays as "29.92 inHg"
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Settings screen load time | < 300ms |
| Unit conversion accuracy | 100% (±0.1 tolerance for rounding) |
| Preference persistence | 100% — survives reload |
| Rename success rate | 100% — updates immediately and persists |
| Reorder UX satisfaction | ≥ 80% (A/B test if drag vs. arrows) |
| Settings adoption (US market) | ≥ 50% of users switch to Imperial within first week |
| Unit test coverage | ≥ 85% (statements, branches, functions, lines) |
| WCAG 2.1 AA compliance | All toggles, forms, and buttons properly labelled and focusable |

---

## Implementation Notes (Post-Implementation)

### What was built (vs. spec)

| Spec item | Actual implementation | Notes |
|---|---|---|
| `preferences.model.ts` | Created — `UnitSystem`, `TimeFormat`, `UserPreferences` | Exactly as specced |
| `preferences.service.ts` | Created — all conversion + `formatTime` methods | `formatTime` accepts ISO string (not `hh24, mm` numbers) |
| `settings.component.ts` | Created — single flat component (no sub-components) | Sub-components (`UnitSystemToggleComponent`, etc.) skipped; single component simpler for v1 |
| Unit conversion integration | `weather-details`, `weather-display`, `solunar-details` all updated | Score breakdown component not touched (no unit-sensitive values in spec) |
| `SavedLocationsService` | `rename()` and `reorder()` added; no `order` field on model | Reorder stores `id[]` ordering directly; display order derives from `reorder()` call |
| Drag-and-drop reorder | **Not implemented** — ✏️ rename only in v1 | Drag UX deferred; arrow buttons also deferred; reorder method exists but no UI for it |
| Keyboard rename | Enter to confirm, Escape to cancel | Added after initial code review (blocker fix) |

### Key implementation decisions

- **`formatTime(isoString)`** — uses `getUTCHours()/getUTCMinutes()` directly rather than `Intl.DateTimeFormat`; solunar ISO strings are always UTC, so UTC extraction is correct.
- **Pressure conversion factor** — `hPa / 33.8639` (not 33.864); test confirmed `1013.5 → 29.93 inHg` (not 29.92).
- **No pipes** — conversion happens in `computed()` signals inside components; no Angular pipe needed for v1.
- **Branch coverage fix** — added direct signal tests for null-weather guards and imperial branches in weather-details/display specs, plus localStorage primitive-value test in preferences spec.
- **localStorage isolation** — weather-display spec needed `beforeEach/afterEach(() => localStorage.clear())` to prevent imperial state leaking across test files.

### Files created / modified

| File | Action |
|---|---|
| `src/app/preferences/preferences.model.ts` | Created |
| `src/app/preferences/preferences.service.ts` | Created |
| `src/app/preferences/preferences.service.spec.ts` | Created (63 tests) |
| `src/app/settings/settings.component.ts` | Created |
| `src/app/settings/settings.component.html` | Created |
| `src/app/settings/settings.component.scss` | Created |
| `src/app/settings/settings.component.spec.ts` | Created (10 tests) |
| `src/app/locations/saved-locations.service.ts` | Updated — `rename()`, `reorder()` |
| `src/app/locations/saved-locations-rename-reorder.spec.ts` | Created (20 tests) |
| `src/app/app.routes.ts` | Updated — lazy `/settings` route |
| `src/app/bottom-nav/bottom-nav.component.ts` | Updated — 5th ⚙️ tab |
| `src/app/bottom-nav/bottom-nav.component.spec.ts` | Updated — tab count 4→5 |
| `src/app/weather/weather-details.component.ts` | Updated — PreferencesService + display signals |
| `src/app/weather/weather-details.component.spec.ts` | Updated — imperial + null-state signal tests |
| `src/app/weather/weather-display.component.ts` | Updated — PreferencesService + display signals |
| `src/app/weather/weather-display.component.spec.ts` | Updated — imperial signal tests + localStorage isolation |
| `src/app/solunar/solunar-details.component.ts` | Updated — `formatTime` delegates to PreferencesService |
| `src/app/solunar/solunar-details.component.spec.ts` | Updated — 5 formatTime expectation fixes |
| `e2e/tests/settings.spec.ts` | Created (45 acceptance tests; 3 skipped pending live API) |

### Coverage result

| Metric | Result | Threshold |
|---|---|---|
| Statements | 96.33% | 85% ✓ |
| Branches | 85.28% | 85% ✓ |
| Functions | 92.16% | 85% ✓ |
| Lines | 98.51% | 85% ✓ |

---

## Original Architecture Notes (Pre-Implementation)

- **localStorage key:** `moonbite_preferences` (JSON object with `unitSystem`, `timeFormat`, `savedLocationOrder`)
- **Default detection:** On first load, use `Intl.NumberFormat().resolvedOptions().locale` to infer time format; use US geolocation (from Feature 01) to default unit system to Imperial if available
- **Unit conversion rounding:** Temperature/pressure to 1 decimal place; wind/precipitation to 1–2 decimals depending on magnitude
- **Time formatting:** Use `Intl.DateTimeFormat` with `hour: '2-digit', minute: '2-digit', hour12: true/false` to respect device locale beyond settings
- **Rename validation:** Non-empty string, trimmed, max 50 characters
- **Reorder persistence:** Store array of IDs in `savedLocationOrder` signal; `SavedLocationsService.getOrdered()` returns sorted by this array
- **Drag-and-drop library:** Consider native HTML5 drag-drop API or lightweight library (e.g., `@angular/cdk/drag-drop`) if complexity warrants
- **Settings component:** Use standalone component with `OnPush` change detection; inject `PreferencesService`, `SavedLocationsService`, `ActiveLocationService`

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | Geolocation for default unit system |
| Feature 04 | Weather data with metric units for conversion |
| Feature 07 | SCSS design tokens (colors, spacing) |
| Feature 09 | Solunar peak times that will be reformatted |
| Feature 10 | Weather details screen that will use converted units |
| Feature 11 | Score breakdown that will display pressure/wind in user's units |
| Feature 12 | Bottom nav routing infrastructure |
| Feature 13 | Saved locations to rename/reorder |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Conversion formula errors | Unit tests with known values (e.g., 0°C = 32°F, 100°C = 212°F) |
| Preference not syncing to all screens | Use shared `PreferencesService` signal; test every affected component |
| Rename field max-length violated | Input validation + `maxlength` attribute on form |
| Reorder UX confusion | Provide both drag + arrows; A/B test with real users |
| Locale detection fails | Graceful fallback to Metric + 12-hour |
| localStorage quota exceeded | Max 10 locations + 1 preferences object << 5MB quota |

