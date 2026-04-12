# Feature 15 — Daily Score History & Trends

**Status:** Complete  
**Milestone:** 2 — Core Value

---

## Overview

Enable anglers to track how fishing conditions have evolved over time by automatically recording the daily fishing score each time they open the app. A dedicated `/history` screen shows the last 7–30 days of scores with a visual trend representation (CSS/SVG sparkline), highlighting best and worst days to inform future fishing plans. History is stored per location and persists across sessions using localStorage.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | The app to automatically record today's fishing score when I open it | I don't have to manually log scores; my history builds passively |
| US-2 | Angler | To view my last 7 days of scores in a list | I can see yesterday was better than today and plan accordingly |
| US-3 | Angler | To see a visual trend (sparkline) of the past 30 days | I can spot patterns at a glance (e.g., "best conditions mid-month") |
| US-4 | Angler | To switch between different time ranges (7, 14, 30 days) | I can zoom in on recent conditions or see longer trends |
| US-5 | Angler | To see which day had the highest score | I know when the best fishing was |
| US-6 | Angler | For each location to have its own separate history | My Lake Tahoe scores don't mix with my home lake data |
| US-7 | Angler | To clear old history after 30 days | My localStorage doesn't grow unbounded |

---

## UX Notes

### Workflow

The history screen is accessed via a bottom navigation tab or link from the home screen. On app launch, the app silently records today's score for the active location. Users can tap `/history` to browse their trend. The sparkline is interactive but read-only; no data entry required.

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Recording trigger | App launch (once per day per location) | Passive, non-intrusive; builds rich data over time |
| Data retention | Max 30 days per location | Balances history richness with localStorage constraint (~50KB limit) |
| Visualization | CSS/SVG sparkline (no chart library) | Fast, zero dependencies, works offline |
| Time range filter | Tabs: "7 days" / "14 days" / "30 days" | Simple selection; matches common user interests |
| Storage backend | localStorage (per-location history key) | No account needed; offline capable |
| Data deduplication | One score per UTC day per location (overwrite if score recalculated) | Prevents duplicate entries; latest data always fresh |

### Visual Hierarchy

- **Hero:** The sparkline chart (large, centred)
- **Supporting:** List of daily scores below (date + score + comparison to yesterday)
- **Secondary:** Time range tabs; highest/lowest day badges

---

## UI Spec

> Design tokens use exact names from `src/styles/_variables.scss`. The screen
> follows the dark-surface pattern established by `fishing-score-display` and
> `score-breakdown` components: dark cards on `$color-surface-dark`, accent
> highlights in `$color-accent`, score quality expressed with the three existing
> tier colors.

### 1. History Screen Layout (`/history`)

Primary viewport: 375 px wide. Bottom nav occupies `$nav-height` (64 px) at the
bottom. Safe-area inset is respected via `env(safe-area-inset-bottom)`.

```
┌─────────────────────────────────────────┐  375 px
│  ← History          [location name]    │  48 px header (surface-dark)
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  TREND CHART (SVG)              │    │  ~180 px
│  │  [7D] [14D] [30D]  ← toggle    │    │
│  │                                 │    │
│  │  █ █   █ █ █   █               │    │
│  │  bar bars color-coded           │    │
│  │  M T W T F S S  ← axis labels  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─── Past 7 Days ───────────────────   │  section divider
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [78] Fri Apr 10    🌕  [BEST]   │    │  56 px row
│  ├─────────────────────────────────┤    │
│  │ [62] Thu Apr  9    🌔           │    │
│  ├─────────────────────────────────┤    │
│  │ [—]  Wed Apr  8    –   missed   │    │  missed day
│  ├─────────────────────────────────┤    │
│  │ [55] Tue Apr  7    🌓  [BEST]   │    │
│  ├─────────────────────────────────┤    │
│  │  ...                            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  (scrollable list continues)            │
│                                         │
├─────────────────────────────────────────┤
│  [Home][Moon][Solunar][Weather][History]│  64 px bottom nav
└─────────────────────────────────────────┘
```

Layout implementation notes:

- Screen root: `display: flex; flex-direction: column; height: 100dvh;`
- Header: `position: sticky; top: 0; z-index: 10;`
- Chart card + list area: `flex: 1; overflow-y: auto; padding-bottom: calc($space-xl + env(safe-area-inset-bottom));`
- Max width 720 px centered for tablet/desktop, identical to `score-detail`

### Home Screen — Updated (Location Card Footer)

