# Feature 11 — Score Breakdown Explanation

**Status:** Complete
**Milestone:** 2 — Core Value

---

## Overview

Feature 11 is a full-page details screen at route `/score` that expands the compact home screen fishing score card into a rich explanation of how today's composite score was calculated. It shows each factor's raw score, weighted contribution, and a visual bar, plus tier-specific fishing advice and a plain-language algorithm explanation. Each factor links to its own details screen (Features 08–10).

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | To understand why my score is what it is | I can trust the number and act on it |
| US-2 | Angler | To see each factor's contribution with its weight | I understand what drove the score up or down |
| US-3 | Angler | Links from each factor row to that factor's detail screen | I can deep-dive into any single factor |
| US-4 | Angler | Tier-appropriate fishing advice (Excellent / Fair / Poor) | I know how to adapt my fishing strategy today |
| US-5 | Angler | A clear loading state while data is fetching | I'm not confused by a blank screen |

---

## UX Brief

### Core Concept

The score breakdown screen answers **"Why is my score X?"** It follows the same **hero → details** pattern as the moon, solunar, and weather detail screens. The composite score remains the hero; below it, three factor rows deconstruct how the score was built.

### Information Hierarchy

```
┌──────────────────────────────────────────────────┐
│  ← Back to Home                                  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  🎣 Today's Fishing Score                  │  │  ← Hero card
│  │                                            │  │
│  │         78 / 100                           │  │
│  │         Good Conditions                    │  │
│  │  ████████████████░░░░  78%                 │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Score Breakdown                           │  │  ← Factor section
│  │                                            │  │
│  │  🌙 Moon Phase →  62/100  ×30%  = 19 pts   │  │
│  │  ████████████░░░░  (links to /moon)        │  │
│  │                                            │  │
│  │  ☀️ Solunar      →  90/100  ×35%  = 32 pts  │  │
│  │  ████████████████  (links to /solunar)     │  │
│  │                                            │  │
│  │  🌤️ Weather      →  77/100  ×35%  = 27 pts  │  │
│  │  ███████████████░  (links to /weather)     │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  How It's Calculated                       │  │  ← Algorithm explainer
│  │  Each factor is scored 0–100 and weighted  │  │
│  │  by its importance to fishing activity...  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Fishing Conditions                        │  │  ← Advice
│  │  Solid conditions for a productive...      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## UI Spec

### Component: `ScoreBreakdownComponent`

**Selector:** `app-score-breakdown`
**Route:** `/score`

#### Back Navigation
- `← Back to Home` anchor with `routerLink="/"`
- Same style as other details screens

#### Hero Section (`score-detail__hero`)

- Heading: `🎣 Today's Fishing Score` (h1)
- Large composite number: `78 / 100`
- Tier label beneath number: `Excellent Conditions` / `Good Conditions` / `Fair Conditions` / `Poor Conditions`
  - Excellent: score ≥ 75 (good tier)
  - Good: score ≥ 50 (fair tier — label says "Good" for friendlier UX)
  - Poor: score < 50
- Score bar (same animated bar pattern from Features 08–10)
  - Color: green (`--good`), amber (`--fair`), red (`--poor`)

#### Factor Breakdown Section (`score-detail__factors`)

Heading: `Score Breakdown` (h2)

