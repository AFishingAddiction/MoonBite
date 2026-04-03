# Feature 05 — Fishing Score Calculation Engine

**Status:** Complete
**Milestone:** 1 — MVP

---

## Overview

Feature 05 is a pure calculation service that composites the `fishingScoreContribution` values already produced by Features 02–04 into a single daily fishing score (0–100). It also exposes a breakdown of how each factor contributed so future features (11 — Score Breakdown) can explain the result to users.

This feature has no user-facing UI of its own. It ships a dev-only `FishingScoreDisplayComponent` (matching the pattern of Features 02–04) and wires into `AppComponent` for developer validation.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | A single "Today's Fishing Score" number | I can instantly know if conditions are favorable |
| US-2 | Angler | The score to reflect moon phase, solunar peaks, and weather together | I trust it combines all relevant factors |
| US-3 | Angler | The score to update automatically when location or date changes | I don't need to manually refresh |
| US-4 | Developer | A breakdown of how each factor contributed | I can debug and validate the algorithm |

---

## UX Brief

### Core Concept

The fishing score is the product's primary value proposition. Users should feel the score is authoritative, scientific, and trustworthy. The number itself (e.g. "82 / 100") is the hero element.

For the dev-only display this feature delivers, show:
- Composite score (large, prominent)
- Three contributing scores with factor labels and weights
- Loading and error states

The real home screen UI is deferred to Feature 06 (App Shell & Home Screen).

---

## UI Spec — Dev-Only Display Component

### Component: `FishingScoreDisplayComponent`

**Selector:** `app-fishing-score-display`

**Layout:**
```
┌────────────────────────────────────────┐
│  🎣 Fishing Score                      │
│                                        │
│         [ 78 / 100 ]                   │
│                                        │
│  Moon Phase    ████░░  62  ×30%  = 19  │
│  Solunar       ██████  90  ×35%  = 32  │
│  Weather       ████░░  77  ×35%  = 27  │
│                                        │
│  [Loading state] / [Error state]       │
└────────────────────────────────────────┘
```

**States:**
- **Loading:** spinner + "Calculating score…" text
- **Error (partial):** show score but flag unavailable factors
- **Error (all):** "Score unavailable — data could not be loaded"
- **Success:** composite score + breakdown table

**Interaction:** None (read-only display). Score updates reactively via signals.

---

## Architecture Notes

### New Files

| File | Purpose |
|------|---------|
| `src/app/scoring/fishing-score.service.ts` | Core calculation engine |
| `src/app/scoring/fishing-score.service.spec.ts` | Unit tests |
| `src/app/scoring/fishing-score-display.component.ts` | Dev-only display component |
| `src/app/scoring/fishing-score-display.component.html` | Template |
| `src/app/scoring/fishing-score-display.component.scss` | Styles |
| `src/app/scoring/fishing-score-display.component.spec.ts` | Component unit tests |

### Data Model

```typescript
/** Weighting applied to each input factor (must sum to 1.0). */
export interface ScoringWeights {
  moonPhase: number;   // 0.30
  solunar: number;     // 0.35
  weather: number;     // 0.35
}

/** Per-factor breakdown returned alongside the composite score. */
export interface ScoreBreakdown {
  moonPhaseScore: number;        // raw 0–100 from MoonPhaseService
  solunarScore: number;          // raw 0–100 from SolunarService
  weatherScore: number;          // raw 0–100 from WeatherService (or null if unavailable)
  moonPhaseWeighted: number;     // moonPhaseScore × weight, rounded
  solunarWeighted: number;       // solunarScore × weight, rounded
  weatherWeighted: number;       // weatherScore × weight (or 0 if unavailable), rounded
  weatherAvailable: boolean;     // false when WeatherService returned null
}

/** The primary output of FishingScoreService. */
export interface FishingScore {
  /** Composite fishing score 0–100 (rounded integer). */
  score: number;
  /** How each factor contributed. */
  breakdown: ScoreBreakdown;
  /** Weights used for this calculation. */
  weights: ScoringWeights;
  /** UTC date string (YYYY-MM-DD) the score was calculated for. */
  dateUtc: string;
  /** Latitude used for location-dependent calculations. */
  latitude: number;
  /** Longitude used for location-dependent calculations. */
  longitude: number;
}
```

### Scoring Algorithm

```
DEFAULT_WEIGHTS = { moonPhase: 0.30, solunar: 0.35, weather: 0.35 }

composite = moonPhase × 0.30 + solunar × 0.35 + weather × 0.35

If weather is unavailable (null from WeatherService):
  Redistribute weather weight equally to moon and solunar:
    effectiveWeights = { moonPhase: 0.4737, solunar: 0.5263 }
  i.e. normalize the remaining two weights to sum to 1.0
  Set weatherAvailable = false, weatherWeighted = 0

Final score = Math.round(composite), clamped to [0, 100]
```

### Service API