```
Add a subtle link to /history:
┌──────────────────────────────────────┐
│ 📍 Your Location (Lake Tahoe)         │
│ [Score: 82/100]                       │
│ [View 7-day trend →]                  │
└──────────────────────────────────────┘
```

### 2. Bar Chart (SVG)

```
  100 ┤                              ← y-axis label (screen-reader only)
      │
   75 ┤     ██         ██
      │  ██ ██      ██ ██
   50 ┤  ██ ██ ██   ██ ██ ██
      │  ██ ██ ██   ██ ██ ██ ██
   25 ┤  ██ ██ ██   ██ ██ ██ ██
      │  ██ ██ ██   ██ ██ ██ ██
    0 └──┬──┬──┬────┬──┬──┬──┬──
        M  T  W  –  F  S  S

        missed day shown as dashed
        outline bar (no fill), "–"
        label beneath
```

SVG structure:

```svg
<svg role="img"
     aria-label="Fishing score trend for the past 7 days at [location]. Scores ranged from [min] to [max]."
     viewBox="0 0 [W] 160"
     width="100%">

  <!-- per bar -->
  <rect x="..." y="..." width="..." height="..."
        fill="[score-color]"
        rx="3"
        aria-hidden="true" />

  <!-- missed day: dashed outline only -->
  <rect x="..." y="0" width="..." height="160"
        fill="none"
        stroke="$color-border-dark"
        stroke-dasharray="3 3"
        rx="3"
        aria-hidden="true" />

  <!-- x-axis label -->
  <text x="..." y="155" text-anchor="middle"
        fill="$color-text-on-dark-secondary"
        font-size="10">Mon</text>
</svg>
```

Bar color mapping:

| Score range | Fill token            | CSS value  |
|-------------|-----------------------|------------|
| 80–100      | `$color-score-good`   | `#2ecc71`  |
| 60–79       | `$color-accent`       | `#f0a500`  |
| 40–59       | `$color-score-fair`   | `#f39c12`  |
| 0–39        | `$color-score-poor`   | `#e74c3c`  |

Range toggle (7D / 14D / 30D):

- Three `<button>` elements inside a `role="group"` with `aria-label="Chart time range"`.
- Active button: background `$color-accent`, color `$color-surface-dark`, font-weight `$font-weight-bold`.
- Inactive: background `$color-surface-dark-alt`, color `$color-text-on-dark-secondary`, border `1px solid $color-border-dark`.
- Border-radius `$radius-full` on each button.
- When range changes, bars animate in via `transform: scaleY(0→1)` from the bottom, staggered 20 ms per bar, easing `ease-out`.

### 3. Day List Row

```
┌────────────────────────────────────────────┐
│ ┌──────┐                                   │
│ │  78  │  Fri, Apr 10          🌕  [BEST]  │
│ └──────┘                                   │
└────────────────────────────────────────────┘
  56 px min-height, full-bleed tap target
```

Score badge: 44 × 44 px, `border-radius: $radius-md`, background is score tier
color at 15% opacity, `border: 2px solid [tier color]`, number in
`$font-size-lg $font-weight-bold`. Missed day: badge shows "—",
background `$color-surface-dark-alt`, color `$color-text-disabled`.

Row layout: `[badge 44px] [flex: 1 date column] [moon emoji 24px] [Best badge optional]`

"BEST" badge: `$font-size-xs`, uppercase, `letter-spacing: $letter-spacing-caps`,
background `$color-accent`, color `$color-surface-dark`, `border-radius: $radius-full`,
padding `2px $space-sm`. Rendered only for the highest-scoring day.

### 4. Day Detail Sheet

Slide-up bottom sheet inside a native `<dialog>` element (not a routed page).

```
┌─────────────────────────────────────────┐
│                                         │  ← scrim (rgba black 0.55)
│                                         │    tap scrim to dismiss
│                                         │
├──────────────────────────┬──────────────┤
│  ▬▬▬  (drag handle)     │              │  ← handle bar, 36px indicator
├──────────────────────────┴──────────────┤
│                                         │
│  Fri, Apr 10, 2026          [78/100]    │  date + composite badge
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🌙 Moon Phase             [82]  ████▓  │
│  ⏰ Solunar                 [74]  ███░░  │
│  🌤 Weather                 [69]  ███░░  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [ Close ]                              │
│                                         │
└─────────────────────────────────────────┘
```

