# Feature 24 — Geolocation Permission Recovery & Enhanced Error Messaging

**Status:** Complete

**Related:** Enhancement to Feature 01 (Geolocation Permission & Display)

## Problem Statement

On Android/Chrome 114+ and some modern browsers, when a user denies geolocation permission once, the browser caches that denial and **never shows the permission prompt again**—subsequent requests fail instantly with error code 1 (PERMISSION_DENIED). The current MoonBite app shows a generic "Location access was denied. Please enable location services in your browser settings" message that doesn't:

1. Distinguish between "never asked" vs. "previously denied" vs. "system location is off"
2. Provide platform-specific recovery instructions (Android Chrome, iOS Safari, desktop Chrome)
3. Offer actionable recovery steps beyond generic browser settings guidance
4. Detect permission state **before** making the request, avoiding instant failures
5. Provide a meaningful "Try Again" flow that works when permissions are in different states

This creates a poor user experience where users believe they've followed instructions but still can't grant location access, not realizing they must manually reset the site's location permission in Chrome Settings.

## Business Objectives

- **Reduce support inquiries** about geolocation failures
- **Improve first-run experience** by pre-checking permission state and prompting strategically
- **Increase feature adoption** (fishing score relies on location data)
- **Build user trust** with transparent, helpful error messages
- **Support accessibility** with platform-aware guidance

## User Stories

> As a user who accidentally denied location access, I want the app to detect the previous denial and guide me to reset the permission so that I can try again without confusion.

> As a user on Android Chrome, I want platform-specific instructions (e.g., "Go to Settings > Apps > Chrome > Permissions > Location > Allow") so I don't have to guess how to fix my browser.

> As a user on iOS, I want to know to enable location in Settings > Privacy > Location Services so that I understand why the browser can't access my location.

> As a developer integrating this service, I want graceful fallback behavior if the Permissions API is unavailable so that the app works on older browsers too.

> As a user who wants to change their location, I want a "Choose Different Location" option so that I don't have to reset my browser permissions.

## Feature Scope

### In Scope

- Pre-check permission state using `navigator.permissions.query({ name: 'geolocation' })`
- Detect permission states: `'prompt'` (never asked), `'granted'` (auto-use), `'denied'` (explicit denial)
- Platform detection (Android, iOS, desktop) for targeted guidance
- Enhanced error messages with actionable recovery steps
- "Try Again" button that works intelligently based on permission state
- "Use Different Location" option (search/manual entry) as fallback
- Graceful degradation if Permissions API unavailable
- Updated component UI to surface recovery affordances
- Unit tests covering all permission states and platform scenarios
- E2E tests validating user flows (prompt, denial, recovery, retry)

### Out of Scope

