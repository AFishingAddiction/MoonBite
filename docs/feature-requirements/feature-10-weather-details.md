# Feature 10 — Weather Details Screen

**Status:** Complete

## Overview

Transform the compact weather card on the home screen into a full-page details view at route `/weather`. The details screen expands the current weather snapshot into a rich contextual view: a hero section with condition emoji and temperature, a 4-stat grid, a conditions breakdown card, a **Fishing Score Breakdown** showing how each weather factor (pressure, wind, clouds, precipitation) contributes to the total score, and a fishing advice blurb keyed by score tier.

All data comes from the existing `WeatherService` — one HTTP call (with 5-minute cache) is shared with the home card. No new backend APIs are required.

Unlike the Moon Details screen (Feature 08), weather data is **location-dependent** and **asynchronous**: the screen must gracefully handle all geolocation states (idle, requesting, denied, unavailable, granted) and the case where the HTTP fetch fails.

The details screen reinforces MoonBite's core value proposition: understanding *why* weather conditions are good or bad for fishing empowers anglers to plan smarter outings.

---

## User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-1 | angler | tap the weather card on home to see more detail | I can understand the weather conditions in depth |
| US-2 | angler | see the full weather conditions (temperature, wind, pressure, clouds) | I can decide whether conditions are suitable for fishing |
| US-3 | angler | see how each weather factor contributes to the fishing score | I understand exactly what is helping or hurting my chances |
| US-4 | angler | read fishing advice tailored to today's weather score | I know how to adapt my strategy to current conditions |
| US-5 | angler | see a clear message when location is unavailable | I know why weather data cannot be displayed |
| US-6 | angler | navigate back to home from the details screen | I can return to the main dashboard easily |

---

## UX Brief

Users arrive at the weather details screen from two sources:
1. Tapping the weather card on the home screen
2. Direct navigation (e.g., `/weather` deep link)

**Geolocation + async dependency:** Unlike the moon details screen, weather is location-dependent and fetched over HTTP. The screen must handle five distinct states:
- **Idle:** "Share your location to see weather details"
- **Requesting:** Skeleton loading state
- **Error/Denied:** Location unavailable message
- **Loading weather data:** Skeleton state (location granted, HTTP in flight)
- **Loaded:** Full details view

The screen follows a **top-to-bottom story arc** when data is available:

1. **Back Navigation** — `← Back to Home` link at the top
2. **Hero Section** — Weather emoji, condition name, date, temperature + feels-like, fishing score bar
3. **Stats Grid** — 4 key metrics: Temperature, Wind Speed, Pressure (with trend), Cloud Cover
4. **Conditions Card** — Feels Like, Precipitation, Wind Gusts, Pressure Trend detail
5. **Fishing Score Breakdown** — 4 factor rows (Pressure, Wind, Cloud Cover, Precipitation) each showing contribution score with a mini-bar
6. **Fishing Advice** — Score-tier-keyed advice blurb

**Mobile-First Responsive Design:**
- Mobile (< 768px): Single-column layout, stats grid 2×2
- Tablet/Desktop (≥ 768px): Stats grid 4×1 in one row
- Dark theme throughout; consistent tokens with home screen weather card

---

## UI Spec

### Route & Component

**Route:** `/weather`
**Component:** `WeatherDetailsComponent`
**Selector:** `app-weather-details`

### 1. Component Breakdown (BEM Naming)