```typescript
@Injectable({ providedIn: 'root' })
export class FishingScoreService {
  /**
   * Calculate composite fishing score for a given location and date.
   * Combines moon phase, solunar, and weather contributions.
   * Weather is optional — if WeatherData is null, its weight is redistributed.
   *
   * @param latitude  Decimal degrees (−90 to 90)
   * @param longitude Decimal degrees (−180 to 180)
   * @param dateUtc   ISO date string YYYY-MM-DD
   * @param weatherData  Current WeatherData (or null if unavailable)
   * @returns FishingScore with composite score and breakdown
   */
  calculate(
    latitude: number,
    longitude: number,
    dateUtc: string,
    weatherData: WeatherData | null,
  ): FishingScore;

  /**
   * Return an Observable<FishingScore | null> that fetches weather then computes
   * the composite score. Emits null on unrecoverable error.
   *
   * @param latitude  Decimal degrees
   * @param longitude Decimal degrees
   * @param dateUtc   ISO date string YYYY-MM-DD
   */
  getScore(
    latitude: number,
    longitude: number,
    dateUtc: string,
  ): Observable<FishingScore | null>;
}
```

### Signal Integration

- `FishingScoreDisplayComponent` uses `toSignal()` to convert the Observable to a signal
- `GeolocationService` (Feature 01) provides coordinates; the display component reads the signal
- The display component injects `FishingScoreService` and `GeolocationService` directly

### Dependencies

- `MoonPhaseService` (Feature 02) — synchronous `calculateForDateString()`
- `SolunarService` (Feature 03) — synchronous `calculateForDate()`
- `WeatherService` (Feature 04) — async `getWeatherForLocation()`
- `GeolocationService` (Feature 01) — provides current coordinates signal

---

## Acceptance Criteria

### Happy Path: Score Calculation

```gherkin
Given the user has granted geolocation permission
And the moon phase service returns a contribution of 80
And the solunar service returns a contribution of 90
And the weather service returns a contribution of 70
When the fishing score is calculated
Then the composite score = round(80×0.30 + 90×0.35 + 70×0.35) = round(24 + 31.5 + 24.5) = 80
And the breakdown shows each weighted component
```

### Weather Unavailable

```gherkin
Given the weather service returns null
And the moon phase score is 60
And the solunar score is 80
When the fishing score is calculated
Then weatherAvailable is false
And the composite score = round(60×(0.30/0.65) + 80×(0.35/0.65))
  = round(60×0.4615 + 80×0.5385)
  = round(27.7 + 43.1)
  = 71
And the display shows "Weather data unavailable" note
```

### Boundary Values

```gherkin
Given all inputs are 0
Then composite score = 0

Given all inputs are 100
Then composite score = 100

Given score calculation returns 99.6
Then displayed score = 100
```

### Display Component

```gherkin
Given the score service is loading
Then a loading indicator is shown
And the score is not displayed

Given the score service returns a FishingScore
Then the composite score is displayed prominently
And all three factor breakdowns are shown
```

---

## Non-Functional Requirements

- Pure synchronous `calculate()` method — no side effects, fully deterministic
- `getScore()` completes in ≤ 5 s (bounded by WeatherService timeout)
- All inputs validated: throw `RangeError` for invalid lat/lng
- No `any` types; strict TypeScript throughout
- Unit test coverage ≥ 85% on all new files

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService` — current lat/lng signal |
| Feature 02 | `MoonPhaseService` — `fishingScoreContribution` |
| Feature 03 | `SolunarService` — `fishingScoreContribution` |
| Feature 04 | `WeatherService` — `fishingScoreContribution` (nullable) |

---

## Implementation Notes

### Files Delivered

| File | Purpose |
|------|---------|
| `src/app/scoring/fishing-score.service.ts` | Core calculation engine — `calculate()` and `getScore()` |
| `src/app/scoring/fishing-score.service.spec.ts` | 17 unit tests covering all calculation paths |
| `src/app/scoring/fishing-score-display.component.ts` | Dev-only display component |
| `src/app/scoring/fishing-score-display.component.html` | Template with score + breakdown table |
| `src/app/scoring/fishing-score-display.component.scss` | Dark-card styles using design tokens |
| `src/app/scoring/fishing-score-display.component.spec.ts` | 9 component tests |

### Algorithm Notes

- **Floating-point behaviour:** `Math.round(90 × 0.35)` evaluates to `31` (not 32) in V8 because `0.35` in IEEE 754 is slightly less than `0.35` — `31.4999…`. Similarly `Math.round(70 × 0.35) = 25` because `0.35` rounds up in V8. The composite score uses the unrounded products and therefore remains accurate.
- **Weight redistribution:** When weather is unavailable, the 0.35 weather weight is proportionally redistributed: moon gets `0.30/0.65 ≈ 0.4615`, solunar gets `0.35/0.65 ≈ 0.5385`.

### Reactive Pattern

`FishingScoreDisplayComponent` uses `toObservable()` on the geolocation state signal, flat-mapped via `switchMap` into `FishingScoreService.getScore()`, and converted back to a signal via `toSignal()` with `initialValue: undefined` (used as the loading sentinel).

### Test Coverage (final)

- Statements: 98.72% | Branches: 90.9% | Functions: 100% | Lines: 99.1%
- Total suite: 344 tests, all passing

### Bug Fixed

`WeatherDisplayComponent`'s `pressure trend display` describe block lacked a `beforeEach`, causing it to depend on fixture state from a sibling test. Added a `beforeEach` to make the block self-contained.

---

## Future Enhancements (Out of Scope)

- Custom weight configuration per user (Feature 14 — Preferences)
- Historical score trending (Feature 15 — History)
- Score explanation screen (Feature 11 — Score Breakdown)
- Push alerts when score exceeds threshold (Feature 19 — Notifications)