- `<dialog>` positioned `inset: 0`, `background: transparent`, `border: none`, `padding: 0`
- Scrim: `position: absolute; inset: 0; background: rgba(0,0,0,0.55);`
- Sheet panel: `position: absolute; bottom: 0; left: 0; right: 0;`
- Use `dialog.showModal()` / `dialog.close()` for native focus trap + ESC dismiss
- Sheet height: `auto`, max 80dvh; background `$color-surface-dark`; border-radius `$radius-lg $radius-lg 0 0`

Sheet open/close animation:

```scss
@keyframes sheet-enter {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes sheet-exit {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .history-sheet,
  .history-sheet--closing { animation: none; }
}
```

### 5. Empty State

```
┌─────────────────────────────────────────┐
│                                         │
│            🎣                           │
│                                         │
│   No history yet                        │
│                                         │
│   Your daily fishing score is saved     │
│   automatically each time you open      │
│   the app. Check back tomorrow to       │
│   see your first trend.                 │
│                                         │
│   [ View Today's Score → ]              │
│                                         │
└─────────────────────────────────────────┘
```

Message: "Not enough history yet. Check back after a few days."

### 6. Design Tokens

| Purpose | Token |
|---------|-------|
| Screen / card backgrounds | `$color-surface-dark`, `$color-surface-dark-alt` |
| Borders | `$color-border-dark` |
| Primary text | `$color-text-on-dark` |
| Secondary text | `$color-text-on-dark-secondary` |
| Disabled / missed | `$color-text-disabled` |
| Excellent score (80–100) | `$color-score-good` |
| Good score (60–79) | `$color-accent` |
| Fair score (40–59) | `$color-score-fair` |
| Poor score (0–39) | `$color-score-poor` |
| Bar track | `$color-score-track` |
| Best badge | `$color-accent` on `$color-surface-dark` |
| Transitions | `$transition-fast` (150ms), `$transition-base` (250ms) |

### 7. WCAG Notes

Chart `<svg>` carries a full `aria-label` summary; individual bars are `aria-hidden="true"`.

Each day row button: `aria-label="Score [N] out of 100: [weekday] [date], [phase] moon[, one of the 3 best days]"`.

Sheet `<dialog>` provides native focus trap and `aria-modal="true"`. Sub-score bars use `role="meter"` with `aria-valuenow/min/max`. Focus returns to the triggering row button on close.

Keyboard: Tab through header → toggle buttons → day rows → sheet (when open). `ArrowLeft`/`ArrowRight` within the toggle (roving tabindex). ESC dismisses the sheet (native `<dialog>` behavior).

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/history/score-history.model.ts` | `DailyScoreRecord`, `LocationHistory` interfaces |
| `src/app/history/score-history.service.ts` | Record daily score, load history, localStorage persistence |
| `src/app/history/score-history.service.spec.ts` | Unit tests |
| `src/app/history/score-history.component.ts` | History screen (`/history`) |
| `src/app/history/score-history.component.html` | Template with sparkline + daily list |
| `src/app/history/score-history.component.scss` | Sparkline (SVG) + list styles |
| `src/app/history/score-history.component.spec.ts` | Component unit tests |
| `e2e/tests/score-history.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.component.ts` | Call `ScoreHistoryService.recordTodayScore()` on init |
| `src/app/app.routes.ts` | Add `/history` lazy route |
| `src/app/home/home.component.html` | Add "View trend" link to location card |

### Data Model

```typescript
/** A single day's recorded score for a location. */
export interface DailyScoreRecord {
  readonly dateUtc: string;      // YYYY-MM-DD
  readonly score: number;        // 0–100 (same as FishingScore.score)
  readonly breakdown: ScoreBreakdown; // reusable breakdown from Feature 05
}

/** All recorded scores for a single location. */
export interface LocationHistory {
  readonly latitude: number;
  readonly longitude: number;
  readonly records: DailyScoreRecord[];  // sorted descending by dateUtc
}

/** Query result for a time-range view. */
export interface HistorySlice {
  readonly records: DailyScoreRecord[];  // last N days, sorted by dateUtc
  readonly highScore: number;
  readonly lowScore: number;
  readonly highDate: string;
  readonly lowDate: string;
  readonly averageScore: number;
}
```

### `ScoreHistoryService` API

```typescript
@Injectable({ providedIn: 'root' })
export class ScoreHistoryService {
  /**
   * Record today's fishing score for the active location.
   * Silently called on app init. Idempotent per day per location.
   * @param score The FishingScore object (or null to skip if unavailable)
   * @param latitude, longitude The location being scored
   * @returns true if recorded, false if skipped
   */
  recordTodayScore(
    score: FishingScore | null,
    latitude: number,
    longitude: number,
  ): boolean;

