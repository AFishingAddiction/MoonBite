# Feature 06 — App Shell & Home Screen

**Status:** Complete

## Overview

Replace the flat developer stack in `AppComponent` with a polished App Shell and `HomeComponent`. The home screen is the primary user-facing view for the MVP — it displays the daily fishing score prominently and organizes the four contributing data panels (location, moon phase, solunar, weather) in a clear, readable layout.

---

## User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-1 | angler | see a clear app header with the MoonBite name | I know what app I'm using |
| US-2 | angler | see today's fishing score large and prominently | I get the summary answer immediately |
| US-3 | angler | see a "Use My Location" prompt when no location is set | I understand the first action to take |
| US-4 | angler | see the moon phase, solunar, and weather cards after granting location | I can understand why my score is what it is |
| US-5 | angler | see today's date in the header | I know the score is current |

---

## UX Brief

### Core Concept

The home screen follows a **hero → context** pattern:

1. **App Shell Header** — App name, tagline, today's date. Sticky on scroll.
2. **Score Hero** — The composite fishing score displayed large. This is the primary message of the app.
3. **Location Bar** — Compact location display / CTA. Contextual — drives the rest of the data.
4. **Data Cards Grid** — Moon phase, solunar table, weather conditions. Below the fold on small screens; beside each other on wider displays.

### Information Hierarchy

```
┌──────────────────────────────────────────┐
│  🎣 MoonBite              Sat, Apr 4     │  ← App Header (sticky)
│  Your daily fishing intelligence          │
├──────────────────────────────────────────┤
│                                          │
│     ┌────────────────────────────┐       │
│     │    🎣 Today's Score        │       │  ← Score Hero (full-width)
│     │         78 / 100           │       │
│     │  Moon ██ · Sol ██ · Wx ██  │       │
│     └────────────────────────────┘       │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  📍 Location                       │  │  ← Location Bar
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────┐ ┌─────────────────┐  │
│  │  🌙 Moon Phase │ │ ☀️ Solunar Table│  │  ← Data Cards (2-col on md+)
│  └────────────────┘ └─────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  🌤️ Weather Conditions             │  │  ← Full-width on all sizes
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

---

## UI Spec

### App Shell (`AppComponent`)

**Selector:** `app-root`

**Layout:** Vertical flex column — `header` + `<router-outlet>` fills remaining height.

**Header (`app-shell__header`):**
- Left: `🎣 MoonBite` logotype (h1, visually styled as brand, not a page title)
- Right: today's date formatted as `Weekday, Mon D` (e.g., "Sat, Apr 4")
- Tagline: `Your daily fishing intelligence` — secondary text below the logotype
- Background: `$color-primary` (dark green)
- Text: `$color-text-on-dark`
- Sticky (`position: sticky; top: 0`)
- Box shadow on scroll implied by design

**CSS classes:**
```
.app-shell
.app-shell__header
.app-shell__brand
.app-shell__logo-icon
.app-shell__logo-text
.app-shell__tagline
.app-shell__date
```

---

### Home Screen (`HomeComponent`)

**Selector:** `app-home`
**Route:** `''` (default)

**Layout:** Single-column vertical stack with `max-width: 720px`, horizontally centered.

**Sections (in DOM order):**
1. `home__score-hero` — wraps `<app-fishing-score-display>`; full-width
2. `home__location` — wraps `<app-location-display>`; full-width
3. `home__data-grid` — CSS grid, 1 column on mobile, 2 columns on `≥ $bp-md`
   - Cell 1: `<app-moon-phase-display>`
   - Cell 2: `<app-solunar-display>`
4. `home__weather` — wraps `<app-weather-display>`; full-width (always)

**CSS classes:**
```
.home
.home__score-hero
.home__location
.home__data-grid
.home__weather
```

**States:**
- All sub-components manage their own loading/error/data states internally — `HomeComponent` is layout-only.

**Interaction:**
- No additional interaction at the home level.
- All card interactions (e.g., "Use My Location") handled inside sub-components.

---

## Architecture Notes

### Component Structure

```
AppComponent (shell)
  └─ app-shell__header (inline in template)
  └─ <router-outlet>
       └─ HomeComponent (route: '')
            ├─ <app-fishing-score-display>
            ├─ <app-location-display>
            ├─ <app-moon-phase-display>
            ├─ <app-solunar-display>
            └─ <app-weather-display>