| Block / Element | HTML Element | Purpose |
|---|---|---|
| `.weather-detail` | `<main>` | Page root, `role="main"` |
| `.weather-detail__back-link` | `<a>` | Back navigation, `routerLink="/"` |
| `.weather-detail__state-card` | `<section>` | Idle / loading / error state container |
| `.weather-detail__hero` | `<section>` | Hero: emoji, condition, date, temperature, score bar |
| `.weather-detail__hero-summary` | `<div>` | Flex row: emoji + title/date stack |
| `.weather-detail__hero-emoji` | `<span>` | Large weather emoji, `aria-hidden="true"` |
| `.weather-detail__hero-info` | `<div>` | Column: title + date |
| `.weather-detail__hero-title` | `<h1>` | Condition name ("Clear Sky") |
| `.weather-detail__hero-date` | `<p>` | Today's UTC date |
| `.weather-detail__hero-temp` | `<div>` | Temperature + feels-like row |
| `.weather-detail__temp` | `<span>` | Primary temperature, large bold |
| `.weather-detail__feels-like` | `<span>` | Feels-like secondary text |
| `.score-bar` etc. | `<div>` | Identical score bar pattern to Features 08 & 09 |
| `.weather-detail__stats` | `<section>` | 2-col (mobile) / 4-col (tablet+) stats grid |
| `.weather-detail__stat-grid` | `<div>` | CSS grid container |
| `.weather-detail__stat` | `<div>` | Individual stat cell |
| `.weather-detail__stat-value` | `<span>` | Value, large bold |
| `.weather-detail__stat-value--pressure` | modifier | Inline trend icon beside value |
| `.weather-detail__stat-label` | `<span>` | Uppercase caption |
| `.weather-detail__trend-icon` | `<span>` | ↑ / ↓ / → pressure trend icon, accent colour |
| `.weather-detail__conditions-section` | `<section>` | Conditions detail card |
| `.weather-detail__section-title` | `<h2>` | Section heading |
| `.weather-detail__conditions` | `<dl>` | Description list of conditions |
| `.weather-detail__condition-row` | `<div>` | dt/dd pair |
| `.weather-detail__condition-label` | `<dt>` | Factor name |
| `.weather-detail__condition-value` | `<dd>` | Factor value |
| `.weather-detail__gust-warning` | `<span>` | ⚠ icon for gusts > 30 km/h |
| `.weather-detail__impact-section` | `<section>` | Fishing score breakdown section |
| `.weather-detail__impact-list` | `<div>` | Factor list container (`role="list"`) |
| `.weather-detail__impact-row` | `<div>` | Single factor row (`role="listitem"`) |
| `.weather-detail__impact-info` | `<div>` | Label + score value |
| `.weather-detail__impact-label` | `<span>` | Factor name (Pressure, Wind…) |
| `.weather-detail__impact-value` | `<span>` | Score / max (e.g., "28/30") |
| `.weather-detail__impact-bar-track` | `<div>` | Mini bar background |
| `.weather-detail__impact-bar-fill` | `<div>` | Proportional fill |
| `.weather-detail__advice-section` | `<section>` | Fishing conditions advice |
| `.weather-detail__advice` | `<p>` | Advice copy text |
| `.weather-detail__visually-hidden` | element | Screen-reader-only headings |

### 2. Score Factor Maxima

| Factor | Max Points | Driver |
|--------|-----------|--------|
| Pressure | 40 | 40 × trend multiplier |
| Wind | 30 | Wind speed tier |
| Cloud Cover | 20 | Cloud percentage band |
| Precipitation | 10 | Precipitation mm |
| **Total** | **100** | |

### 3. Mobile Wireframe (< 768px)