  /**
   * Load the history slice for a given location and time range.
   * @param latitude, longitude The location to query
   * @param days How many days of history (7, 14, 30)
   * @returns HistorySlice (empty records[] if location has no history)
   */
  getHistory(
    latitude: number,
    longitude: number,
    days: 7 | 14 | 30,
  ): HistorySlice;

  /**
   * Clear all history data (for testing or user request).
   */
  clear(): void;
}
```

### localStorage Schema

```
Key: moonbite_history_<lat>_<lng>
Value: JSON-encoded LocationHistory

Example:
{
  "latitude": 39.0968,
  "longitude": -120.0324,
  "records": [
    {
      "dateUtc": "2026-04-11",
      "score": 82,
      "breakdown": { ... }
    },
    { "dateUtc": "2026-04-10", "score": 80, "breakdown": { ... } }
  ]
}
```

Coordinates are rounded to 4 decimal places for the key to reduce storage variance from GPS noise.

### Sparkline Generation (SVG)

The sparkline is a simple `<svg>` path (no external library). Given a data array `[82, 80, 77, 79, 82, …]`:

1. Normalize scores to [0, 100] viewport
2. Calculate path points: `M x1 y1 L x2 y2 L x3 y3 …`
3. Fill area under path with `<polygon>`
4. Render in a container with fixed aspect ratio (4:1)

Example logic:
```typescript
function generateSparklinePoints(scores: number[], width: number, height: number): string {
  if (scores.length === 0) return '';
  const xStep = width / (scores.length - 1 || 1);
  const points = scores.map((s, i) => ({
    x: i * xStep,
    y: height - (s / 100) * height, // inverted Y (SVG origin top-left)
  }));
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}
```

---

## Acceptance Criteria

```gherkin
Feature: Daily Score History & Trends

  Scenario: Record score on app launch
    Given the user opens the app on Apr 11
    When the app initializes with a valid fishing score (82)
    Then ScoreHistoryService records the score for today (2026-04-11)
    And it is persisted in localStorage under moonbite_history_<lat>_<lng>

  Scenario: Record once per day per location
    Given the user has already recorded a score for Lake Tahoe on Apr 11
    When the user opens the app again on Apr 11 (same day)
    Then the score is updated (not duplicated) in history
    When the user opens the app on Apr 12
    Then a new score entry is recorded for Apr 12

  Scenario: View history screen with 7-day data
    Given the user has 7 days of recorded scores
    When the user navigates to /history with the "7 days" tab active
    Then all 7 recent days are listed with their scores
    And the sparkline visualization renders correctly
    And the highest and lowest scores are shown

  Scenario: Switch time range tabs
    Given the user is on /history
    When the user taps the "14 days" tab
    Then the list and sparkline update to show 14 days of data
    And the count of records increases

  Scenario: View sparkline visualization
    Given the user is viewing /history with ≥ 3 days of data
    Then an SVG sparkline is rendered showing the trend
    And the line color is the primary brand color
    And the area under the line is filled with 10% opacity
    And the sparkline fits within the mobile viewport (full width, ~120px height)

  Scenario: High and low score badges
    Given the user is viewing /history
    Then the highest score and its date are displayed (e.g., "High: 89 (Apr 9)")
    And the lowest score and its date are displayed (e.g., "Low: 61 (Apr 3)")

  Scenario: Daily entry with trend arrow
    Given the user is viewing /history on Apr 11 (score 82)
    When the previous day (Apr 10) had score 80
    Then the Apr 11 entry shows "↑ +2" in the success colour

  Scenario: Empty state (no history)
    Given the user has never recorded a score
    When they navigate to /history
    Then the message "Not enough history yet. Check back after a few days." appears
    And the sparkline is not rendered

  Scenario: Location-specific history
    Given the user has saved two locations: "Lake Tahoe" and "Home Waters"
    When they activate "Lake Tahoe" and record a score of 89
    And they switch to "Home Waters" and record a score of 71
    Then /history for Lake Tahoe shows only Lake Tahoe scores (89)
    And /history for Home Waters shows only Home Waters scores (71)

  Scenario: History persists across sessions
    Given the user recorded scores on Apr 1–5
    When the user closes and reopens the app on Apr 11
    Then all Apr 1–5 scores are still visible in /history
    And Apr 11's score is added to the history

  Scenario: Old records pruned after 30 days
    Given the user has recorded scores from Apr 1–30 (30 records)
    When the app runs on May 11 and records a new score
    Then scores older than 30 days (before Apr 12) are removed
    And only the latest 30 days remain

  Scenario: Null score handling
    Given the app launches but FishingScoreService returns null
    When ScoreHistoryService.recordTodayScore(null, …) is called
    Then no entry is added to history
    And the history is unchanged
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Recording accuracy | 100% — score matches calculated value on that date |
| Sparkline render time | ≤ 50ms on mobile |
| localStorage footprint | ≤ 100KB for 365 days of all locations combined |
| Persistence | 100% — survives page reload and app restart |
| Unit test coverage | ≥ 85% (statements, branches, functions, lines) |
| User engagement | ≥ 40% of users view history at least once per week (goal) |
| Data accuracy | Trend sparkline matches hand-calculated values (visual regression test) |

