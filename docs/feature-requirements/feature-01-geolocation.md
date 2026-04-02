# Feature 01 — Geolocation Permission & Display

**Status:** Complete

## Overview

MoonBite needs the user's current location to fetch solunar, moon phase, and weather data. This feature handles requesting browser geolocation permission, managing all permission states, and displaying the resolved location to the user.

## User Stories

> As a first-time user, I want to be prompted to share my location so that MoonBite can calculate a fishing score for my area.

> As a returning user, I want my location to be loaded automatically if I previously granted permission so that I don't have to re-confirm each visit.

> As a user who denied location access, I want to see a clear explanation and an option to retry so that I can still use the app.

## UI Spec

### States

| State | Display |
|---|---|
| `idle` | "Use My Location" button with location-pin icon |
| `requesting` | Spinner with "Getting your location…" text |
| `granted` | Location coordinates (lat/lng) + "Change Location" link |
| `denied` | Error message + "Retry" button + instructions to enable in browser |
| `unavailable` | Error message (geolocation not supported) |
| `error` | Generic error + "Try Again" button |

### Component Layout

```
┌─────────────────────────────────────┐
│  📍  Your Location                  │
│                                     │
│  [Use My Location]   (idle)         │
│  ⟳ Getting your location… (loading) │
│  Lat: 40.7128° N, Lon: 74.0060° W  │
│  ⚠ Location access denied. (error) │
└─────────────────────────────────────┘
```

### Interaction Patterns

- Button triggers `navigator.geolocation.getCurrentPosition()`
- Loading spinner replaces button during request
- On success: show coordinates; persist `granted` state in sessionStorage
- On deny: show inline error with retry affordance
- All states keyboard-navigable; focus managed on state transition

## Architecture Notes

### New Files

- `src/app/geolocation/geolocation.service.ts` — wraps browser Geolocation API, exposes signals
- `src/app/geolocation/geolocation.service.spec.ts` — unit tests
- `src/app/location-display/location-display.component.ts` — standalone component
- `src/app/location-display/location-display.component.html`
- `src/app/location-display/location-display.component.scss`
- `src/app/location-display/location-display.component.spec.ts`

### GeolocationService API

```typescript
interface GeolocationState {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
}

class GeolocationService {
  readonly state: Signal<GeolocationState>;
  requestLocation(): void;
  reset(): void;
}
```

### AppComponent Changes

- Import and render `<app-location-display>` in `app.component.html`

## Acceptance Criteria

```gherkin
Feature: Geolocation Permission & Display

  Scenario: User grants location access
    Given the user is on the MoonBite home page
    When they click "Use My Location"
    Then the app shows a loading spinner
    And when permission is granted
    Then the location coordinates are displayed

  Scenario: User denies location access
    Given the user is on the MoonBite home page
    When they click "Use My Location"
    And the browser denies the geolocation request
    Then an error message is shown explaining location was denied
    And a "Retry" button is visible

  Scenario: Geolocation not supported
    Given the user's browser does not support geolocation
    When the LocationDisplay component renders
    Then a message "Location services are not available in this browser" is shown

  Scenario: Keyboard navigation
    Given the user is on the home page
    When they navigate to the "Use My Location" button via keyboard
    Then the button receives visible focus styling
    And pressing Enter triggers the geolocation request
```

## Implementation Notes

- `GeolocationService` uses Angular `signal()` / `asReadonly()` to expose state; no Observables needed.
- `LocationDisplayComponent` uses `ChangeDetectionStrategy.OnPush` and `@switch` control flow.
- SCSS design tokens live in `src/styles/_variables.scss` and `src/styles/_mixins.scss`; `stylePreprocessorOptions.includePaths: ["src/styles"]` is set in `angular.json` for both build and test targets so component SCSS files can `@use 'variables' as *` without relative paths.
- `@esbuild/linux-x64` is pinned as a `devDependency` at `0.27.3` (matching the `esbuild` package version) to ensure the correct native binary is present in Linux/WSL2 environments.