```
┌──────────────────────────────────┐
│  🎣 MoonBite          Apr 6 2026 │  ← sticky header (existing)
├──────────────────────────────────┤
│                                  │
│  ← Back to Home                  │  back link
│                                  │
│  ┌────────────────────────────┐  │
│  │  ☀️  Clear Sky              │  │  hero section
│  │      2026-04-06            │  │
│  │  22°C  feels 20°C          │  │
│  │                            │  │
│  │  ████████████████░░  [82]  │  │  score bar
│  └────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │   22°C   │  │  12 km/h     │  │  stats grid
│  │   TEMP   │  │    WIND      │  │  (2 cols, 2 rows)
│  ├──────────┤  ├──────────────┤  │
│  │ 1018→hPa │  │    15%       │  │
│  │ PRESSURE │  │  CLOUD COVER │  │
│  └──────────┘  └──────────────┘  │
│                                  │
│  Conditions                      │
│  ┌────────────────────────────┐  │
│  │ Feels Like     │  20°C     │  │
│  │ Precipitation  │   0 mm    │  │
│  │ Wind Gusts     │  18 km/h  │  │
│  │ Pressure Trend │  → Steady │  │
│  └────────────────────────────┘  │
│                                  │
│  Fishing Score Breakdown         │
│  ┌────────────────────────────┐  │
│  │ Pressure   36/40  ████████ │  │
│  │ Wind       28/30  ███████░ │  │
│  │ Cloud      14/20  ██████░░ │  │
│  │ Precip     10/10  ████████ │  │
│  └────────────────────────────┘  │
│                                  │
│  Fishing Conditions              │
│  ┌────────────────────────────┐  │
│  │  Excellent fishing…        │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 4. Tablet+ Wireframe (≥ 768px)

```
┌────────────────────────────────────────────────────┐
│  🎣 MoonBite                          Apr 6 2026   │  sticky header
├────────────────────────────────────────────────────┤
│                  max-width 720px centered           │
│                                                    │
│  ← Back to Home                                    │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  ☀️  Clear Sky         2026-04-06             │  │  hero
│  │  22°C  feels 20°C                            │  │
│  │  ████████████████████░░░  [82]               │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │   22°C   │ 12 km/h  │ 1018→hPa │   15%    │    │  stats: 4-col
│  │   TEMP   │   WIND   │ PRESSURE │  CLOUDS  │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│                                                    │
│  Conditions         Fishing Score Breakdown        │
│  [dl rows]          [factor rows]                  │
│                                                    │
│  Fishing Conditions                                │
│  [advice text]                                     │
└────────────────────────────────────────────────────┘
```

### 5. Detailed Layout Description

#### Back Navigation
- Same pattern as `solunar-details.component.scss`.
- Color: `$color-text-on-dark-secondary` at rest; `$color-text-on-dark` + underline on hover.
- Focus-visible: `@include focus-ring`.

#### Hero Section
- Background: `$color-surface-dark` card, `$radius-lg` corners, `$shadow-dark`. Padding: `$space-xl $space-lg $space-lg`.
- Emoji: `$font-size-2xl`, `line-height: 1`, `aria-hidden="true"`.
- Title `<h1>`: `$font-size-xl`, `$font-weight-bold`, `$color-accent`.
- Date: `$font-size-sm`, `$color-text-on-dark-secondary`.
- Temperature: `$font-size-2xl`, `$font-weight-bold`.
- Feels-like: `$font-size-sm`, `$color-text-on-dark-secondary`.
- Score bar: identical pattern to Features 08 & 09 (track height 12px, animated fill, pill badge).

#### Stats Grid
- Same structure as Feature 09 stats grid.
- Mobile: 2×2 grid. Tablet+: 4×1 grid.
- Stat values: `$font-size-xl`, `$font-weight-bold`.
- Trend icon inline in pressure value: `$color-accent`, `$font-size-base`.
- Stat labels: `$font-size-xs`, uppercase, `$letter-spacing-caps`.

#### Conditions Card
- Full-width card, `$color-surface-dark` background, `$radius-lg`, `$shadow-dark`.
- `<dl>` with `<div>` wrappers for dt/dd pairs.
- Each row: flex row, space-between, border-bottom separator (except last).
- Labels: `$font-size-sm`, `$color-text-on-dark-secondary`, uppercase, `$letter-spacing-caps`.
- Values: `$font-size-sm`, `$color-text-on-dark`.
- Gust warning ⚠: `$color-accent`, shown when `windGustKmh > 30`.

#### Fishing Score Breakdown
- Full-width card, same background pattern as conditions card.
- Each factor row: label left, score badge right, full-width mini-bar below.
- Mini-bar track: `$color-score-track`, height 8px, `$radius-sm`.
- Mini-bar fill: `$color-score-fill`, proportional to factor's max.
- Score badge: `$font-size-xs`, `$font-weight-bold`, `$color-text-on-dark`.

#### Fishing Advice Section
- Background: `$color-surface-dark`, `$radius-lg`, `$shadow-dark`.
- Same structure as Feature 09 advice section.

### 6. Interaction Patterns

- **Back Link:** Same hover/focus pattern as Feature 09.
- **Score Bar Fill:** `afterNextRender()` + `scoreReady` signal + `--score-target-width` CSS custom property.
- **`prefers-reduced-motion`:** Skip score-bar transition.

### 7. Accessibility Notes

**Landmark structure:**
```
<header>        ← existing sticky app header
<main class="weather-detail">
  <nav aria-label="Page navigation">   ← wraps back link
  <section aria-labelledby="weather-hero-heading">
  <section aria-labelledby="weather-stats-heading">   ← visually hidden h2
  <section aria-labelledby="weather-conditions-heading">
  <section aria-labelledby="weather-impact-heading">
  <section aria-labelledby="weather-advice-heading">
