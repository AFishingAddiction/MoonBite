# Feature 24 — Geolocation Permission Recovery

## Problem

On Android/Chrome 114+, a previously denied geolocation permission causes
`getCurrentPosition()` to return `PERMISSION_DENIED` instantly with no browser
dialog. The user has no recovery path.

---

## New Files

### `src/app/geolocation/platform-detector.ts`

Pure function, no Angular dependencies.

```
detectPlatform(): 'android' | 'ios' | 'desktop'
```

- Inspect `navigator.userAgent` (case-insensitive).
- Return `'android'` if `/android/i` matches.
- Return `'ios'` if `/ipad|iphone|ipod/i` matches.
- Return `'desktop'` otherwise.

---

### `src/app/geolocation/recovery-instructions.ts`

Pure function, no Angular dependencies.

```
getRecoveryInstructions(platform: 'android' | 'ios' | 'desktop'): {
  title: string;
  steps: string[];
}
```

Return platform-specific step-by-step instructions for re-enabling location in
browser settings. Three static objects, selected by `platform`. Steps must be
plain strings (no HTML).

Example shape:
- `android`: "Enable Location in Chrome" + 3–4 steps via Chrome site settings.
- `ios`: "Enable Location in Safari" + 3–4 steps via iOS Settings > Safari.
- `desktop`: "Enable Location in Browser" + 2–3 steps via address-bar lock icon.

---

## Modified Files

### `src/app/geolocation/geolocation.service.ts`

#### Interface change

```typescript
export interface GeolocationState {
  status:
    | 'idle'
    | 'checking-permission'
    | 'requesting'
    | 'granted'
    | 'denied'
    | 'denied-previously'
    | 'unavailable'
    | 'error';
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  permissionState?: PermissionState;   // raw value from Permissions API
  platform?: 'android' | 'ios' | 'desktop';
}
```

#### `requestLocation()` — change to `async`

1. If `navigator.geolocation` absent → set `'unavailable'`, return.
2. Set status `'checking-permission'`, store `platform: detectPlatform()`.
3. Try `navigator.permissions.query({ name: 'geolocation' })`:
   - If Permissions API throws/unavailable → skip to step 4 directly.
   - Store raw `permissionState` in state.
   - If result is `'denied'` → set status `'denied-previously'`, **do not** call
     `getCurrentPosition`. Return.
   - If result is `'prompt'` or `'granted'` → fall through to step 4.
4. Set status `'requesting'`, call `getCurrentPosition` with existing options
   (`enableHighAccuracy: false`, `timeout: 10000`, `maximumAge: 300000`).
   - Success → set `'granted'`.
   - Error code 1 → set `'denied'`.
   - Other error → set `'error'`.

#### New method `retryLocation(): void`

Delegates to `requestLocation()`. Exists as a semantic alias so the template can
distinguish a user-initiated retry from the initial call. Internal logic is
identical.

#### `reset()` — no change required.

---

### `src/app/location-display/location-display.component.ts`

- Add import of `getRecoveryInstructions` from `../geolocation/recovery-instructions`.
- Add import of `ReturnType` alias: `RecoveryInstructions` for the return type.
- Add protected computed property:

```typescript
protected readonly recoveryInstructions = computed(() => {
  const { status, platform } = this.geo.state();
  if (status === 'denied-previously' && platform) {
    return getRecoveryInstructions(platform);
  }
  return null;
});
```

- Change `retry()` to call `this.geo.retryLocation()` instead of
  `this.geo.requestLocation()`.

---

### `src/app/location-display/location-display.component.html`

Inside the `@switch (geo.state().status)` block, add two new cases **before**
`'denied'`:

#### `'checking-permission'`

Render the same loading spinner already used for `'requesting'`, with
`aria-live="polite"` and text "Checking location permission…".
Use `data-testid="permission-checking"`.

#### `'denied-previously'`

Render inside `role="alert"` with `data-testid="location-denied-previously"`.

Structure:
1. Heading: recovery instruction `title` from `recoveryInstructions()`.
2. Ordered list `<ol>` of `steps` from `recoveryInstructions()`, rendered via
   `@for (step of recoveryInstructions()!.steps; track step)`.
3. "Try Again" button → `(click)="retry()"`, `data-testid="retry-btn"`.
4. `routerLink="/locations"` anchor → "Use Different Location",
   `data-testid="use-different-location-link"`.

#### `'denied'` (existing — update only)

Replace generic message. Keep "Retry" button calling `retry()`. Add
`routerLink="/locations"` "Use Different Location" link alongside it (same
pattern as `denied-previously` but without the step list).

---

## State Transition Diagram

```
idle
 └─► checking-permission
       ├─► denied-previously   (Permissions API returned 'denied')
       │     └─► [user follows steps, clicks Try Again]
       │           └─► checking-permission (loop)
       └─► requesting
             ├─► granted
             ├─► denied        (user clicked Deny in dialog)
             └─► error
```

---

## Testing Notes

- Mock `navigator.permissions.query` returning each `PermissionState` value.
- Verify `'denied-previously'` path never calls `getCurrentPosition`.
- Verify fallback path (Permissions API throws) still calls `getCurrentPosition`.
- Verify `detectPlatform()` with spoofed `navigator.userAgent` strings.
- Verify `getRecoveryInstructions()` returns non-empty `steps[]` for all three platforms.
- Component: assert `data-testid="location-denied-previously"` renders correct
  steps for each platform; assert "Try Again" calls `retryLocation()`.
