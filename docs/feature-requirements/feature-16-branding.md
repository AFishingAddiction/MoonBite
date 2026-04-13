# Feature 16 — Splash Screen & App Branding

**Status:** Complete  
**Milestone:** 2 — Core Value

---

## Overview

Display a polished full-screen splash screen while the app initializes (geolocation permission request + first data load). The splash shows MoonBite's logo, tagline, and a subtle loading animation. It fades out automatically once a location is resolved or an error state is reached, with a 5-second safety timeout. App-wide branding tokens (colors, typography, spacing) are already established in `_variables.scss`; this feature adds only the splash overlay component.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | To see a polished loading screen when I open the app | The app feels professional and trustworthy on first launch |
| US-2 | Angler | The splash to disappear automatically once the app is ready | I don't have to interact with it; it just works |
| US-3 | Angler | The loading state to be communicated clearly | I know the app is working and not frozen |
| US-4 | Angler | Reduced-motion preferences to be respected | The animation doesn't cause discomfort |

---

## UX Notes

### Workflow

On cold launch: splash covers the full viewport. Behind it, `AppComponent` begins requesting geolocation. Once `ActiveLocationService.coords()` becomes non-null (or `hasError()` is true), the splash starts its exit animation (fade + scale-up) and removes itself from the DOM after 400ms. A 5-second hard timeout ensures the splash never blocks indefinitely.

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Trigger to hide | `coords !== null` OR `hasError === true` OR 5s timeout | Covers all resolution paths |
| Exit animation | Fade-out + slight scale-up (400ms ease-out) | Feels premium; not jarring |
| DOM removal | After animation completes (`isGone` signal) | Prevents stale overlay blocking interactions |
| Logo | 🎣 emoji + "MoonBite" wordmark + tagline | Consistent with app header branding |
| Loader | Three pulsing dots (CSS animation, staggered) | Simple, recognizable, zero dependencies |
| Accessibility | `role="status"`, `aria-live="polite"`, `aria-label="Loading MoonBite"` | Screen readers announce load state |

---

## UI Spec

### Splash Screen Layout

```
┌─────────────────────────────────────────┐  100dvh
│                                         │
│                                         │
│                                         │
│           🎣                            │  64px icon
│                                         │
│         MoonBite                        │  2rem bold
│  Your daily fishing intelligence        │  0.875rem secondary
│                                         │
│           • • •                         │  pulsing loader dots
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

- Background: `$color-surface-dark` (`#111827`)
- Overlay: `position: fixed; inset: 0; z-index: 9999`
- Content: centered via `display: flex; flex-direction: column; align-items: center; justify-content: center`
- Icon font-size: `$font-size-2xl` × 2 (4rem)
- Brand: `$font-size-2xl`, `$font-weight-bold`, `$color-text-on-dark`
- Tagline: `$font-size-sm`, `$color-text-on-dark-secondary`
- Loader dots: 8px circles, `$color-accent`, pulse animation staggered 160ms apart

### Animations

**Entry:** No entry animation — splash is present on first render.

**Exit (`.splash--hiding`):**
```scss
@keyframes splash-fade-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(1.04); }
}
.splash--hiding {
  animation: splash-fade-out 400ms ease-out forwards;
}
```

**Loader dots:**
```scss
@keyframes dot-pulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1;   }
}
```

**Reduced motion:** All animations set to `animation: none`.

### Design Tokens Used

| Purpose | Token |
|---------|-------|
| Overlay background | `$color-surface-dark` |
| Brand text | `$color-text-on-dark` |
| Tagline text | `$color-text-on-dark-secondary` |
| Loader dot color | `$color-accent` |
| Brand font size | `$font-size-2xl` |
| Tagline font size | `$font-size-sm` |
| Font weight | `$font-weight-bold` |
| Spacing between elements | `$space-sm`, `$space-md` |

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/splash/splash-screen.component.ts` | Standalone component; receives `visible` input, manages hide animation |
| `src/app/splash/splash-screen.component.html` | Overlay markup with branding + loader |
| `src/app/splash/splash-screen.component.scss` | Full-screen overlay, animations, reduced-motion |
| `src/app/splash/splash-screen.component.spec.ts` | Jasmine unit tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/app.component.ts` | Add `showSplash` signal; pass to splash component |
| `src/app/app.component.html` | Add `<app-splash-screen [visible]="showSplash()" />` |

### Component API

```typescript
@Component({ selector: 'app-splash-screen', ... })
export class SplashScreenComponent {
  /** Controls visibility. When set false, plays exit animation then removes from DOM. */
  readonly visible = input.required<boolean>();

  /** True during the exit animation (class applied to trigger CSS animation). */
  protected readonly isHiding = signal(false);

  /** True after exit animation completes; removes element from DOM entirely. */
  protected readonly isGone = signal(false);
}
```

### `AppComponent` changes

```typescript
readonly showSplash = signal(true);

constructor() {
  // Hide once location resolves or errors
  effect(() => {
    const coords = this.locationService.coords();
    const hasError = this.locationService.hasError();
    if (coords || hasError) {
      this.showSplash.set(false);
    }
  });
  // Safety timeout: always hide after 5 seconds
  setTimeout(() => this.showSplash.set(false), 5000);
}
```

---

## Acceptance Criteria

```gherkin
Feature: Splash Screen & App Branding

  Scenario: Splash shown on cold launch
    Given the user opens the app for the first time
    Then the splash screen overlay is visible
    And it displays the MoonBite brand name
    And it displays the tagline "Your daily fishing intelligence"
    And it shows a loading indicator

  Scenario: Splash hides when location resolves
    Given the splash screen is visible
    When ActiveLocationService.coords() becomes non-null
    Then the splash begins its exit animation
    And is removed from the DOM after ~400ms

  Scenario: Splash hides on location error
    Given the splash screen is visible
    When ActiveLocationService.hasError() becomes true
    Then the splash begins its exit animation

  Scenario: Safety timeout hides splash
    Given the splash screen is visible
    When 5 seconds pass with no location resolution
    Then the splash hides automatically

  Scenario: Reduced motion respected
    Given the user has prefers-reduced-motion: reduce set
    When the splash exits
    Then no CSS animation plays (instant transition)

  Scenario: Accessibility
    Given the splash is visible
    Then it has role="status" and aria-live="polite"
    And it has aria-label="Loading MoonBite"
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Unit test coverage | ≥ 85% |
| Splash display time | ≤ 5 seconds max (safety timeout) |
| Animation performance | No jank; GPU composited via `opacity` + `transform` |
| Accessibility | WCAG AA — screen reader announces load state |

---

## Implementation Notes

- The `isGone` signal uses `setTimeout(400)` after `isHiding` is set, matching the CSS animation duration.
- The `AppComponent` effect runs synchronously in the Angular signal graph — no `async/await` needed.
- The splash uses `position: fixed` so it works regardless of scroll position or router state.
- No route change is needed; splash is purely overlaid on the app shell.

---

## Out of Scope

| Item | Future |
|------|--------|
| Native app icon / PWA manifest icon | Feature 22 (PWA) |
| Animated SVG logo | Future branding iteration |
| Per-launch "tip of the day" on splash | Feature 21 (Analytics) |
