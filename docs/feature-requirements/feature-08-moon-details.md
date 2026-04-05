# Feature 08 — Moon Phase Details Screen

**Status:** Complete

## Overview

Transform the compact moon phase card from the home screen into a full-page details view at route `/moon`. The details screen expands on the daily moon phase data (phase name, illumination, moon age) and adds contextual insights: a 7-day lunar forecast, days until next full/new moon, and fishing advice tailored to the current lunar phase. No new backend data sources are required — all calculations derive from `MoonPhaseService.calculateForDate()` and `.calculateForDateString()`, which already exist and are deterministic.

The details screen reinforces MoonBite's core value proposition: moon phase is a significant driver of fishing success. Users who tap the moon card on the home screen gain deeper understanding and longer-term planning context.

---

## User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-1 | angler | tap the moon phase card on home to see more detail | I can understand lunar cycles in depth |
| US-2 | angler | see today's illumination, age, and phase name full-screen | I get a clear overview of lunar conditions |
| US-3 | angler | see the next 7 days of moon phases in a mini forecast | I can plan my fishing trips around optimal lunar windows |
| US-4 | angler | see how many days until the next full and new moon | I know when peak fishing conditions arrive |
| US-5 | angler | read fishing advice specific to the current moon phase | I understand how this phase affects my chances |
| US-6 | angler | navigate back to home from the details screen | I can return to the main dashboard easily |

---

## UX Brief

Users come to the moon details screen from one of two sources:
1. Tapping the moon phase card on the home screen
2. Direct navigation (e.g., bookmarked `/moon` link or deep link)

The screen follows a **top-to-bottom story arc**:

1. **Back Navigation** — Compact `← Back to Home` link at the top
2. **Today's Moon Hero** — Large emoji, phase name, illumination %, moon age, and a full-width fishing score bar
3. **Key Metrics** — "Days until full moon" and "Days until new moon" displayed as stat cards
4. **Fishing Advice Blurb** — Phase-specific guidance embedded in the score section
5. **7-Day Forecast** — Mini phase cards for the next 7 days (tomorrow through +6 days), each showing date, emoji, phase name, illumination %, and score

**Mobile-First Responsive Design:**
- Mobile (< 768px): Single-column layout, forecast cards scroll horizontally
- Tablet/Desktop (≥ 768px): Hero side-by-side layout, 4-col stats grid, forecast fills one row
- Dark theme throughout; consistent with the home screen moon card tokens

---

## UI Spec

### Route & Component

**Route:** `/moon`
**Component:** `MoonDetailsComponent`
**Selector:** `app-moon-details`

### 1. Component Breakdown (BEM Naming)

| Block / Element | HTML Element | Purpose |
|---|---|---|
| `.moon-detail` | `<main>` | Page root, `role="main"` landmark |
| `.moon-detail__back` | `<a>` | Back navigation link, `routerLink="/"` |
| `.moon-detail__hero` | `<section>` | Hero section: emoji, phase name, illumination, score bar |
| `.moon-detail__hero-emoji` | `<span>` | Large moon emoji (`aria-hidden="true"`) |
| `.moon-detail__hero-phase` | `<h1>` | Phase name, accent gold |
| `.moon-detail__hero-illumination` | `<p>` | Illumination percentage |
| `.moon-detail__stats` | `<section>` | 2-col (mobile) / 4-col (tablet+) stats grid |
| `.moon-detail__stat` | `<div>` | Individual stat cell |
| `.moon-detail__stat-value` | `<span>` | Numeric value, large bold |
| `.moon-detail__stat-label` | `<span>` | Uppercase caption |
| `.moon-detail__score` | `<section>` | Fishing score bar + explanation |
| `.moon-detail__score-bar-track` | `<div>` | Animated fill track (`role="meter"`) |
| `.moon-detail__score-bar-fill` | `<div>` | Animated fill element |
| `.moon-detail__score-badge` | `<span>` | Pill badge: numeric score |
| `.moon-detail__score-explanation` | `<p>` | Phase-specific fishing advice copy |
| `.moon-detail__forecast` | `<section>` | 7-day lunar forecast strip |
| `.moon-detail__forecast-list` | `<ol>` | Ordered list of 7 day cards |
| `.moon-detail__forecast-card` | `<li>` | Individual day card |
| `.moon-detail__forecast-card--today` | modifier | Highlighted current day (accent border) |
| `.moon-detail__forecast-date` | `<span>` | Short date (e.g. "Apr 5") |
| `.moon-detail__forecast-emoji` | `<span>` | Phase emoji (`aria-hidden="true"`) |
| `.moon-detail__forecast-name` | `<span>` | Abbreviated phase name |
| `.moon-detail__forecast-score` | `<span>` | Score badge |