```

### New Files

| File | Purpose |
|------|---------|
| `src/app/home/home.component.ts` | Standalone `HomeComponent` |
| `src/app/home/home.component.html` | Home screen layout template |
| `src/app/home/home.component.scss` | Home screen layout styles |
| `src/app/home/home.component.spec.ts` | Unit tests |
| `e2e/tests/home.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.component.ts` | Add `DatePipe`, remove sub-component imports (moved to `HomeComponent`) |
| `src/app/app.component.html` | Replace flat stack with header shell + `<router-outlet>` |
| `src/app/app.component.scss` | Add `.app-shell` layout styles |
| `src/app/app.routes.ts` | Add `{ path: '', component: HomeComponent }` |
| `src/app/app.component.spec.ts` | Update tests to match new shell structure |

### Routing

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
];
```

### Signal / Date Integration

`AppComponent` exposes `todayLabel` as a computed string using `new Date()` — no service needed.

---

## Acceptance Criteria

### App Shell

```gherkin
Scenario: App header renders brand
  Given the user navigates to "/"
  Then the page contains the text "MoonBite"
  And the page contains the text "Your daily fishing intelligence"
  And today's date is displayed in the header

Scenario: App header is sticky
  Given the page has scrollable content
  When the user scrolls down
  Then the header remains visible at the top

Scenario: Header has sufficient colour contrast
  Given the header uses $color-primary as background
  Then text colour meets WCAG AA contrast ratio (≥ 4.5:1)
```

### Home Screen Layout

```gherkin
Scenario: Home screen renders all data panels
  Given the user is on the home screen
  Then the fishing score section is present
  And the location section is present
  And the moon phase section is present
  And the solunar section is present
  And the weather section is present

Scenario: Fishing score is the first data panel
  Given the user is on the home screen
  Then "Fishing Score" appears before the location bar
  And location bar appears before moon phase and solunar

Scenario: Route "/" renders home screen
  Given the user navigates to "/"
  Then HomeComponent is rendered inside the router outlet
```

### Routing

```gherkin
Scenario: Default route loads home
  Given the app boots at "/"
  When the page renders
  Then all five data panels are visible
  And the URL remains "/"
```

---

## Non-Functional Requirements

- **Performance:** `HomeComponent` is layout-only; it adds no signals, HTTP calls, or effects.
- **Accessibility:** Header landmark uses `<header role="banner">`. Main content uses `<main>`. `<router-outlet>` lives inside `<main>`.
- **Responsive:** Single-column stack on mobile; moon + solunar side-by-side at `≥ 768px`.
- **SCSS:** All new `.scss` files must `@use 'variables' as *` and `@use 'mixins' as *`. All class names must be defined.

---

## Implementation Notes

- `AppComponent` now renders only the sticky header shell + `<router-outlet>`. All sub-components moved to `HomeComponent`.
- `HomeComponent` is layout-only (no signals, no HTTP). All data state lives in sub-components.
- Removed `this.geoService.requestLocation()` auto-calls from `SolunarDisplayComponent` and `WeatherDisplayComponent` constructors. Location must be initiated explicitly via the `LocationDisplayComponent` CTA. Both components handle `'idle'` state by showing loading skeletons (`isLocating()` includes `'idle'`).
- E2E specs for Features 01, 04, 05 updated to work with explicit user-initiated location grant rather than relying on auto-call.
- 354 unit tests pass; 42/42 E2E tests pass; coverage ≥ 85% on all metrics.

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `LocationDisplayComponent` |
| Feature 02 | `MoonPhaseDisplayComponent` |
| Feature 03 | `SolunarDisplayComponent` |
| Feature 04 | `WeatherDisplayComponent` |
| Feature 05 | `FishingScoreDisplayComponent` |
