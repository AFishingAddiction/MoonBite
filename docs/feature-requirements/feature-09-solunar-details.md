# Feature 09 — Solunar Peak Times Details Screen

**Status:** Complete

## Overview

Transform the compact solunar table card on the home screen into a full-page details view at route `/solunar`. The details screen expands on the daily solunar period data and adds contextual insights: a detailed periods list with times and durations, key transit stats (moon overhead / moon underfoot), a rating-keyed fishing advice blurb, and a 7-day solunar forecast strip.

All data comes from the existing `SolunarService` — no new backend APIs are required. Unlike the Moon Details screen (Feature 08), solunar calculations are **location-dependent**: the screen must gracefully handle all geolocation states (idle, requesting, denied, unavailable, granted).

The details screen reinforces MoonBite's core value proposition: solunar peak periods are actionable windows for fishing success. Users who tap the solunar card gain a richer understanding of when to fish and why those windows are optimal.

---

## User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-1 | angler | tap the solunar card on home to see more detail | I can understand peak fishing times in depth |
| US-2 | angler | see today's four solunar periods with exact times | I know precisely when to be on the water |
| US-3 | angler | see moon overhead and moon underfoot transit times as key stats | I understand the celestial events driving the periods |
| US-4 | angler | see the next 7 days of solunar ratings in a mini forecast | I can plan multi-day fishing trips around optimal windows |
| US-5 | angler | read fishing advice specific to today's solunar rating | I understand how today's lunar phase affects my chances |
| US-6 | angler | see a clear message when location is unavailable | I know why solunar data cannot be displayed |
| US-7 | angler | navigate back to home from the details screen | I can return to the main dashboard easily |

---

## UX Brief

Users arrive at the solunar details screen from two sources:
1. Tapping the solunar table card on the home screen
2. Direct navigation (e.g., `/solunar` deep link)

**Geolocation dependency:** Unlike the moon details screen, solunar is location-dependent. The screen must handle four distinct states:
- **Idle:** "Share your location to see solunar details"
- **Requesting:** Skeleton loading state
- **Error/Denied/Unavailable:** "Location unavailable" message
- **Granted:** Full details view

The screen follows a **top-to-bottom story arc** when data is available:

1. **Back Navigation** — `← Back to Home` link at the top
2. **Hero Section** — Title ("Solunar Table"), date, rating stars (★★★☆), fishing score bar
3. **Stats Grid** — 4 key metrics: Rating, Score, Moon Overhead time, Moon Underfoot time
4. **Today's Peak Periods** — Full list of 2–4 solunar periods: type (MAJOR/MINOR), description, duration, time range
5. **Fishing Conditions** — Rating-keyed advice blurb
6. **7-Day Forecast Strip** — Mini cards for today + 6 days ahead, each showing date, rating stars, and score

**Mobile-First Responsive Design:**
- Mobile (< 768px): Single-column layout, forecast cards scroll horizontally
- Tablet/Desktop (≥ 768px): Stats grid 4-col in one row, forecast fills one row without scroll
- Dark theme throughout; consistent tokens with home screen solunar card

---

## UI Spec

### Route & Component

**Route:** `/solunar`
**Component:** `SolunarDetailsComponent`
**Selector:** `app-solunar-details`

### 1. Component Breakdown (BEM Naming)