### 2. Mobile Wireframe (< 768px)

```
┌──────────────────────────────────┐
│  🎣 MoonBite          Apr 5 2026 │  ← sticky header (existing)
├──────────────────────────────────┤
│                                  │
│  ← Back to Home                  │  back link
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │            🌔              │  │  hero section
│  │       Waxing Gibbous       │  │  (dark surface card)
│  │       Illuminated 72%      │  │
│  │                            │  │
│  │  ████████████████░░  [74]  │  │  fishing score bar
│  └────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │  Day 9   │  │    72%       │  │  stats grid
│  │ MOON AGE │  │ ILLUMINATED  │  │  (2 cols, 2 rows)
│  ├──────────┤  ├──────────────┤  │
│  │  6 days  │  │  21 days     │  │
│  │ TO FULL  │  │  TO NEW      │  │
│  └──────────┘  └──────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Fishing Score             │  │  score + advice
│  │  Bright nights ahead —     │  │
│  │  fish deeper structure     │  │
│  │  as moonlight increases.   │  │
│  └────────────────────────────┘  │
│                                  │
│  7-Day Lunar Forecast            │
│  ┌────┬────┬────┬────┬────┬────┬────┐
│  │Apr5│Apr6│Apr7│Apr8│Apr9│A10 │A11 │
│  │ 🌔 │ 🌔 │ 🌕 │ 🌖 │ 🌖 │ 🌗 │ 🌘 │
│  │WxG │WxG │Ful │WnG │WnG │LsQ │WnC │
│  │ 74 │ 76 │ 82 │ 78 │ 74 │ 65 │ 58 │
│  └────┴────┴────┴────┴────┴────┴────┘
│       (horizontal scroll on mobile)  │
│                                  │
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
│  │  🌔   Waxing Gibbous     Illuminated 72%     │  │  hero: emoji left, text right
│  │       ████████████████░░░░░░░░  [74]         │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │  Day 9   │   72%    │  6 days  │ 21 days  │    │  stats: 4-col single row
│  │ MOON AGE │ ILLUMIN. │ TO FULL  │  TO NEW  │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Fishing Score      ████████████████░░  [74] │  │
│  │  Bright nights ahead — fish deeper structure  │  │
│  │  as moonlight increases.                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  7-Day Lunar Forecast                              │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐│
│  │ Apr5 │ Apr6 │ Apr7 │ Apr8 │ Apr9 │ A 10 │ A 11 ││
│  │  🌔  │  🌔  │  🌕  │  🌖  │  🌖  │  🌗  │  🌘  ││
│  │  WxG │  WxG │ Full │  WnG │  WnG │ LstQ │  WnC ││
│  │  74  │  76  │  82  │  78  │  74  │  65  │  58  ││
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘│
│       (no scroll at tablet — all 7 fit in row)      │
└────────────────────────────────────────────────────┘
```

### 4. Detailed Layout Description

#### Back Navigation
- Plain anchor, padding `$space-md` top/bottom, `0` horizontal.
- `←` arrow + "Back to Home" text.
- Color: `$color-text-on-dark-secondary` at rest; `$color-text-on-dark` + underline on hover.
- Focus-visible: `@include focus-ring`.

#### Hero Section
- Background: `$color-surface-dark` card, `$radius-lg` corners, `$shadow-dark`. Padding: `$space-xl`.
- Mobile: vertical stack — emoji centered (5.5rem), then phase name `<h1>`, illumination `<p>`, score bar.
- Tablet+: two-column flex row — emoji column (~80px fixed) left; text column right.
- Phase name: `$font-size-xl`, `$font-weight-bold`, `$color-accent`.
- Illumination: `$font-size-lg`, `$color-text-on-dark`.
- Score bar: identical pattern to home card (track height 12px, animated fill, pill badge).