```

**ARIA annotations:**

| Element | Requirement |
|---|---|
| Weather emoji | `aria-hidden="true"` |
| Score bar track | `role="meter" aria-valuenow aria-valuemin="0" aria-valuemax="100"` |
| Back link | `aria-label="Back to Home"` |
| Factor list | `role="list" aria-label="Fishing score factors"` |
| Each factor row | `role="listitem"` + `aria-label` with full readable phrase |
| State cards | `aria-busy="true"` when loading |
| Trend icon | `aria-hidden="true"` (trend label is in parent `aria-label`) |
| Gust warning | `role="img" aria-label="High gust warning"` |

---

## Fishing Advice Copy

Static lookup keyed by `scoreTierClass` ('good' | 'fair' | 'poor'):

| Tier | Score Range | Advice |
|------|-------------|--------|
| good | ≥ 75 | Excellent fishing conditions — stable pressure, light winds, and manageable cloud cover create optimal feeding windows. Get out there! |
| fair | 50–74 | Decent conditions for fishing. Some factors are limiting peak activity — focus on structure and be patient during transition periods. |
| poor | < 50 | Challenging weather conditions. Falling pressure or strong winds typically slow fish activity. Consider timing your outing around weather breaks. |

---

## Architecture Notes

### New Files

| File | Purpose |
|------|---------|
| `src/app/weather/weather-details.component.ts` | Standalone `OnPush` component; `toSignal`/`toObservable` reactive weather fetch |
| `src/app/weather/weather-details.component.html` | Template: hero, stats, conditions, impact breakdown, advice |
| `src/app/weather/weather-details.component.scss` | Mobile-first responsive styles |
| `src/app/weather/weather-details.component.spec.ts` | Unit tests (≥85% coverage) |
| `e2e/tests/weather-details.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Add `{ path: 'weather', loadComponent: () => import(...) }` |
| `src/app/weather/weather.service.ts` | Add public `getScoreBreakdown()` method |
| `src/app/weather/weather-display.component.html` | Wrap card in `<a routerLink="/weather">` |
| `src/app/weather/weather-display.component.ts` | Add `RouterLink` to imports |
| `src/app/weather/weather-display.component.scss` | Add `.weather-display__link` wrapper style |
| `src/app/weather/weather-display.component.spec.ts` | Add `provideRouter([])` to TestBed |

### Service Change: `WeatherService.getScoreBreakdown()`

```typescript
getScoreBreakdown(
  data: Pick<WeatherData, 'barometricPressureHpa' | 'pressureTrend' | 'windSpeedKmh' | 'cloudCoverPercent' | 'precipitationMm'>
): { pressure: number; wind: number; cloud: number; precipitation: number } {
  return {
    pressure: this.calcPressureScore(data.barometricPressureHpa, data.pressureTrend),
    wind: this.calcWindScore(data.windSpeedKmh),
    cloud: this.calcCloudScore(data.cloudCoverPercent),
    precipitation: this.calcPrecipScore(data.precipitationMm),
  };
}
```

### Component Sketch