| Block / Element | HTML Element | Purpose |
|---|---|---|
| `.solunar-detail` | `<main>` | Page root, `role="main"` |
| `.solunar-detail__back-link` | `<a>` | Back navigation, `routerLink="/"` |
| `.solunar-detail__state-card` | `<section>` | Idle / loading / error state container |
| `.solunar-detail__hero` | `<section>` | Hero: title, date, rating stars, score bar |
| `.solunar-detail__hero-title` | `<h1>` | "Solunar Table" heading |
| `.solunar-detail__hero-date` | `<p>` | Today's UTC date |
| `.solunar-detail__rating-stars` | `<span>` | Rating star string (★★★☆) |
| `.score-bar` etc. | `<div>` | Identical score bar pattern to Feature 08 |
| `.solunar-detail__stats` | `<section>` | 2-col (mobile) / 4-col (tablet+) stats grid |
| `.solunar-detail__stat-grid` | `<div>` | CSS grid container |
| `.solunar-detail__stat` | `<div>` | Individual stat cell |
| `.solunar-detail__stat-value` | `<span>` | Numeric/text value, large bold |
| `.solunar-detail__stat-value--time` | modifier | Smaller font for HH:MM UTC values |
| `.solunar-detail__stat-value--stars` | modifier | Accent color for star ratings |
| `.solunar-detail__stat-label` | `<span>` | Uppercase caption |
| `.solunar-detail__periods-section` | `<section>` | Today's periods list section |
| `.solunar-detail__section-title` | `<h2>` | Section heading |
| `.solunar-detail__periods` | `<div>` | Periods list container (`role="list"`) |
| `.solunar-detail__period` | `<div>` | Single period row (`role="listitem"`) |
| `.solunar-detail__period--major` | modifier | Dark-alt background for major periods |
| `.solunar-detail__period-info` | `<div>` | Left column: type, description, duration |
| `.solunar-detail__period-type` | `<span>` | MAJOR / MINOR label (accent, uppercase) |
| `.solunar-detail__period-desc` | `<span>` | Period description (e.g., "Moon Overhead") |
| `.solunar-detail__period-duration` | `<span>` | Duration in minutes |
| `.solunar-detail__period-time` | `<span>` | Time range (HH:MM – HH:MM UTC) |
| `.solunar-detail__polar-note` | `<p>` | Polar region note |
| `.solunar-detail__advice-section` | `<section>` | Fishing conditions advice section |
| `.solunar-detail__advice` | `<p>` | Advice copy text |
| `.solunar-detail__forecast` | `<section>` | 7-day forecast strip |
| `.solunar-detail__forecast-list` | `<ol>` | Ordered list of 7 day cards |
| `.solunar-detail__forecast-card` | `<li>` | Individual day card |
| `.solunar-detail__forecast-card--today` | modifier | Accent border for today |
| `.solunar-detail__forecast-date` | `<span>` | Short date ("MM-DD") |
| `.solunar-detail__forecast-rating` | `<span>` | Rating stars |
| `.solunar-detail__forecast-score` | `<span>` | Score (colored by tier) |
| `.solunar-detail__visually-hidden` | `<h2>` | Screen-reader-only headings |

### 2. Mobile Wireframe (< 768px)

```
┌──────────────────────────────────┐
│  🎣 MoonBite          Apr 5 2026 │  ← sticky header (existing)
├──────────────────────────────────┤
│                                  │
│  ← Back to Home                  │  back link
│                                  │
│  ┌────────────────────────────┐  │
│  │  Solunar Table             │  │  hero section
│  │  2026-04-05                │  │
│  │  ★★★☆                      │  │  rating stars
│  │                            │  │
│  │  ████████████████░░  [90]  │  │  score bar
│  └────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │  ★★★☆   │  │    90        │  │  stats grid
│  │ RATING   │  │    SCORE     │  │  (2 cols, 2 rows)
│  ├──────────┤  ├──────────────┤  │
│  │ 14:32 UTC│  │  02:32 UTC   │  │
│  │ OVERHEAD │  │  UNDERFOOT   │  │
│  └──────────┘  └──────────────┘  │
│                                  │
│  Today's Peak Periods            │
│  ┌────────────────────────────┐  │
│  │ MAJOR  Moon Overhead 120m  │  │
│  │               13:32-15:32  │  │
│  ├────────────────────────────┤  │
│  │ MINOR  Moonrise       60m  │  │
│  │               08:32-09:32  │  │
│  ├────────────────────────────┤  │
│  │ MINOR  Moonset        60m  │  │
│  │               20:32-21:32  │  │
│  ├────────────────────────────┤  │
│  │ MAJOR  Moon Underfoot 120m │  │
│  │               01:32-03:32  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Fishing Conditions        │  │  advice
│  │  Peak solunar conditions…  │  │
│  └────────────────────────────┘  │
│                                  │
│  7-Day Solunar Forecast          │
│  ┌────┬────┬────┬────┬────┬────┬────┐
│  │04-5│04-6│04-7│04-8│04-9│4-10│4-11│
│  │★★★☆│★★☆☆│★★★★│★☆☆☆│★☆☆☆│★★★☆│★★☆☆│
│  │ 90 │ 70 │100 │ 70 │ 70 │ 90 │ 70 │
│  └────┴────┴────┴────┴────┴────┴────┘
│       (horizontal scroll on mobile)  │
└──────────────────────────────────┘
```

