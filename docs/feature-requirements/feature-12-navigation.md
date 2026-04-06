# Feature 12 — Bottom Navigation / Routing

**Status:** Complete
**Milestone:** 2 — Core Value

---

## Overview

Implement a persistent bottom tab navigation bar that enables seamless navigation between MoonBite's four primary screens: Home, Moon Phase Details, Solunar Peak Times Details, and Weather Details. Currently, users can access detail screens only via tappable cards on the home screen or the browser back button — there is no persistent navigation affordance. The bottom navigation bar solves this by providing a clear, touch-friendly way for users to explore all aspects of their daily fishing conditions without losing context.

This feature unlocks the core value of Features 08–11 by making detail screens discoverable and directly accessible in a single tap from anywhere in the app.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | A persistent bottom tab bar on all main screens | I can navigate between sections without tapping back or guessing routes |
| US-2 | Angler | To tap the Home tab and return to the fishing score card instantly | I can quickly reference the overall score while exploring details |
| US-3 | Angler | To see which tab is currently active (highlighted) | I always know which screen I'm viewing |
| US-4 | Angler | To tap the Moon tab directly | I can understand how moon phase affects my score without going back to Home first |
| US-5 | Angler | To tap the Solunar tab directly | I can plan my fishing trips around optimal windows in one tap |
| US-6 | Angler | To tap the Weather tab directly | I can check atmospheric conditions without navigating through the Home screen |
| US-7 | Angler | Tapping an already-active tab to scroll content back to the top | I can reset my view quickly without manually scrolling up |

---

## UX Notes

### Workflow Validation

The 4-tab structure maps to the natural mental model anglers use when planning a fishing session: "What's my score?" → "What's the moon doing?" → "When are peak bite times?" → "What's the weather?" The flat tab structure supports one-tap access to each data layer without navigating a hierarchy.

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tapping active tab | Scroll content to top | iOS/Android platform convention; lets anglers reset view mid-session without manual scroll |
| `/score` route — which tab is active? | Home tab remains highlighted | `/score` is a child of Home; highlighting Home signals the user's location in the hierarchy |
| Nav visibility on `/score` | Always visible | In a gloved, outdoor, one-handed context, the persistent nav is a reliable escape hatch; hiding it forces use of a Back button users may not find |

### Accessibility (Fishing Context)

- Minimum 48×48px touch targets (glove tolerance; WCAG 2.5.5 recommends 44×44px minimum)
- Sufficient contrast for active state in direct sunlight (≥ 4.5:1)
- `aria-current="page"` on active tab for screen readers
- No hover-only affordances — outdoor touch context

---

## UI Spec

### Layout

```
┌─────────────────────────────────┐
│  🎣 MoonBite      Sun, Apr 6    │  ← sticky app header (existing)
├─────────────────────────────────┤
│                                 │
│  [Screen content area]          │
│  padding-bottom: 64px           │
│                                 │
├─────────────────────────────────┤
│  🏠      🌙      ☀️       ☁️      │  ← bottom navigation bar (fixed)
│ Home    Moon  Solunar  Weather  │
└─────────────────────────────────┘
```

### Tab Definitions

| Tab | Icon | Label | Route | Match |
|-----|------|-------|-------|-------|
| Home | 🏠 | Home | `/` | Exact |
| Moon | 🌙 | Moon | `/moon` | Prefix |
| Solunar | ☀️ | Solunar | `/solunar` | Prefix |
| Weather | ☁️ | Weather | `/weather` | Prefix |

### Visual Design Tokens

| Element | Token | Value |
|---------|-------|-------|
| Bar background | `$color-surface-dark` | Dark surface |
| Bar top border | `rgba(white, 0.08)` | Subtle separator |
| Inactive icon + label | `$color-text-on-dark-secondary` | ~60% opacity muted |
| Active icon + label | `$color-accent` | Gold accent |
| Bar height | `64px` | Fixed |
| Safe-area padding | `env(safe-area-inset-bottom)` | iOS notch support |
| Icon size | `22px` | `font-size` |
| Label size | `11px` | `font-size`, `font-weight: 500` |
| Tab gap | `$space-xs` | Between icon and label |
| `z-index` | `100` | Above scrollable content |

### Interaction States

| State | Appearance |
|-------|------------|
| Default | `$color-text-on-dark-secondary` |
| Active | `$color-accent`; `aria-current="page"` |
| Hover (desktop only) | Slightly lighter text; `@media (hover: hover)` |
| Focus-visible | `@include focus-ring` mixin, inset ring |

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/bottom-nav/bottom-nav.component.ts` | Standalone `OnPush` component; tab definitions, route logic |
| `src/app/bottom-nav/bottom-nav.component.html` | Nav element with 4 tab links |
| `src/app/bottom-nav/bottom-nav.component.scss` | Fixed positioning, flex tabs, active state, safe-area |
| `src/app/bottom-nav/bottom-nav.component.spec.ts` | Unit tests (≥ 85% coverage) |
| `e2e/tests/bottom-nav.spec.ts` | Playwright acceptance tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.component.ts` | Import and add `BottomNavComponent` |
| `src/app/app.component.html` | Add `<app-bottom-nav>` outside `<router-outlet>` |
| `src/app/app.component.scss` | Add `padding-bottom` to main content area |