#### Stats Grid
- Background: `$color-surface-dark-alt`, `$radius-lg`, `$shadow-dark`.
- Mobile: 2-column CSS Grid, 2 rows (4 cells total).
- Tablet+: 4-column CSS Grid, 1 row.
- Cell borders: `1px solid $color-border-dark` via inner borders.
- Stat value: `$font-size-xl`, `$font-weight-bold`, `$color-text-on-dark`.
- Stat label: `$font-size-xs`, `$font-weight-medium`, `$color-text-on-dark-secondary`, `text-transform: uppercase`, `$letter-spacing-caps`.
- Cell padding: `$space-lg`.

#### Fishing Score Section
- Background: `$color-surface-dark`, `$radius-lg`, `$shadow-dark`.
- Section heading: `$font-size-lg`, `$font-weight-bold`, `$color-text-on-dark`.
- Score bar: same as hero bar. Fill color driven by score tier:
  - `< 40` → `$color-score-poor`
  - `40–69` → `$color-score-fair`
  - `≥ 70` → `$color-score-good`
- Explanation: `$font-size-sm`, `$color-text-on-dark-secondary`, `margin-top: $space-md`.

#### 7-Day Forecast Strip
- Section `<h2>`: `$font-size-lg`, `$font-weight-bold`, `$color-text-on-dark`, `margin-bottom: $space-md`.
- List: `display: flex`, `gap: $space-sm`.
- Mobile: `overflow-x: auto`, `scroll-snap-type: x mandatory`, cards snap to start.
- Tablet+: `flex-wrap: nowrap`, all 7 cards visible without scroll.
- Card: `flex: 0 0 auto`, min-width `80px`, background `$color-surface-dark-alt`, `$radius-md`, `$shadow-dark`, padding `$space-sm $space-xs`.
- Today modifier: `border: 2px solid $color-accent`, `$shadow-dark-hover`.
- Date: `$font-size-xs`, `$color-text-on-dark-secondary`.
- Emoji: `1.5rem`, `aria-hidden="true"`.
- Phase abbreviation: `$font-size-xs`, `$color-text-on-dark`.
- Score badge: `$font-size-xs`, pill, score-tier color.

### 5. SCSS Design Token Usage

| Element | Token | Property |
|---|---|---|
| Page background | `$color-surface-dark` | `background-color` |
| Hero / score cards | `$color-surface-dark` | `background-color` |
| Stats grid bg | `$color-surface-dark-alt` | `background-color` |
| Forecast cards | `$color-surface-dark-alt` | `background-color` |
| Score badge bg | `$color-surface-dark-alt` | `background-color` |
| Cell dividers | `$color-border-dark` | `border-color` |
| Today card border | `$color-accent` | `border-color` |
| Phase name h1 | `$color-accent` | `color` |
| Score badge text | `$color-accent` | `color` |
| Primary body text | `$color-text-on-dark` | `color` |
| Secondary / label text | `$color-text-on-dark-secondary` | `color` |
| Score bar track | `$color-score-track` | `background-color` |
| Score fill — poor | `$color-score-poor` | `background-color` |
| Score fill — fair | `$color-score-fair` | `background-color` |
| Score fill — good | `$color-score-good` | `background-color` |
| Stat label spacing | `$letter-spacing-caps` | `letter-spacing` |
| Card corners | `$radius-lg` | `border-radius` |
| Forecast card corners | `$radius-md` | `border-radius` |
| Badge corners | `$radius-full` | `border-radius` |
| Card shadow | `$shadow-dark` | `box-shadow` |
| Today card shadow | `$shadow-dark-hover` | `box-shadow` |
| Spacing | `$space-xs` … `$space-xl` | `padding` / `gap` / `margin` |
| Score bar animation | `$transition-base` | `transition` |
| Back link / hover | `$transition-fast` | `transition` |
| Focus rings | `@include focus-ring` | `outline` |
| Responsive breakpoint | `$bp-md` | `@include respond-above` |

**No new global tokens required.** Hero emoji `5.5rem` is a component-level constant in the SCSS file.

### 6. Interaction Patterns

#### Back Link
- Rest: `$color-text-on-dark-secondary`, no underline.
- Hover: `$color-text-on-dark`, underline, `color $transition-fast`.
- Focus-visible: `@include focus-ring`.

#### Score Bar Fill Animation
- On `afterNextRender()`, set a `scoreReady` signal to `true`, triggering `width: 0 → score%` transition.
- Transition: `width $transition-base`.
- `prefers-reduced-motion`: skip transition, show full width immediately.