### 3. Tablet+ Wireframe (≥ 768px)

```
┌────────────────────────────────────────────────────┐
│  🎣 MoonBite                          Apr 5 2026   │  sticky header
├────────────────────────────────────────────────────┤
│                  max-width 720px centered           │
│                                                    │
│  ← Back to Home                                    │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Solunar Table      ★★★☆    2026-04-05       │  │  hero
│  │  ████████████████░░░░░░░░  [90]               │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │  ★★★☆   │   90     │ 14:32 UTC│ 02:32 UTC │    │  stats: 4-col
│  │  RATING  │  SCORE   │ OVERHEAD │ UNDERFOOT │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│                                                    │
│  Today's Peak Periods                              │
│  [period rows — same as mobile]                    │
│                                                    │
│  Fishing Conditions                                │
│  [advice text]                                     │
│                                                    │
│  7-Day Solunar Forecast                            │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐│
│  │ 04-5 │ 04-6 │ 04-7 │ 04-8 │ 04-9 │ 4-10 │ 4-11 ││
│  │ ★★★☆ │ ★★☆☆ │ ★★★★ │ ★☆☆☆ │ ★☆☆☆ │ ★★★☆ │ ★★☆☆ ││
│  │  90  │  70  │ 100  │  70  │  70  │  90  │  70  ││
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘│
│       (no scroll at tablet — all 7 fit in row)     │
└────────────────────────────────────────────────────┘
```

### 4. Detailed Layout Description

#### Back Navigation
- Same pattern as `moon-details.component.scss`.
- Color: `$color-text-on-dark-secondary` at rest; `$color-text-on-dark` + underline on hover.
- Focus-visible: `@include focus-ring`.

#### Hero Section
- Background: `$color-surface-dark` card, `$radius-lg` corners, `$shadow-dark`. Padding: `$space-xl $space-lg $space-lg`.
- Title `<h1>`: `$font-size-xl`, `$font-weight-bold`, `$color-accent`.
- Date: `$font-size-sm`, `$color-text-on-dark-secondary`.
- Rating stars: `$font-size-xl`, `$color-accent`, `letter-spacing: 2px`.
- Score bar: identical pattern to Feature 08 (track height 12px, animated fill, pill badge).

#### Stats Grid
- Same structure as Feature 08 stats grid.
- Mobile: 2×2 grid. Tablet+: 4×1 grid.
- Stat values: `$font-size-xl`, `$font-weight-bold`, `$color-text-on-dark`.
- Time values (modifier `--time`): `$font-size-base` to fit "HH:MM UTC" on one line.
- Star values (modifier `--stars`): `$color-accent`, `letter-spacing: 2px`.
- Stat labels: `$font-size-xs`, uppercase, `$letter-spacing-caps`.

#### Periods Section
- Full-width card, `$color-surface-dark` background, `$radius-lg`, `$shadow-dark`.
- Each period row: flex row, space-between; major periods use `$color-surface-dark-alt` background.
- Left side: type label (MAJOR/MINOR, `$color-accent`, uppercase, `$font-size-xs`), description (`$color-text-on-dark`), duration (`$color-text-on-dark-secondary`, `$font-size-xs`).
- Right side: time range (`$color-text-on-dark-secondary`, `$font-size-xs`, `white-space: nowrap`).
- Polar note: italic, `$color-text-on-dark-secondary`, centered.

#### Fishing Conditions Section
- Background: `$color-surface-dark`, `$radius-lg`, `$shadow-dark`.
- Same structure as Feature 08 score section.