```typescript
@Component({
  selector: 'app-weather-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class WeatherDetailsComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly weatherService = inject(WeatherService);

  readonly geoState = this.geoService.state;
  readonly isIdle = computed(() => this.geoState().status === 'idle');
  readonly isLocating = computed(() => ['idle', 'requesting'].includes(this.geoState().status));
  readonly hasError = computed(() => {
    const s = this.geoState().status;
    return s === 'denied' || s === 'unavailable' || s === 'error' || this.weather() === null;
  });

  readonly weather = toSignal(
    toObservable(this.geoService.state).pipe(
      switchMap((state) => {
        if (state.status !== 'granted' || !state.position) return of(undefined);
        const { latitude, longitude } = state.position.coords;
        return this.weatherService.getWeatherForLocation(latitude, longitude);
      }),
    ),
  );

  readonly hasData = computed(() => this.weather() !== undefined && this.weather() !== null);
  readonly scoreReady = signal(false);
  readonly scorePercent = computed(() => `${this.weather()?.fishingScoreContribution ?? 0}%`);
  readonly scoreTierClass = computed((): 'good' | 'fair' | 'poor' => { ... });
  readonly weatherEmoji = computed(() => { ... });
  readonly weatherDescription = computed(() => { ... });
  readonly pressureTrendIcon = computed(() => { ... });  // ↑ / ↓ / →
  readonly pressureTrendLabel = computed(() => { ... }); // 'Rising' / 'Falling' / 'Steady'
  readonly advice = computed(() => SCORE_ADVICE[this.scoreTierClass()]);

  readonly scoreBreakdown = computed(() => {
    const w = this.weather();
    if (!w) return null;
    return this.weatherService.getScoreBreakdown(w);
  });

  constructor() { afterNextRender(() => this.scoreReady.set(true)); }
}
```

### Service Reuse

Uses:
- `WeatherService` (Feature 04): `getWeatherForLocation(lat, lng)`, new `getScoreBreakdown(data)`
- `GeolocationService` (Feature 01): `state` signal for location status and coordinates

---

## Acceptance Criteria

```gherkin
Feature: Weather Details Screen

  Scenario: Navigate to weather details from home
    Given the user is on the home screen
    And location has been granted
    When the user clicks the weather card
    Then the browser navigates to "/weather"
    And the weather details screen is rendered

  Scenario: Direct navigation to /weather works
    Given the user navigates directly to "/weather"
    When the page loads
    Then the weather details screen is rendered

  Scenario: Show location prompt when idle
    Given the user navigates to "/weather"
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

  Scenario: Show error when weather HTTP fetch fails
    Given geolocation is granted
    And the weather API returns an error
    Then an error message is visible

  Scenario: Display hero section when data is available
    Given geolocation is granted and weather data is loaded
    When the page renders
    Then the weather emoji is visible
    And the condition name (h1) is shown
    And today's date is displayed
    And temperature and feels-like are shown
    And a fishing score bar is rendered

  Scenario: Stats grid shows all four metrics
    Given weather data is loaded
    When the page renders
    Then the stats grid shows Temperature
    And Wind Speed (km/h)
    And Pressure (hPa) with trend icon
    And Cloud Cover (%)

  Scenario: Score bar has accessible meter role
    Given the score section renders
    Then role="meter" is present on the score bar track
    And aria-valuenow matches the current score
    And aria-valuemin="0" and aria-valuemax="100" are set

  Scenario: Conditions card shows all four rows
    Given weather data is loaded
    Then the conditions card shows Feels Like
    And Precipitation
    And Wind Gusts
    And Pressure Trend

  Scenario: Wind gust warning shown for high gusts
    Given wind gusts are greater than 30 km/h
    Then the gust warning icon is visible

  Scenario: Fishing score breakdown shows four factor rows
    Given weather data is loaded
    Then the breakdown section shows Pressure factor
    And Wind factor
    And Cloud Cover factor
    And Precipitation factor
    And each row has a score/max label and a fill bar

  Scenario: Factor bar widths are proportional
    Given pressure factor score is 36 out of 40
    Then the pressure bar fill width is 90%

  Scenario: Advice text is score-tier specific
    Given the fishing score is 82 (good tier)
    Then the advice text mentions "Excellent fishing conditions"

  Scenario: Advice text for poor conditions
    Given the fishing score is below 50
    Then the advice text mentions "Challenging weather conditions"

  Scenario: Back navigation returns to home
    Given the user is on the weather details screen
    When the user clicks "← Back to Home"
    Then the browser navigates to "/"

  Scenario: Back link is keyboard accessible
    Given the user presses Tab on the weather details screen
    Then the back link receives focus
    And pressing Enter navigates to "/"
```

