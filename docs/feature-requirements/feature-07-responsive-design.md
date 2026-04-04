# Feature 07 — Responsive Design & Mobile-First CSS

**Status:** Complete  
**Milestone:** 1 — MVP  

---

## Overview

Feature 07 addresses CSS correctness and responsive layout quality across all screen sizes. The home screen grid, individual data cards, and interactive elements have several bugs that prevent cards from filling their grid cells, cause double-spacing, use hardcoded color values, and leave touch targets undersized. This feature fixes those issues systematically through updated design tokens, a new mixin, and explicit per-component layout rules.

---

## User Stories

1. **As a mobile user**, I want each data card to fill the full screen width so I can read fishing data without horizontal scrolling or awkward narrow cards.
2. **As a tablet user**, I want the two-column data grid to display cards edge-to-edge within their cells so the layout feels intentional and not cramped.
3. **As a desktop user**, I want the three-column data grid to use all available space up to the content max-width so the page does not look half-empty.
4. **As a user on any device**, I want the location bar to span the full content width so it reads as a cohesive section header, not a narrow floating element.
5. **As a mobile user**, I want all interactive controls (location refresh, any icon buttons) to have tap targets of at least 44×44 px so I can activate them without mis-tapping.

---

## Breakpoint Strategy

The existing breakpoint tokens are authoritative. No new breakpoint values are introduced.

| Range | Label | Layout |
|---|---|---|
| `< 480px` | Mobile | Single-column stack. All cards full width. Score hero full width. Location bar full width. Padding `$space-md`. |
| `480px – 767px` | Small tablet | Same single-column stack. Cards still full width. Increased breathing room via `$space-lg` padding. |
| `768px – 1023px` | Tablet | Two-column data grid (`1fr 1fr`). Score hero and location bar remain full width. Grid gap `$space-lg`. |
| `1024px+` | Desktop | Three-column data grid (`1fr 1fr 1fr`). Content constrained to `max-width: 960px` centered. Grid gap `$space-lg`. |

The home component already implements this breakpoint strategy in `.home__data-grid`. The bug is not in the grid definition but in the card components themselves overriding their own width with `max-width` and `margin` declarations that fight the grid.

---

## Component Layout Rules

### General rule for all data cards

Every card component's **root element** must:

- Set `width: 100%` so it fills its grid cell.
- Remove any `max-width` constraint from the root element (internal content regions may retain their own max-width if needed for readability, e.g. a centered illustration).
- Remove top/bottom `margin` from the root element. The parent grid's `gap` property is the sole source of vertical spacing between cards. Setting `margin: $space-xl auto` on the root creates double-spacing and overrides grid alignment.
- Use `box-sizing: border-box` so padding does not cause overflow.

### Score hero card (`fishing-score-display`)

- Root: `width: 100%`, no `max-width`, no vertical margin.
- The card spans the full content width at all breakpoints; it is not part of the 3-column grid.
- Internal score ring and label may remain centered via `text-align: center` or flexbox, not via `margin: auto` on the root.

### Moon phase card (`moon-phase-display`)

- Root: `width: 100%`, no `max-width`, no vertical margin.
- The moon illustration may be centered within the card using `display: flex; justify-content: center` on an inner wrapper.
- Missing `@use 'mixins' as *;` must be added at the top of `moon-phase-display.component.scss` so the `respond-above` mixin is available for any future breakpoint overrides within the component.

### Solunar card (`solunar-display`)

- Root: `width: 100%`, no `max-width`, no vertical margin.
- No card-specific responsive behavior beyond filling the grid cell.

### Weather card (`weather-display`)

- Root: `width: 100%`, no `max-width`, no vertical margin.
- Score-state colors must use the new design tokens (see section below) instead of raw hex values.
- No other card-specific responsive behavior.

### Location display (`location-display`)