#### 7-Day Forecast Strip
- Same horizontal scroll / snap pattern as Feature 08 forecast.
- Cards: date (MM-DD), rating stars (compact), score badge (colored text).
- Today modifier: `border: 2px solid $color-accent`.

### 5. SCSS Design Token Usage

All tokens are from the existing `src/styles/_variables.scss`. No new global tokens required.

### 6. Interaction Patterns

- **Back Link:** Same hover/focus pattern as Feature 08.
- **Score Bar Fill:** `afterNextRender()` + `scoreReady` signal + `--score-target-width` CSS custom property.
- **Forecast Card Hover:** `translateY(-2px)` + `$shadow-dark-hover`, wrapped in `@media (hover: hover)`.
- **`prefers-reduced-motion`:** Skip transitions, no translate on hover.

### 7. Accessibility Notes

**Landmark structure:**
```
<header>        ← existing sticky app header
<main class="solunar-detail">
  <nav aria-label="Page navigation">   ← wraps back link
  <section aria-labelledby="solunar-hero-heading">
  <section aria-labelledby="solunar-stats-heading">   ← visually hidden h2
  <section aria-labelledby="solunar-periods-heading">
  <section aria-labelledby="solunar-advice-heading">
  <section aria-labelledby="solunar-forecast-heading">
```

**ARIA annotations:**

| Element | Requirement |
|---|---|
| Rating stars spans | `aria-hidden="true"` + container has `aria-label` with full rating text |
| Score bar track | `role="meter" aria-valuenow aria-valuemin="0" aria-valuemax="100"` |
| Back link | `aria-label="Back to Home"` |
| Periods container | `role="list" aria-label="Solunar periods"` |
| Each period | `role="listitem"` + `aria-label` with full readable phrase |
| Forecast list | `<ol aria-label="7-day solunar forecast">` |
| Today forecast card | `aria-current="date"` |
| State cards | `aria-busy="true"` when loading |

---

## Fishing Advice Copy

Static lookup keyed by solunar `rating` (1–4):

| Rating | When | Advice |
|--------|------|--------|
| 4 | New moon / Full moon | Peak solunar conditions — new and full moons amplify feeding activity. Major periods are prime windows; plan your outing around them for maximum results. |
| 3 | Quarter moon | Strong solunar activity at a quarter moon. Major transit windows are highly productive — time your casts to peak periods for the best action. |
| 2 | Mid-cycle | Moderate solunar influence today. Fish are active but selective — focus on cover, structure, and transition areas during major periods. |
| 1 | Low-activity phases | Lower solunar intensity today. Patience pays off — target feeding edges and work slower presentations during the major transit windows. |

---

## Architecture Notes

### New Files