#### Forecast Card Hover
- Hover: `box-shadow: $shadow-dark-hover`, `transform: translateY(-2px)`, `transition: $transition-fast`.
- Focus-visible: `@include focus-ring`.
- Today card: always shows `$shadow-dark-hover` + accent border; hover adds only the translate.
- Cards are informational in MVP (no drill-down link).

### 7. Accessibility Notes

**Landmark structure:**
```
<header>        ← existing sticky app header
<main class="moon-detail">
  <nav aria-label="Page navigation">   ← wraps back link
  <section aria-labelledby="moon-hero-heading">
  <section aria-labelledby="moon-stats-heading">
  <section aria-labelledby="moon-score-heading">
  <section aria-labelledby="moon-forecast-heading">
```

**ARIA annotations:**

| Element | Requirement |
|---|---|
| Moon emoji spans | `aria-hidden="true"` |
| Score bar track | `role="meter" aria-valuenow aria-valuemin="0" aria-valuemax="100"` |
| Back link | `aria-label="Back to Home"` |
| Forecast list | `<ol aria-label="7-day lunar forecast">` |
| Today forecast card | `aria-current="date"` |
| Stat cells | `aria-label` with full readable phrase (e.g. "Moon age: Day 9") |

**Contrast ratios (WCAG 2.1 AA):**

| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| `$color-text-on-dark` (#f9fafb) | `$color-surface-dark` (#111827) | ~16:1 | AA + AAA |
| `$color-text-on-dark-secondary` (#9ca3af) | `$color-surface-dark` (#111827) | ~7:1 | AA |
| `$color-accent` (#f0a500) | `$color-surface-dark` (#111827) | ~8.5:1 | AA large + AAA |
| `$color-accent` (#f0a500) | `$color-surface-dark-alt` (#1f2937) | ~7.5:1 | AA |
| `$color-text-on-dark-secondary` (#9ca3af) | `$color-surface-dark-alt` (#1f2937) | ~5.5:1 | AA |

**Motion sensitivity:** Wrap score bar transition and any `translateY` hover in `@media (prefers-reduced-motion: reduce)` blocks.

---

## Fishing Advice Copy

Static lookup keyed by `phaseName`:

| Phase | Advice |
|-------|--------|
| New Moon | New moons are prime fishing periods — reduced light favors active feeders. Night fishing is particularly effective. |
| Waxing Crescent | Fish activity is picking up as the moon grows. Expect steady action, especially in early morning and evening. |
| First Quarter | Half-lit skies provide balanced light levels. Time your trips to solunar peak windows for best results. |
| Waxing Gibbous | Bright moonlight is increasing. Focus on dawn and dusk; structure and shade during the day. |
| Full Moon | Some fish feed heavily under the full moon, others grow inactive. Focus on structure and work shade lines. |
| Waning Gibbous | Activity often picks back up post-full moon. Return to evening and night fishing strategies. |
| Last Quarter | Half-lit skies again favor steady fishing. Early mornings are prime windows. |
| Waning Crescent | The transition toward new moon brings renewed activity. Prepare for excellent new moon conditions ahead. |

---

## Architecture Notes

### New Files

| File | Purpose |
|------|---------|
| `src/app/moon-details/moon-details.component.ts` | Standalone component |
| `src/app/moon-details/moon-details.component.html` | Template: hero, stats, score, forecast |
| `src/app/moon-details/moon-details.component.scss` | Mobile-first responsive styles |
| `src/app/moon-details/moon-details.component.spec.ts` | Unit tests (≥85% coverage) |
| `e2e/tests/moon-details.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.routes.ts` | Add `{ path: 'moon', component: MoonDetailsComponent }` |
| `src/app/moon-phase/moon-phase-display.component.html` | Wrap card in `<a routerLink="/moon">` |
| `src/app/moon-phase/moon-phase-display.component.ts` | Add `RouterLink` to `imports` array |

### Component Sketch

```typescript
// moon-details.component.ts
@Component({
  selector: 'app-moon-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './moon-details.component.html',
  styleUrl: './moon-details.component.scss',
})
export class MoonDetailsComponent {
  private readonly moonService = inject(MoonPhaseService);

  protected readonly todayMoon = signal(this.moonService.calculateForToday());
  protected readonly scoreReady = signal(false);
  protected readonly scorePercent = computed(() => `${this.todayMoon().fishingScoreContribution}%`);
  protected readonly moonDay = computed(() => Math.floor(this.todayMoon().moonAge));
  protected readonly daysToFullMoon = computed(() => {
    const age = this.todayMoon().moonAge;
    const days = Math.ceil(((14.765 - age) % 29.530589 + 29.530589) % 29.530589);
    return days === 0 ? 29 : days;
  });
  protected readonly daysToNewMoon = computed(() => {
    const age = this.todayMoon().moonAge;
    const days = Math.ceil(((29.530589 - age) % 29.530589));
    return days === 0 ? 29 : days;
  });
  protected readonly advice = computed(() => PHASE_ADVICE[this.todayMoon().phaseName] ?? '');
  protected readonly forecastDays = signal<MoonPhaseData[]>(this.buildForecast());
  protected readonly scoreClass = computed(() => {
    const s = this.todayMoon().fishingScoreContribution;
    return s >= 70 ? 'good' : s >= 40 ? 'fair' : 'poor';
  });

  constructor() {
    afterNextRender(() => this.scoreReady.set(true));
  }

  private buildForecast(): MoonPhaseData[] {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return this.moonService.calculateForDateString(d.toISOString().slice(0, 10));
    });
  }
}
```

### Service Reuse

No new services. Uses `MoonPhaseService` (Feature 02):
- `calculateForToday()` — today's data for hero + score
- `calculateForDateString(dateString)` — 7-day forecast loop

---

## Acceptance Criteria

```gherkin
Feature: Moon Phase Details Screen

  Scenario: Navigate to moon details from home
    Given the user is on the home screen
    When the user clicks the moon phase card
    Then the browser navigates to "/moon"
    And the moon details screen is rendered

  Scenario: Direct navigation to /moon works
    Given the user navigates directly to "/moon"
    When the page loads
    Then the moon details screen is rendered with all sections visible

  Scenario: Display today's moon hero section
    Given the user is on the moon details screen
    When the page loads
    Then the current moon emoji is displayed (aria-hidden)
    And the phase name is visible as an <h1>
    And the illumination percentage is displayed
    And a fishing score bar is rendered

  Scenario: Stats grid shows all four metrics
    Given the user is on the moon details screen
    When the page loads
    Then the stats grid shows Moon Age (day number)
    And illumination percentage
    And days until next full moon
    And days until next new moon

  Scenario: Days-to-full-moon is calculated correctly
    Given the moon age is approximately 0 (new moon)
    When the stats grid renders
    Then "Days to Full Moon" shows approximately 14–15

  Scenario: Days-to-new-moon is calculated correctly
    Given the moon age is approximately 14.765 (full moon)
    When the stats grid renders
    Then "Days to New Moon" shows approximately 14–15

  Scenario: Phase-specific advice is displayed
    Given the current phase is "Full Moon"
    When the score section renders
    Then the advice text contains reference to structure or shade fishing

  Scenario: 7-day forecast renders 7 cards
    Given the user is on the moon details screen
    When the forecast section loads
    Then exactly 7 forecast cards are visible
    And each card shows a date label, moon emoji, phase name, and score

  Scenario: Today's forecast card is highlighted
    Given the forecast renders with today as the first card
    Then the first card has an accent border (today modifier)
    And carries aria-current="date"

  Scenario: Back navigation returns to home
    Given the user is on the moon details screen
    When the user clicks "← Back to Home"
    Then the browser navigates to "/"

  Scenario: Back link is keyboard accessible
    Given the user presses Tab on the moon details screen
    Then the back link receives focus
    And pressing Enter navigates to "/"

  Scenario: Moon emoji is hidden from screen readers
    Given the page renders
    Then all moon emoji spans have aria-hidden="true"
    And the phase name <h1> is announced instead

  Scenario: Score bar has accessible meter role
    Given the score section renders
    Then role="meter" is present on the score bar track
    And aria-valuenow matches the current score
    And aria-valuemin="0" and aria-valuemax="100" are set

  Scenario: Mobile layout scrolls forecast horizontally
    Given the viewport is 375px wide
    When the forecast section renders
    Then the card list overflows horizontally with scroll enabled
    And scroll-snap-type is applied

  Scenario: Tablet layout shows all forecast cards without scroll
    Given the viewport is 768px or wider
    When the forecast section renders
    Then all 7 forecast cards are visible without scrolling
```

---

## Success Metrics

- **Tap-through rate from home → moon details:** ≥ 30% of active sessions
- **Forecast accuracy:** 100% (all 7 cards match `MoonPhaseService` output)
- **Advice coverage:** 100% (all 8 phases have advice copy; no null/undefined)
- **Navigation reliability:** 100% (no 404 on `/moon`; back link always works)
- **Unit test coverage:** ≥ 85% statements, branches, functions, lines
- **E2E test coverage:** All 15 acceptance criteria verified in Playwright
- **WCAG 2.1 AA:** All contrast pairs pass; all interactive elements keyboard accessible

---

## Non-Functional Requirements

| Requirement | Acceptance |
|---|---|
| **Performance** | No new HTTP calls; all data from `MoonPhaseService` |
| **Offline** | Fully functional without network |
| **Bundle Size** | < 15 KB incremental (component + template + styles) |
| **Accessibility** | WCAG 2.1 AA throughout |
| **Responsive** | ≤375px mobile through 1920px desktop |
| **Code Quality** | ESLint + Prettier pass; no `any`; strict TypeScript |

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 02 | `MoonPhaseService`, `MoonPhaseData` |
| Feature 06 | Home screen layout; moon card becomes navigation origin |
| Feature 07 | Responsive SCSS tokens and breakpoints |

---

## Known Limitations & Future Enhancements

| Item | Scope | Notes |
|---|---|---|
| Date picker | Out of MVP | Future `/moon?date=YYYY-MM-DD` query param |
| Forecast interactivity | Out of MVP | Clicking forecast card for full day view |
| Moon rise/set times | Out of scope | Requires complex sphere geometry |
| Lunar eclipse alerts | Out of scope | Not relevant to fishing |
| Timezone-aware display | Out of scope | UTC calculations; local date display via `DatePipe` |

---

## Implementation Notes

### Files Created
- `src/app/moon-phase/moon-details.component.ts` — Standalone `OnPush` component with signals; `forecastDays` built as a `readonly` field in the constructor (deterministic, no reactive overhead needed)
- `src/app/moon-phase/moon-details.component.html` — Angular `@for` control flow, full ARIA landmark structure
- `src/app/moon-phase/moon-details.component.scss` — Mobile-first, all design tokens, `prefers-reduced-motion` respected
- `src/app/moon-phase/moon-details.component.spec.ts` — 41 Jasmine unit tests, 98.86% statement coverage

### Files Modified
- `src/app/app.routes.ts` — Added lazy `/moon` route via `loadComponent`
- `src/app/moon-phase/moon-phase-display.component.html` — Wrapped card in `<a routerLink="/moon">`
- `src/app/moon-phase/moon-phase-display.component.ts` — Added `RouterLink` to imports
- `src/app/moon-phase/moon-phase-display.component.scss` — Added `.moon-phase-display__link` wrapper style with focus ring
- `src/app/moon-phase/moon-phase-display.component.spec.ts` — Added `provideRouter([])` to TestBed for RouterLink

### Key Decisions
- **Forecast as readonly field, not signal:** `MoonPhaseService` is deterministic; rebuilding the 7-day array reactively would add overhead with no benefit.
- **`daysToFullMoon`/`daysToNewMoon` zero-guard:** Added `result > 0 ? result : Math.round(LUNAR_CYCLE)` to prevent Math.round rounding a near-zero raw value to 0.
- **Forecast score badges use text color, not background pill:** `$color-score-poor` (#e74c3c) only achieves 3.54:1 on dark-alt surfaces — below WCAG AA 4.5:1 for small text. Good/Fair use tier text color; Poor falls back to `$color-text-on-dark-secondary` (5.5:1).
- **Score fill animation:** Same `afterNextRender()` + `scoreReady` signal + `--score-target-width` CSS custom property pattern as `MoonPhaseDisplayComponent`.

### Test Coverage
- 395/395 unit tests pass (all suites)
- Statements 98.86%, Branches 90.24%, Functions 100%, Lines 98.21% — all above 85% threshold
- E2E tests written in `e2e/tests/moon-details.spec.ts` (26 scenarios)