### Component Sketch

```typescript
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  protected readonly tabs = [
    { icon: '🏠', label: 'Home',    route: '/',        exact: true  },
    { icon: '🌙', label: 'Moon',    route: '/moon',    exact: false },
    { icon: '☀️',  label: 'Solunar', route: '/solunar', exact: false },
    { icon: '☁️',  label: 'Weather', route: '/weather', exact: false },
  ] as const;
}
```

No new services required. Uses Angular's built-in `RouterLink` and `RouterLinkActive`.

---

## Acceptance Criteria

```gherkin
Feature: Bottom Navigation / Routing

  Scenario: Bottom nav bar is always visible on main screens
    Given the user is on any of the routes "/", "/moon", "/solunar", "/weather", or "/score"
    When the page loads
    Then the bottom navigation bar is visible at the viewport bottom
    And all four tabs are visible with icon and label

  Scenario: Home tab is active on home screen
    Given the user navigates to "/"
    Then the Home tab icon and label display in accent gold
    And all other tabs display in secondary muted color

  Scenario: Moon tab is active on moon details screen
    Given the user navigates to "/moon"
    Then the Moon tab is highlighted in accent gold
    And all other tabs are inactive

  Scenario: Solunar tab is active on solunar details screen
    Given the user navigates to "/solunar"
    Then the Solunar tab is highlighted in accent gold
    And all other tabs are inactive

  Scenario: Weather tab is active on weather details screen
    Given the user navigates to "/weather"
    Then the Weather tab is highlighted in accent gold
    And all other tabs are inactive

  Scenario: Home tab highlighted on score breakdown screen
    Given the user is on the "/score" route
    Then the Home tab is highlighted in accent gold
    And the bottom nav remains visible

  Scenario: Tapping a tab navigates to its route
    Given the user is on any primary screen
    When the user taps the Moon tab
    Then the app navigates to "/moon"
    When the user taps the Solunar tab
    Then the app navigates to "/solunar"
    When the user taps the Weather tab
    Then the app navigates to "/weather"
    When the user taps the Home tab
    Then the app navigates to "/"

  Scenario: Content is not hidden behind the nav bar
    Given the page renders
    Then the main content area has bottom padding equal to nav height (64px)
    And no content is hidden behind the navigation bar on scroll

  Scenario: Bottom nav is sticky on scroll
    Given the user is on a detail screen with scrollable content
    When the user scrolls the content area
    Then the bottom navigation bar remains fixed at the viewport bottom

  Scenario: Nav bar is keyboard accessible
    Given the user presses Tab to navigate the page
    When focus reaches the bottom navigation
    Then each tab is focusable in order
    And pressing Enter on a tab navigates to that route
    And each tab displays a visible focus ring

  Scenario: Nav bar has proper ARIA landmark
    Given the page renders
    Then the nav element has role="navigation"
    And aria-label="Main navigation"
    And the active tab has aria-current="page"

  Scenario: Mobile layout — equal tab distribution
    Given the viewport width is 375px
    When the bottom nav renders
    Then each of the four tabs occupies 25% of the screen width
    And each tap target is at least 44×44px

  Scenario: Safe area inset respected on iOS devices
    Given the app runs on an iPhone with a home indicator
    When the bottom nav renders
    Then the nav bar includes bottom padding for the safe area inset
    And no tab content overlaps the home indicator area
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Tab navigation adoption | ≥ 50% of sessions use bottom nav (vs. back button) |
| Navigation reliability | 100% — all routes navigable; active state always correct |
| Tap success rate | ≥ 95% — targets ≥ 44×44px |
| WCAG 2.1 AA compliance | All contrast pairs pass; landmark structure valid |
| Unit test coverage | ≥ 85% (statements, branches, functions, lines) |

---

## Implementation Notes

- **Route detection:** Uses `toSignal` + `NavigationEnd` filter (not `RouterLinkActive`) to give full control over active-state logic including the `/score` → Home mapping.
- **`HOME_CHILD_ROUTES` set:** A `Set<string>` constant maps child drill-down routes to their parent tab. Extending to future child routes is one line.
- **Token additions:** `$nav-height: 64px` and `$transition-fast` were added to `_variables.scss` during code review.
- **`app.component.html`:** `<router-outlet>` is now wrapped in `<main class="app-shell__content">` (adds semantic landmark + bottom padding).
- **Tab `tabs` visibility:** `tabs` is `readonly` but `public` so the unit spec can assert its length without bypassing TypeScript access rules.

---

## Out of Scope

| Item | Future Milestone |
|------|-----------------|
| Side navigation for desktop | Milestone 3 |
| Tab badges / notification counts | Feature 19 (Smart Notifications) |
| Swipe gesture navigation | Milestone 3 |
| Animated route transitions | Milestone 3 |
| Custom SVG icon set | Future polish |

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 06 | App Shell; home screen at `/` |
| Feature 08 | Moon details at `/moon` |
| Feature 09 | Solunar details at `/solunar` |
| Feature 10 | Weather details at `/weather` |
| Feature 07 | SCSS design tokens (`$color-accent`, `$color-surface-dark`, `$space-*`, `$bp-*`) |