- Root: `width: 100%`. Remove `max-width: 480px`.
- The location bar sits outside the data grid and must span the full content width (up to the home container's `max-width: 960px`).
- Internal text and icon may remain left-aligned or use flex layout, but the root element must not constrain its own width.

---

## New Design Tokens

Add the following tokens to `src/styles/_variables.scss` in a new "Score state colors" section. These replace hardcoded hex values currently in `weather-display.component.scss`.

| Token | Value | Usage |
|---|---|---|
| `$color-score-poor` | `#e74c3c` | Score state: poor conditions |
| `$color-score-fair` | `#f39c12` | Score state: fair conditions |
| `$color-score-good` | `#2ecc71` | Score state: good conditions |

These tokens must be used anywhere a component needs to express fishing condition quality through color.

---

## New Mixin

Add `respond-below($bp)` to `src/styles/_mixins.scss` alongside the existing `respond-above` mixin.

**Specification:**

```scss
@mixin respond-below($bp) {
  @media (max-width: ($bp - 1px)) {
    @content;
  }
}
```

**Usage guidance:**

- Use `respond-below` only when a mobile-specific override cannot be expressed as a default that is then overridden at larger sizes (i.e. when the mobile-first approach would require more overrides than the desktop-first approach for a specific property).
- Prefer `respond-above` (mobile-first) as the default approach.
- The `-1px` offset ensures the breakpoint ranges are non-overlapping with `respond-above($bp)`.

---

## Touch Targets

Any element that is interactive (receives click, tap, or keyboard focus to trigger an action) must meet the following minimum dimensions:

- **Minimum size:** 44px × 44px (WCAG 2.5.5 AAA; also Apple HIG and Material Design recommendation)
- **Implementation:** If the visible element is smaller than 44px, use `padding` to expand the hit area rather than increasing the visible element size. Do not use negative margins or pseudo-element tricks that break layout.
- **Scope for this feature:** The location refresh/retry button inside `location-display` is the primary interactive element on the home screen. Any icon-only button must also satisfy this requirement.

---

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Responsive layout and mobile-first CSS

  Scenario: Moon card fills its grid cell on desktop
    Given the app is displayed at a viewport width of 1200px
    When the home screen renders
    Then the moon phase card width equals the width of its grid cell
    And the moon phase card does not have a max-width of 400px

  Scenario: Weather card fills its grid cell on tablet
    Given the app is displayed at a viewport width of 900px
    When the home screen renders
    Then the weather card width equals the width of its grid cell
    And the weather card does not have a max-width of 400px

  Scenario: Location bar spans full content width on mobile
    Given the app is displayed at a viewport width of 375px
    When the home screen renders
    Then the location display width equals the home container width
    And the location display does not have a max-width of 480px

  Scenario: No double spacing between cards in the data grid
    Given the app is displayed at a viewport width of 1200px
    When the home screen renders
    Then the gap between adjacent data grid cells equals the grid gap value
    And no data card root element has a top or bottom margin greater than 0

  Scenario: Score state colors use design tokens
    Given the weather card is rendering a "good" conditions state
    Then the score indicator color matches the value of $color-score-good
    And no raw hex color value is used for score state styling in the component stylesheet

  Scenario: Touch target size for location refresh button
    Given the location display is visible
    When I inspect the refresh or retry button
    Then the button's tappable area is at least 44px wide
    And the button's tappable area is at least 44px tall

  Scenario: respond-below mixin produces correct media query
    Given the respond-below mixin is called with $bp-md (768px)
    Then the compiled CSS contains a max-width media query of 767px

  Scenario: Single-column layout on narrow mobile viewport
    Given the app is displayed at a viewport width of 360px
    When the home screen renders
    Then the data grid displays one column
    And all three data cards stack vertically
    And no card overflows the viewport horizontally
```

---

## Files to Modify

| File | Change |
|---|---|
| `src/styles/_variables.scss` | Add `$color-score-poor`, `$color-score-fair`, `$color-score-good` tokens |
| `src/styles/_mixins.scss` | Add `respond-below($bp)` mixin |
| `src/app/moon-phase/moon-phase-display.component.scss` | Add `@use 'mixins' as *;`; remove `max-width` and vertical margin from root |
| `src/app/weather/weather-display.component.scss` | Replace raw hex score-state colors with design tokens; remove `max-width` and vertical margin from root |
| `src/app/solunar/solunar-display.component.scss` | Remove `max-width` and vertical margin from root |
| `src/app/scoring/fishing-score-display.component.scss` | Remove `max-width` and vertical margin from root |
| `src/app/location-display/location-display.component.scss` | Remove `max-width: 480px` from root; ensure touch target on interactive button |