---

## Implementation Notes

### Recording Flow

1. `AppComponent.ngOnInit()` injects `ScoreHistoryService` and calls `recordTodayScore()`
2. The score is obtained from `FishingScoreService.getScore()` (already async)
3. If the score is null, recording is skipped
4. If the score is valid, `ScoreHistoryService` parses the active location's coordinates and persists the record
5. Storage key uses rounded coordinates to handle GPS variance

### localStorage Optimization

- **Key format:** `moonbite_history_<rounded-lat>_<rounded-lng>` (e.g., `moonbite_history_39.0968_-120.0324`)
- **Rounding:** 4 decimal places (~11 meters precision) to reduce key variance
- **Pruning:** On each `recordTodayScore()` call, records older than 30 days are removed before saving
- **Compression:** No; raw JSON with minimal nesting

### Sparkline Edge Cases

- **Single data point:** Render as a flat line at that score's Y position
- **All scores equal:** Render as a flat line at that score's Y position
- **Missing dates:** Treat as a gap; the sparkline line skips the gap (no interpolation)
- **Score = 0:** Renders at the bottom of the chart
- **Score = 100:** Renders at the top of the chart

### Time Range Selection

- **7 days:** Default on first visit; suitable for weekly patterns
- **14 days:** Captures fortnightly cycles (e.g., spring tides, lunar month half)
- **30 days:** Full lunar month; long-term trends

### Trend Arrow Calculation

```typescript
function getTrendArrow(
  todayScore: number,
  yesterdayScore: number | undefined,
): { symbol: '↑' | '↓' | '—'; delta: number; color: string } {
  if (!yesterdayScore) return { symbol: '—', delta: 0, color: 'text-secondary' };
  const delta = todayScore - yesterdayScore;
  if (delta > 0) return { symbol: '↑', delta, color: 'success' };
  if (delta < 0) return { symbol: '↓', delta: Math.abs(delta), color: 'error' };
  return { symbol: '—', delta: 0, color: 'text-secondary' };
}
```

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService` + coordinates (via `ActiveLocationService`) |
| Feature 05 | `FishingScoreService.getScore()` — the daily score to record |
| Feature 13 | `SavedLocationsService` — to know which location is active |
| Feature 12 | Routing + bottom nav (route to `/history`) |

---

## Out of Scope

| Item | Future Feature |
|------|---------------|
| Advanced filtering (by score range, location, custom dates) | Feature 24 (Advanced Analytics) |
| Export history to CSV/PDF | Feature 24 (Advanced Analytics) |
| Push notification when score exceeds threshold | Feature 19 (Notifications) |
| Predictive forecast ("likely to be better next week") | Feature 21 (AI Forecast) |
| Annotation (user notes, "caught 10 fish today") | Feature 25 (Fishing Log) |
| Cloud sync of history | Feature 22 (Premium) |
| Shareable history link | Feature 17 (Share Score) |

---

## Rationale

### Why localStorage (not cloud)?

- **Offline capable:** Users can view history without internet
- **Privacy:** Sensitive location data stays on device
- **No account needed:** Aligns with MoonBite's lightweight philosophy
- **Performance:** Instant access; no network latency

### Why limit to 30 days?

- localStorage quota is ~5–10MB per domain; 30 days ≈ 50KB per location (reasonable)
- 30 days captures a full lunar cycle, the primary fishing driver
- Longer history (365 days) would exceed quota with multiple locations

### Why CSS/SVG sparkline (not Chart.js)?

- Zero dependencies; faster load and smaller bundle
- Offline capable; no CDN call
- Customizable via SCSS tokens
- Simple enough: line chart with fill area is 20 lines of code

### Why record on app launch (not manual logging)?

- Frictionless: user doesn't have to remember to log
- Consistent: one score per day per location, no gaps
- Non-intrusive: happens silently in background