---

## Success Metrics

- **Tap-through rate from home → weather details:** ≥ 20% of sessions with weather data loaded
- **Score accuracy:** 100% (breakdown sums equal `fishingScoreContribution`)
- **Navigation reliability:** 100% (no 404 on `/weather`; back link always works)
- **Unit test coverage:** ≥ 85% statements, branches, functions, lines
- **E2E test coverage:** All acceptance criteria verified in Playwright
- **WCAG 2.1 AA:** All contrast pairs pass; all interactive elements keyboard accessible

---

## Non-Functional Requirements

| Requirement | Acceptance |
|---|---|
| **Performance** | Reuses cached WeatherService data; no additional HTTP calls |
| **Offline** | Shows error state gracefully when network unavailable |
| **Bundle Size** | < 15 KB incremental |
| **Accessibility** | WCAG 2.1 AA throughout |
| **Responsive** | ≤ 375px mobile through 1920px desktop |
| **Code Quality** | ESLint + Prettier pass; no `any`; strict TypeScript |

---

## Implementation Notes

### Files Created
- `src/app/weather/weather-details.component.ts` — Standalone `OnPush` component; uses `toSignal`/`toObservable` + `switchMap` pattern for reactive HTTP weather fetch; `scoreBreakdown` as a `computed()` delegating to `weatherService.getScoreBreakdown()`
- `src/app/weather/weather-details.component.html` — Angular `@if`/`@for` control flow; full ARIA landmark structure; all geolocation + HTTP error states handled; score breakdown with proportional mini-bars
- `src/app/weather/weather-details.component.scss` — Mobile-first, all design tokens, `prefers-reduced-motion` respected; score-bar pattern matches Features 08 & 09
- `src/app/weather/weather-details.component.spec.ts` — 55 Jasmine unit tests covering all computed signals, geolocation states, DOM assertions, and advice copy

### Files Modified
- `src/app/app.routes.ts` — Added lazy `/weather` route via `loadComponent`
- `src/app/weather/weather.service.ts` — Added public `getScoreBreakdown()` method delegating to existing private calc methods
- `src/app/weather/weather-display.component.html` — Wrapped card in `<a routerLink="/weather">` 
- `src/app/weather/weather-display.component.ts` — Added `RouterLink` to imports
- `src/app/weather/weather-display.component.scss` — Added `.weather-display__link` wrapper style with focus ring
- `src/app/weather/weather-display.component.spec.ts` — Added `provideRouter([])` to all 7 `configureTestingModule` calls

### Key Decisions
- **`scoreBreakdown` via `WeatherService.getScoreBreakdown()`:** Avoids duplicating sub-score logic in the component. Added as a public additive method that calls the existing private calc methods.
- **No 7-day forecast strip:** Weather service only fetches current data; the "Fishing Score Breakdown" section provides equivalent analytical depth while using only available data.
- **`toSignal/toObservable` pattern:** Matches `WeatherDisplayComponent` pattern for consistency; handles async HTTP cleanly with `undefined` (loading), `null` (error), `WeatherData` (success).
- **Error state covers both geolocation denial and HTTP failure:** `hasError` checks both `geoState.status` and `weather() === null`.

### Test Coverage
- 550/550 unit tests pass (all suites)
- Statements 98.6%, Branches 89.1%, Functions 99.2%, Lines 99.2% — all above 85% threshold
- 99 E2E tests pass (all suites including new weather-details.spec.ts)

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService`, `GeolocationState` |
| Feature 04 | `WeatherService`, `WeatherData`, `WeatherCondition` |
| Feature 06 | Home screen layout; weather card becomes navigation origin |
| Feature 07 | Responsive SCSS tokens and breakpoints |