Three factor rows, each containing:
- Factor icon (emoji, aria-hidden) + factor name as a `routerLink` to the detail screen
- Raw score badge: `62 / 100`
- Weight badge: `× 30%`
- Points badge: `= 19 pts`
- Per-factor score bar (same animated bar; tier color keyed to factor's own score)

Factor links:
| Factor | Link | Weight |
|--------|------|--------|
| 🌙 Moon Phase | `/moon` | 30% |
| ☀️ Solunar | `/solunar` | 35% |
| 🌤️ Weather | `/weather` | 35% |

Weather unavailable state: when `weatherAvailable` is false, show `—` for raw score and `0 pts` for contribution, with a note: `"Weather data unavailable — its weight was redistributed."` Weight shown as the actual effective weight (redistributed).

#### Algorithm Explainer Section (`score-detail__algorithm`)

Heading: `How It's Calculated` (h2)

Static copy:
> Each factor is scored 0–100 based on how favorable it is for fishing activity. Moon phase captures lunar cycle position and illumination. Solunar captures peak activity windows based on moon transit times. Weather captures atmospheric conditions including pressure trend, wind, and cloud cover.
>
> Each factor's score is multiplied by its weight and the results are summed to produce the composite score. If weather data is unavailable, its 35% weight is redistributed proportionally to moon phase and solunar.

#### Advice Section (`score-detail__advice-section`)

Heading: `Fishing Conditions` (h2)

Advice copy by tier:

| Tier | Copy |
|------|------|
| good | `Outstanding fishing conditions today. All key factors align for peak activity — plan your trip around solunar peak windows for best results.` |
| fair | `Decent conditions for a productive outing. Some factors are limiting peak activity — focus on structure and time your trips to solunar peaks.` |
| poor | `Challenging conditions today. Unfavorable factors will slow fish activity. Consider targeting sheltered areas and waiting for better conditions.` |

#### Loading / Error States

| State | Display |
|-------|---------|
| `idle` (no location) | 📍 "Share your location to see your score breakdown" prompt |
| `requesting` or score undefined | Spinner + "Calculating score…" |
| `denied` / `error` / score null | "Score unavailable — data could not be loaded." |

#### Navigation from Home

`fishing-score-display.component.html`: wrap entire `<section class="score-card">` in `<a routerLink="/score" class="score-card__link" aria-label="View score breakdown">`.

---

## Architecture Notes

### New Files

| File | Purpose |
|------|---------|
| `src/app/scoring/score-breakdown.component.ts` | Details screen component |
| `src/app/scoring/score-breakdown.component.html` | Template |
| `src/app/scoring/score-breakdown.component.scss` | Dark-theme styles |
| `src/app/scoring/score-breakdown.component.spec.ts` | Unit tests |
| `e2e/tests/score-breakdown.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Add lazy-loaded `/score` route |
| `src/app/scoring/fishing-score-display.component.html` | Wrap card in `<a routerLink="/score">` |

### Data Flow

`ScoreBreakdownComponent` uses the same reactive pattern as `WeatherDetailsComponent`:

```typescript
readonly fishingScore = toSignal(
  toObservable(this.geoService.state).pipe(
    switchMap((state) => {
      if (state.status !== 'granted' || !state.position) return of(undefined);
      const { latitude, longitude } = state.position.coords;
      const dateUtc = new Date().toISOString().slice(0, 10);
      return this.fishingScoreService.getScore(latitude, longitude, dateUtc);
    }),
  ),
);
```

No new services needed — reuses `FishingScoreService.getScore()` and `GeolocationService`.

### Score Tier Mapping

| Score | `scoreTierClass()` | `tierLabel()` |
|-------|-------------------|---------------|
| ≥ 75 | `'good'` | `'Excellent Conditions'` |
| ≥ 50 | `'fair'` | `'Good Conditions'` |
| < 50 | `'poor'` | `'Poor Conditions'` |

---

## Acceptance Criteria

### Navigation

```gherkin
Scenario: Home screen score card links to /score
  Given the user is on the home screen
  Then the score card is wrapped in a link to "/score"
  When the user clicks the score card
  Then the URL becomes "/score"

Scenario: Back link returns to home
  Given the user is on "/score"
  When they click "← Back to Home"
  Then the URL becomes "/"
```

### Idle State

```gherkin
Scenario: No location set
  Given the user has not granted geolocation
  When the user navigates to "/score"
  Then a location prompt is displayed
  And no score number is shown
```

### Loading State

```gherkin
Scenario: Geolocation requesting
  Given geolocation status is "requesting"
  When the user navigates to "/score"
  Then a loading spinner is shown
  And "Calculating score…" text is present
```

### Score Display

```gherkin
Scenario: Score loads successfully
  Given location is granted and score data is available
  When the user navigates to "/score"
  Then the composite score number is displayed
  And the tier label is visible
  And the score bar is rendered with role="meter"
  And three factor rows are shown (Moon Phase, Solunar, Weather)
  And each factor row links to its detail screen
  And the algorithm explanation section is visible
  And the fishing advice paragraph is visible
```

### Factor Breakdown

```gherkin
Scenario: Factor scores are displayed correctly
  Given the score is 78 with moonPhaseScore=62, solunarScore=90, weatherScore=77
  Then the Moon Phase row shows "62" and "19 pts"
  And the Solunar row shows "90" and "32 pts"
  And the Weather row shows "77" and "27 pts"

Scenario: Weather unavailable
  Given weatherAvailable is false
  Then the Weather row shows "—" for raw score
  And a note about weight redistribution is displayed
```

### Accessibility

```gherkin
Scenario: Page structure
  Given the user navigates to "/score"
  Then there is a single <main> element
  And factor score bars have role="meter" with aria-valuenow, aria-valuemin, aria-valuemax
  And emoji icons have aria-hidden="true"
  And the back link is keyboard focusable
```

---

## Non-Functional Requirements

- No new services — reuses `FishingScoreService` and `GeolocationService`
- `OnPush` change detection
- SCSS uses `@use 'variables' as *` and `@use 'mixins' as *`
- All interactive elements have `:hover` and `:focus-visible` states
- Unit test coverage ≥ 85%
- No raw hex/px values in SCSS — design tokens only

---

## Implementation Notes

### Files Delivered

| File | Purpose |
|------|---------|
| `src/app/scoring/score-breakdown.component.ts` | Details screen component — reactive score via `toSignal(toObservable(geoState).pipe(switchMap(...)))` |
| `src/app/scoring/score-breakdown.component.html` | Template with idle/loading/error/success states |
| `src/app/scoring/score-breakdown.component.scss` | Dark-theme styles matching Features 08–10 |
| `src/app/scoring/score-breakdown.component.spec.ts` | 36 unit tests covering all states and computed signals |
| `e2e/tests/score-breakdown.spec.ts` | 28 Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Added lazy-loaded `/score` route |
| `src/app/scoring/fishing-score-display.component.html` | Wrapped `<section class="score-card">` in `<a routerLink="/score">` |
| `src/app/scoring/fishing-score-display.component.ts` | Added `RouterLink` to imports |
| `src/app/scoring/fishing-score-display.component.scss` | Added `.score-card__link` hover/focus styles |
| `src/app/scoring/fishing-score-display.component.spec.ts` | Added `provideRouter([])` to TestBed setup |

### Test Coverage (final)

- Statements: 98.1% | Branches: 86.66% | Functions: 99.25% | Lines: 98.69%
- Unit tests: 586/586 passing
- E2E tests: 9 navigation/idle/accessibility tests pass; geolocation-dependent tests require live network (same pre-existing limitation as Features 08–10)

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService` |
| Feature 05 | `FishingScoreService`, `FishingScore`, `ScoreBreakdown` models |
| Feature 08 | `/moon` route target |
| Feature 09 | `/solunar` route target |
| Feature 10 | `/weather` route target |