| File | Purpose |
|------|---------|
| `src/app/solunar/solunar-details.component.ts` | Standalone `OnPush` component with signals |
| `src/app/solunar/solunar-details.component.html` | Template: hero, stats, periods, advice, forecast |
| `src/app/solunar/solunar-details.component.scss` | Mobile-first responsive styles |
| `src/app/solunar/solunar-details.component.spec.ts` | Unit tests (≥85% coverage) |
| `e2e/tests/solunar-details.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Add `{ path: 'solunar', loadComponent: () => import(...) }` |
| `src/app/solunar/solunar-display.component.html` | Wrap card in `<a routerLink="/solunar">` |
| `src/app/solunar/solunar-display.component.ts` | Add `RouterLink` to imports |
| `src/app/solunar/solunar-display.component.scss` | Add `.solunar-display__link` wrapper style |
| `src/app/solunar/solunar-display.component.spec.ts` | Add `provideRouter([])` to TestBed |

### Component Sketch

```typescript
@Component({
  selector: 'app-solunar-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SlicePipe],
})
export class SolunarDetailsComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly solunarService = inject(SolunarService);

  readonly geoState = this.geoService.state;
  readonly isIdle = computed(() => this.geoState().status === 'idle');
  readonly isLocating = computed(() => ['idle', 'requesting'].includes(this.geoState().status));
  readonly hasError = computed(() => ['denied', 'unavailable', 'error'].includes(this.geoState().status));

  readonly solunarData = computed<SolunarData | null>(() => {
    const state = this.geoState();
    if (state.status !== 'granted' || !state.position) return null;
    const { latitude, longitude } = state.position.coords;
    return this.solunarService.calculateForToday(latitude, longitude);
  });

  readonly isPolar = computed(() => this.solunarData()?.moonriseUtc === null);
  readonly scoreReady = signal(false);
  readonly scorePercent = computed(() => `${this.solunarData()?.fishingScoreContribution ?? 0}%`);
  readonly ratingStars = computed(() => { ... });
  readonly scoreTierClass = computed((): 'good' | 'fair' | 'poor' => { ... });
  readonly advice = computed(() => RATING_ADVICE[this.solunarData()?.rating ?? 1]);

  readonly forecastDays = computed<SolunarData[]>(() => {
    // location-dependent 7-day forecast
  });

  constructor() { afterNextRender(() => this.scoreReady.set(true)); }

  formatTime(isoString: string): string { /* HH:MM UTC */ }
  forecastRatingStars(rating: 1 | 2 | 3 | 4): string { /* ★★☆☆ */ }
  periodAriaLabel(period: SolunarPeriod): string { /* accessible label */ }
}
```

### Service Reuse

No new services. Uses:
- `SolunarService` (Feature 03): `calculateForToday(lat, lng)`, `calculateForDateString(date, lat, lng)`
- `GeolocationService` (Feature 01): `state` signal for location status and coordinates

---

## Acceptance Criteria

```gherkin
Feature: Solunar Peak Times Details Screen

  Scenario: Navigate to solunar details from home
    Given the user is on the home screen
    And location has been granted
    When the user clicks the solunar table card
    Then the browser navigates to "/solunar"
    And the solunar details screen is rendered

  Scenario: Direct navigation to /solunar works
    Given the user navigates directly to "/solunar"
    When the page loads
    Then the solunar details screen is rendered

  Scenario: Show location prompt when idle
    Given the user navigates to "/solunar"
    And geolocation status is idle
    Then a location prompt message is visible
    And the hero data section is not rendered

  Scenario: Show loading skeleton when requesting
    Given geolocation status is requesting
    When the page renders
    Then skeleton loading elements are visible
    And aria-busy="true" is set on the state card

  Scenario: Show error message when location denied
    Given geolocation status is denied or unavailable
    When the page renders
    Then an error message is visible
    And the hero data section is not rendered

  Scenario: Display hero section when location granted
    Given geolocation status is granted with a valid position
    When the page loads
    Then the h1 "Solunar Table" is visible
    And today's date is displayed
    And rating stars are shown
    And a fishing score bar is rendered

  Scenario: Stats grid shows all four metrics
    Given location is granted
    When the page loads
    Then the stats grid shows Rating (stars)
    And Score (number)
    And Moon Overhead time (HH:MM UTC)
    And Moon Underfoot time (HH:MM UTC)

  Scenario: Score bar has accessible meter role
    Given the score section renders
    Then role="meter" is present on the score bar track
    And aria-valuenow matches the current score
    And aria-valuemin="0" and aria-valuemax="100" are set

  Scenario: Periods list shows correct count for non-polar location
    Given location is granted at a non-polar latitude
    When the periods section renders
    Then exactly 4 period rows are visible
    And each row shows type (MAJOR/MINOR), description, duration, and time range

  Scenario: Polar region shows 2 periods and note
    Given location is granted at latitude > 66.5°
    When the periods section renders
    Then exactly 2 period rows (major only) are visible
    And a note "Minor periods unavailable at this latitude" is shown

  Scenario: Period aria-labels are descriptive
    Given the periods section renders
    Then each period has an aria-label containing description and time range

  Scenario: Advice text is rating-specific
    Given the solunar rating is 4 (new/full moon)
    When the fishing conditions section renders
    Then the advice text mentions "Peak solunar conditions"

  Scenario: 7-day forecast renders 7 cards
    Given location is granted
    When the forecast section loads
    Then exactly 7 forecast cards are visible
    And each card shows a date, rating stars, and score

  Scenario: Today's forecast card is highlighted
    Given the forecast renders with today as the first card
    Then the first card has an accent border (today modifier)
    And carries aria-current="date"

  Scenario: Back navigation returns to home
    Given the user is on the solunar details screen
    When the user clicks "← Back to Home"
    Then the browser navigates to "/"

  Scenario: Back link is keyboard accessible
    Given the user presses Tab on the solunar details screen
    Then the back link receives focus
    And pressing Enter navigates to "/"