- Completely replace browser geolocation with IP-based fallback
- Store location history or caching beyond 5-minute max-age
- Integration with third-party location services
- Custom location picker map UI (use browser's default or link to existing location library)

## Acceptance Criteria

```gherkin
Feature: Geolocation Permission Recovery & Enhanced Error Messaging

  Background:
    Given the app is loaded in a modern browser that supports the Permissions API

  Scenario: Permission state is 'prompt' (never asked)
    When the user clicks "Use My Location"
    Then the app calls navigator.permissions.query()
    And detects state 'prompt'
    And shows the native browser geolocation prompt
    And the request completes normally

  Scenario: Permission state is 'granted' (already allowed)
    Given the user previously granted location access
    When the user clicks "Use My Location"
    Then the app calls navigator.permissions.query()
    And detects state 'granted'
    And skips the prompt (already has permission)
    And directly calls getCurrentPosition()
    And displays the location immediately

  Scenario: Permission state is 'denied' (previously denied)
    Given the user previously denied location access
    When the user clicks "Use My Location"
    Then the app calls navigator.permissions.query()
    And detects state 'denied'
    And does NOT call getCurrentPosition() (it would fail instantly)
    And shows an error message: "Location permission was previously denied"
    And displays platform-specific recovery instructions
    And shows a "Try Again" button
    And shows a "Use Different Location" link

  Scenario: Recovery instructions are platform-specific (Android)
    Given the permission state is 'denied'
    And the user is on Android (detected via user-agent)
    When the error message displays
    Then it includes instructions: "Go to Settings > Apps > Chrome > Permissions > Location and select Allow"
    And the instructions match Android's actual Chrome settings flow

  Scenario: Recovery instructions are platform-specific (iOS)
    Given the permission state is 'denied'
    And the user is on iOS (detected via user-agent)
    When the error message displays
    Then it includes instructions: "Go to Settings > Privacy > Location Services, enable it, then allow MoonBite access"
    And the instructions match iOS's actual Safari/Chrome settings flow

  Scenario: Recovery instructions are platform-specific (Desktop Chrome)
    Given the permission state is 'denied'
    And the user is on desktop (Windows/Mac/Linux)
    When the error message displays
    Then it includes instructions: "Click the lock icon in the address bar > Location > Allow"
    And the instructions match desktop Chrome's settings flow

  Scenario: User taps 'Try Again' after resetting permission
    Given the permission state is 'denied'
    And the error message is displayed with "Try Again" button
    When the user manually resets the location permission in browser settings
    And clicks "Try Again"
    Then the app re-checks permission state via navigator.permissions.query()
    And detects the new state 'granted'
    And calls getCurrentPosition()
    And shows the location successfully

  Scenario: Permissions API is unavailable (older browser)
    Given the user's browser does not support navigator.permissions
    When the user clicks "Use My Location"
    Then the app falls back to calling getCurrentPosition() directly
    And maintains the current error handling (code 1 = denied)
    And shows a generic error message (no platform-specific guidance)

  Scenario: getCurrentPosition succeeds despite permission state check
    Given the permission state appears 'denied' via navigator.permissions.query()
    But getCurrentPosition() succeeds anyway (timing issue or browser inconsistency)
    When the success callback fires
    Then the app displays the location
    And updates internal state to reflect the success
    And logs a warning for debugging the state discrepancy

  Scenario: getCurrentPosition fails with error code 2 or 3 (timeout/network)
    Given the user granted location access
    When getCurrentPosition() fails with code 2 or 3
    Then an error message displays: "Unable to get your location right now. Please try again."
    And a "Try Again" button is shown
    And no platform-specific instructions appear (user already granted permission)

  Scenario: Use Different Location link navigates
    Given the permission state is 'denied' or the user wants to change location
    When the user clicks "Use Different Location"
    Then the app navigates to Feature 18 (Location Search & Library)
    Or displays an inline location picker
    And sets the location without requiring geolocation permission

  Scenario: Keyboard navigation on "Try Again" and "Use Different Location"
    Given the error message is displayed
    When the user navigates via Tab key
    Then "Try Again" button receives focus
    And "Use Different Location" link receives focus
    And pressing Enter activates the focused element

  Scenario: Accessibility: Screen reader announces permission state
    Given the permission state is 'denied'
    When a screen reader user navigates to the error message
    Then the message is announced: "Location permission was previously denied. [Platform-specific instructions]. Choose Use Different Location to select a location manually."
    And all interactive elements are labeled appropriately
```

## UI/UX Specification

### New Error States

#### Permission Denied (Previously Denied)

```
┌────────────────────────────────────────────┐
│  📍  Your Location                         │
│                                            │
│  ⚠ Location permission was denied         │
│                                            │
│  To enable location for MoonBite:          │
│  • Tap the lock icon in the address bar    │
│  • Select "Location" > "Allow"             │
│                                            │
│  [Try Again]        [Use Different Location]
└────────────────────────────────────────────┘
```

#### Android-Specific Guidance

```
⚠ Location permission was denied

To enable location for MoonBite on Android:
1. Open Chrome Settings
2. Tap Apps > Chrome > Permissions
3. Select Location > Allow

[Try Again]        [Use Different Location]
```

#### iOS-Specific Guidance

```
⚠ Location permission was denied

To enable location for MoonBite on iOS:
1. Open Settings
2. Tap Privacy > Location Services
3. Enable Location Services
4. Scroll to Chrome (or Safari)
5. Select "While Using the App"

[Try Again]        [Use Different Location]
```

### Component State Flow

```
Idle
  ↓ [User clicks "Use My Location"]
  ↓
Checking Permission State (new)
  ├→ Permissions API unavailable? → Requesting (falls back to old flow)
  ├→ Permission state 'prompt'? → Requesting
  ├→ Permission state 'granted'? → Requesting
  └→ Permission state 'denied'? → Permission Denied Error (new state)
     ↓
Permission Denied Error (new)
  ├→ [Try Again] → re-check permission state
  └→ [Use Different Location] → navigate to location search
```

### Updated GeolocationState Interface

```typescript
interface GeolocationState {
  status: 'idle' 
    | 'checking-permission'  // new: pre-checking permission state
    | 'requesting' 
    | 'granted' 
    | 'denied' 
    | 'denied-previously'     // new: distinguish cached denial
    | 'unavailable' 
    | 'error';
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  permissionState?: 'prompt' | 'granted' | 'denied';  // new
  errorCode?: number;         // new: specific error code
  platform?: 'android' | 'ios' | 'desktop';  // new: for targeted guidance
}
```

## Architecture Notes

### GeolocationService Enhancements

**New method: `checkPermissionState()`**
- Calls `navigator.permissions.query({ name: 'geolocation' })`
- Returns `{ state: 'prompt' | 'granted' | 'denied' }` or `null` if API unavailable
- Does NOT trigger browser prompts
- Sets `state.permissionState` signal
- Caches result briefly to avoid excessive queries

**Modified method: `requestLocation()`**
1. First call `checkPermissionState()`
2. If state is `'denied'`, set status to `'denied-previously'` (do not call `getCurrentPosition`)
3. If state is `'prompt'` or `'granted'` (or API unavailable), call `getCurrentPosition` as before
4. Detect platform (Android/iOS/desktop) and store in state
5. Set appropriate error message and recovery instructions based on platform + status

**New method: `retryLocation()`**
- Re-checks permission state
- If now `'granted'`, calls `getCurrentPosition()`
- If still `'denied'`, updates error message

**New method: `getPlatform()`**
- Analyzes `navigator.userAgent`
- Returns `'android' | 'ios' | 'desktop'`

**New method: `getRecoveryInstructions(platform)`**
- Returns platform-specific HTML guidance
- Includes step-by-step instructions
- Formatted for inline display

### LocationDisplayComponent Updates

- Import `getRecoveryInstructions()` helper
- Display platform-specific guidance in denied state
- Show "Try Again" button (calls `geolocationService.retryLocation()`)
- Show "Use Different Location" link (routes to Feature 18 or location picker)
- Update ARIA labels for screen reader announcements
- Handle `'denied-previously'` and `'checking-permission'` states

### New Files

- `src/app/geolocation/geolocation.service.ts` — (modified) add permission checking logic
- `src/app/geolocation/geolocation.service.spec.ts` — (modified) add tests for permission states
- `src/app/geolocation/platform-detector.ts` — (new utility) platform detection helper
- `src/app/geolocation/recovery-instructions.ts` — (new utility) platform-specific guidance

### Shared Utilities

```typescript
// platform-detector.ts
export function detectPlatform(): 'android' | 'ios' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'desktop';
}

// recovery-instructions.ts
export function getRecoveryInstructions(platform: string): {
  title: string;
  steps: string[];
  html: string;
} {
  // Return platform-specific instructions
}
```

### Testing Strategy

**Unit Tests (GeolocationService)**
- Permission state detection (prompt, granted, denied)
- Platform detection (Android, iOS, desktop)
- Error message selection based on state + platform
- Graceful fallback when Permissions API unavailable
- Retry logic re-checking permission state
- Coverage: 85%+

**E2E Tests (Playwright)**
- User grants permission on first prompt
- User denies permission, sees error, navigates recovery
- User resets permission, taps "Try Again", succeeds
- Platform-specific guidance displays correctly
- "Use Different Location" navigates to location search
- Keyboard navigation on error buttons

## Success Metrics

- **Error rate reduction:** Geolocation "denied" errors drop 40%+ (tracked via app analytics)
- **User recovery:** 60%+ of users who see "Try Again" successfully enable location
- **Support tickets:** Geolocation-related support inquiries drop 50%+
- **Feature adoption:** Fishing score calculation adoption increases 15%+
- **User satisfaction:** NPS for geolocation flow improves by 10+ points
- **Accessibility:** 100% keyboard-navigable, screen-reader tested
- **Compatibility:** Works on Chrome 100+, Safari 15+, Edge 100+; graceful fallback on older browsers

## Dependencies

- Angular 21 (signals, control flow, routing)
- Browser Geolocation API (`navigator.geolocation.getCurrentPosition`)
- Browser Permissions API (`navigator.permissions.query`) — with graceful fallback
- Feature 18 (Location Search & Library) for "Use Different Location" navigation

## Rollout Plan

1. **Phase 1:** Implement in dev/staging; E2E test all permission flows
2. **Phase 2:** Beta release to 10% of users; monitor error metrics and support tickets
3. **Phase 3:** Full rollout; announce in release notes highlighting geolocation improvements
4. **Phase 4:** Monitor success metrics; iterate on guidance clarity if needed

## Open Questions / Notes

- Should "Try Again" re-check permission state every time, or offer a link to open Chrome settings directly?
  - **Decision:** Re-check first; if still denied, offer settings shortcut
- Should we remember the user's platform-specific instructions to avoid re-detecting?
  - **Decision:** No; re-detect each session (browser/device may change)
- How long should we cache the permission state check result?
  - **Decision:** 30 seconds (user may change settings in another tab)
- Should we offer "Use Different Location" only on denied, or also on success (to change location)?
  - **Decision:** Show on both denied (necessary) and success (convenience), as a "Change Location" link