```

---

## Success Metrics

- **Tap-through rate from home → solunar details:** ≥ 25% of sessions with location granted
- **Period accuracy:** 100% (all periods match `SolunarService` output)
- **Advice coverage:** 100% (all 4 ratings have advice copy; no null/undefined)
- **Navigation reliability:** 100% (no 404 on `/solunar`; back link always works)
- **Unit test coverage:** ≥ 85% statements, branches, functions, lines
- **E2E test coverage:** All acceptance criteria verified in Playwright
- **WCAG 2.1 AA:** All contrast pairs pass; all interactive elements keyboard accessible

---

## Non-Functional Requirements

| Requirement | Acceptance |
|---|---|
| **Performance** | No new HTTP calls; all data from `SolunarService` |
| **Offline** | Fully functional without network |
| **Bundle Size** | < 15 KB incremental |
| **Accessibility** | WCAG 2.1 AA throughout |
| **Responsive** | ≤375px mobile through 1920px desktop |
| **Code Quality** | ESLint + Prettier pass; no `any`; strict TypeScript |

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService`, `GeolocationState` |
| Feature 03 | `SolunarService`, `SolunarData`, `SolunarPeriod` |
| Feature 06 | Home screen layout; solunar card becomes navigation origin |
| Feature 07 | Responsive SCSS tokens and breakpoints |

---

## Implementation Notes

### Files Created
- `src/app/solunar/solunar-details.component.ts` — Standalone `OnPush` component with signals; `forecastDays` as a `computed()` (location-dependent, unlike moon details which uses a readonly field)
- `src/app/solunar/solunar-details.component.html` — Angular `@if`/`@for` control flow; full ARIA landmark structure; all 4 geolocation states handled
- `src/app/solunar/solunar-details.component.scss` — Mobile-first, all design tokens, `prefers-reduced-motion` respected; score-bar pattern matches Feature 08
- `src/app/solunar/solunar-details.component.spec.ts` — 78 Jasmine unit tests covering all computed signals, geolocation states, DOM assertions, and helper methods

### Files Modified
- `src/app/app.routes.ts` — Added lazy `/solunar` route via `loadComponent`
- `src/app/solunar/solunar-display.component.html` — Wrapped card in `<a routerLink="/solunar">`
- `src/app/solunar/solunar-display.component.ts` — Added `RouterLink` to imports
- `src/app/solunar/solunar-display.component.scss` — Added `.solunar-display__link` wrapper style with focus ring
- `src/app/solunar/solunar-display.component.spec.ts` — Added `provideRouter([])` to both TestBed setups

### Key Decisions
- **`forecastDays` as `computed()` not readonly field:** Solunar requires lat/lng from geolocation; the field must be reactive to location state changes.
- **Geolocation state handling:** Mirrors the `SolunarDisplayComponent` pattern (idle/requesting/error/granted) so the details screen is consistent with the card it links from.
- **Stats grid shows transit times:** Moon Overhead and Moon Underfoot transit times (HH:MM UTC) are more actionable for anglers than raw period counts.
- **Advice keyed by `rating` (1–4):** Simpler than phase-name lookup; covers all possible service outputs with no undefined risk.
- **Forecast score as colored text:** Same WCAG AA rationale as Feature 08 — `$color-score-poor` (#e74c3c) fails 4.5:1 on dark-alt surfaces; falls back to secondary text color.

### Test Coverage
- 473/473 unit tests pass (all suites)
- Statements 99%, Branches 91.2%, Functions 100%, Lines 99.3% — all above 85% threshold
- E2E tests written in `e2e/tests/solunar-details.spec.ts` (30 scenarios)
