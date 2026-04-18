# Feature 17 — Share Score / Daily Report

**Status:** Complete  
**Milestone:** 3 — Engagement & Persistence

---

## Overview

Enable anglers to share today's fishing score with friends via social platforms, messaging apps, or text-to-email. Share content includes the score (0–100), location name, moon phase name, best peak time, and a direct link to the app. Implemented via the Web Share API (primary) with clipboard fallback for desktop browsers.

This feature democratizes word-of-mouth growth: anglers naturally brag about good fishing days, turning satisfied users into acquisition channels.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | To share my fishing score to Twitter/Facebook with a pre-filled caption | I can show friends how good today's conditions are |
| US-2 | Angler | To share via WhatsApp or SMS | I can text my fishing buddies without opening their apps manually |
| US-3 | Angler | To copy a shareable link to clipboard on desktop | I can paste it into emails or messaging platforms |
| US-4 | Angler | The shared message to include location, moon phase, and best time | The recipient understands the full fishing forecast context |
| US-5 | Angler | Share buttons visible and prominent on the home screen | I can share after checking today's score with minimal taps |
| US-6 | Angler | To see a preview of what will be shared | I trust the message before sending |
| US-7 | Developer | A clean `ShareService` and `ShareComponent` following MoonBite patterns | I can test and maintain the feature easily |

---

## UX Notes

### Share Flow

**Mobile (Web Share API):**  
1. Tap "Share" button on home screen
2. Native share sheet appears (list of apps: Twitter, Facebook, WhatsApp, Messages, etc.)
3. User selects destination app
4. Pre-filled caption + link sent to that app
5. User optionally edits and sends

**Desktop / Fallback (Clipboard):**  
1. Tap "Share" button
2. Modal appears showing the shareable message and link
3. Tap "Copy to Clipboard" button
4. Toast confirms "Copied!"
5. User manually pastes into email, Slack, etc.

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Share mechanism | Web Share API + clipboard fallback | Native share on mobile is familiar and discoverable; fallback doesn't require external libraries |
| Destination apps | Let OS choose (native share sheet) | No hard-coded list; works with all installed apps; future-proof |
| Share content | Score + location + moon phase + peak time + URL | Provides enough context for someone seeing it cold; not too verbose |
| URL format | App link with optional deep-link params (e.g., `/home?lat=X&lng=Y`) | Recipient can install/open app; optional: pre-populate their location if shared |
| Link shortening | Not included (MVP) | Deep links are short enough; share dialogs truncate long URLs automatically |
| Button placement | Prominent card on home screen or header | Tap flow is obvious; not buried in menus |
| Custom caption | Not editable pre-share (initial MVP) | Simplifies UX; future feature (Feature 22 or beyond) |

### Accessibility

- Share button has `aria-label="Share today's score"` and ≥44×44px touch target
- Modal (desktop fallback) is keyboard-navigable with proper `<label>` and role attributes
- Copied toast is announced via `aria-live="polite"`

---

## UI Spec

### Share Button (Home Screen)

Placed in the fishing score card header or as a floating action near the score:

```
┌──────────────────────────────────────┐
│  🎣 Today's Fishing Score     [↗]    │
│                                      │
│         78 / 100                     │
│         Good fishing!                │
│                                      │
│  [Share ↗]                           │
└──────────────────────────────────────┘
```

**States:**
- **Default:** Blue "Share" button with icon (or "↗")
- **Hover/Active:** Slight opacity change
- **Disabled:** Grayed out if location/score unavailable (rare)

### Share Content Template

The message shared across platforms:

```
🎣 MoonBite says today is a 78 — good fishing at Lake Tahoe! 
Moon: Waxing Gibbous (90% illuminated)
Best time: 7:45 AM — 9:15 AM
Check it out: https://moonbite.app [with optional deep link params]
```

**Variants by platform** (handled by native share sheet):
- **Twitter:** Full message, auto-includes link
- **Facebook:** Full message
- **WhatsApp/Messages:** Full message
- **Email:** Same; user manually adds body/subject
- **Slack:** Full message (if shared to workspace)

### Desktop Fallback Modal

```
┌─────────────────────────────────────┐
│  Share Today's Score                │
├─────────────────────────────────────┤
│                                     │
│  🎣 MoonBite says today is a 78 —   │
│  good fishing at Lake Tahoe!        │
│                                     │
│  Moon: Waxing Gibbous (90%)         │
│  Best time: 7:45 AM — 9:15 AM      │
│                                     │
│  https://moonbite.app/home?...      │
│                                     │
│  [Copy to Clipboard]  [Close]       │
│                                     │
│  (Toast: "Copied! ✓")               │
└─────────────────────────────────────┘
```

### Design Tokens

| Element | Token |
|---------|-------|
| Button background | `$color-accent` or `$color-primary` |
| Button text | White |
| Modal background | `$color-surface` |
| Modal border | `$color-border` |
| Toast background | `$color-success-dark` |
| Toast text | White |

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/sharing/share.service.ts` | Generate share payload; detect platform capability |
| `src/app/sharing/share.service.spec.ts` | Unit tests |
| `src/app/sharing/share-button.component.ts` | Clickable button + trigger Web Share or modal |
| `src/app/sharing/share-button.component.html` | Template with button + modal |
| `src/app/sharing/share-button.component.scss` | Styles for button and modal |
| `src/app/sharing/share-button.component.spec.ts` | Component tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/home/home.component.html` | Add `<app-share-button>` within the score card |
| `src/app/home/home.component.ts` | Pass score/location/moon/solunar data to `ShareButtonComponent` as inputs |

### Data Models

```typescript
/** Payload for Web Share API. */
interface SharePayload {
  title: string;           // "MoonBite Daily Report"
  text: string;            // Full shareable message
  url: string;             // Deep link with optional params
}

/** Context passed to share button. */
interface ShareContext {
  score: number;           // 0–100
  scoreDescription: string; // "Good fishing"
  locationName: string;    // "Lake Tahoe" or coordinates if no name
  moonPhaseName: string;   // "Waxing Gibbous"
  moonIllumination: number; // 0–100 (%)
  bestPeakTime: string;    // "7:45 AM — 9:15 AM" or null
  latitude: number;
  longitude: number;
}
```

### `ShareService` API

```typescript
@Injectable({ providedIn: 'root' })
export class ShareService {
  /**
   * Generate a shareable message and URL from fishing data.
   * @param context ShareContext with score, location, moon, peak time
   * @returns SharePayload ready for Web Share API or clipboard
   */
  generatePayload(context: ShareContext): SharePayload;

  /**
   * Check if Web Share API is available in browser.
   * @returns true if navigator.share is supported
   */
  canUseWebShare(): boolean;

  /**
   * Trigger native Web Share dialog.
   * Rejects if Web Share API unavailable or user cancels.
   * @param payload SharePayload from generatePayload()
   * @returns Promise<void>
   */
  shareViaWebShare(payload: SharePayload): Promise<void>;

  /**
   * Copy payload text + URL to clipboard.
   * @param payload SharePayload from generatePayload()
   * @returns Promise<void>; rejects if Clipboard API unavailable
   */
  copyToClipboard(payload: SharePayload): Promise<void>;
}
```

### `ShareButtonComponent` API

```typescript
@Component({
  selector: 'app-share-button',
  standalone: true,
  template: `...`,
  styles: [`...`],
})
export class ShareButtonComponent {
  // Inputs
  @Input({ required: true }) context: ShareContext;

  // Async handler
  async onShare(): Promise<void> {
    // If Web Share API available: call ShareService.shareViaWebShare()
    // Else: open desktop modal, call ShareService.copyToClipboard() on button tap
  }
}
```

### URL Deep Link Format

```
https://moonbite.app/home?lat=39.0968&lng=-120.0324&savedLocationId=abc123
```

- `lat` / `lng`: Optional; if present, pre-populate the map/location (Feature 18 scope)
- `savedLocationId`: Optional; if present, pre-activate that saved location (Feature 13)
- Falls back to default geolocation if params absent

---

## Acceptance Criteria

```gherkin
Feature: Share Score / Daily Report

  Scenario: Web Share API available — share button taps OS sheet
    Given the user is on the home screen
    And the Web Share API is supported by the browser
    When the user taps "Share"
    Then the native share sheet appears with available apps
    And the pre-filled message includes score, location, moon phase, peak time
    When the user selects "Twitter"
    Then Twitter app/web opens with the message and URL pre-filled
    And the user can edit and send

  Scenario: Web Share API unavailable — fallback to clipboard modal
    Given the user is on a desktop browser without Web Share support
    When the user taps "Share"
    Then a modal appears showing the shareable message
    And the message includes score, location, moon phase, peak time, and URL
    When the user taps "Copy to Clipboard"
    Then a toast shows "Copied! ✓"
    And the message text is in clipboard

  Scenario: Share content accuracy
    Given the fishing score is 73
    And the location is "Lake Tahoe"
    And the moon phase is "Waxing Gibbous" at 87% illumination
    And the best peak time is "7:45 AM — 9:15 AM"
    When the user generates a share payload
    Then the message reads: "🎣 MoonBite says today is a 73 — good fishing at Lake Tahoe! Moon: Waxing Gibbous (87% illuminated) Best time: 7:45 AM — 9:15 AM"
    And the URL is: https://moonbite.app/home?lat=39.0968&lng=-120.0324

  Scenario: Score description mapping
    Given the fishing score is 20 (poor)
    Then the description is "poor fishing"
    Given the score is 50 (fair)
    Then the description is "fair fishing"
    Given the score is 75 (good)
    Then the description is "good fishing"
    Given the score is 90 (excellent)
    Then the description is "excellent fishing"

  Scenario: Share with missing peak time
    Given solunar data is unavailable (edge case)
    When the user shares
    Then the message omits the "Best time" line
    And the rest of the message is complete

  Scenario: Share from a saved location
    Given the user has activated a saved location "Home Waters"
    When the user shares
    Then the message shows "Home Waters" (not just coordinates)
    And the URL includes the saved location's latitude/longitude

  Scenario: Modal keyboard navigation (desktop)
    Given the desktop fallback modal is open
    When the user presses Tab
    Then focus moves through "Copy to Clipboard" → "Close"
    When the user presses Enter on "Copy to Clipboard"
    Then the text is copied
    When the user presses Escape
    Then the modal closes

  Scenario: Toast notification accessibility
    Given the user copies to clipboard
    Then a toast appears with text "Copied! ✓"
    And the toast has aria-live="polite"
    And screen readers announce it

  Scenario: Share button disabled when score unavailable
    Given geolocation permission is not granted
    And the fishing score cannot be calculated
    When the user views the home screen
    Then the "Share" button is disabled
    And a tooltip shows "Enable location to share"

  Scenario: Deep link pre-populates location
    Given the user receives a shared link: https://moonbite.app/home?lat=39&lng=-120
    When the user opens the link on mobile
    Then the app loads and uses coordinates (39, -120) instead of GPS
    And the fishing score is calculated for that location
```

---

## Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Share completion rate | ≥ 70% of users who tap Share complete the action | Indicates the flow is intuitive |
| Web Share API fallback success | 100% — no white screens or errors | Fallback must be seamless |
| Shared link clicks | Track via deep-link params; target 5–10% click-through | Validates if sharing drives new user acquisition |
| Unit test coverage | ≥ 85% (statements, branches, functions, lines) | Standard coverage bar |
| WCAG 2.1 AA compliance | All buttons, modals, toasts accessible | Inclusive design |
| Share content accuracy | Manual validation: all fields appear in shared message | Feature must be trustworthy |

---

## Implementation Notes

### Web Share API Quirks

- **`navigator.share()`** returns a Promise; rejection does NOT mean the share failed (user may have cancelled).
- **Safari / iOS:** Web Share API supported since iOS 13.
- **Android Chrome:** Web Share API fully supported.
- **Desktop Firefox/Safari:** No Web Share API; fallback to clipboard.
- **Edge:** Supported on Windows and Mac.

### Clipboard API

- Modern browsers support **Async Clipboard API** (`navigator.clipboard.writeText()`).
- Fallback to old Document.execCommand(`copy`) is **not** required for modern PWAs.
- Clipboard access requires **HTTPS** (or `localhost` in dev).

### Score Description Mapping

```typescript
function getScoreDescription(score: number): string {
  if (score < 30) return 'poor fishing';
  if (score < 50) return 'fair fishing';
  if (score < 70) return 'good fishing';
  return 'excellent fishing';
}
```

### No Image Generation (MVP)

This feature does NOT include `html2canvas` or server-side image rendering. Reasons:
- Image generation is complex and error-prone (especially on mobile).
- Text + URL is sufficient for MVP sharing.
- Future Feature 22 (Premium) can add "Share as Image" with branded card design.

### localStorage / Analytics

- Do NOT collect analytics on share events (Feature 21 — Analytics is separate).
- Do NOT store share history (Feature 20 — Catch Logging handles journals).
- Share button is stateless; no side effects.

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 01 | `GeolocationService` — location data for share payload |
| Feature 02 | `MoonPhaseService` — moon phase name + illumination |
| Feature 03 | `SolunarService` — best peak time data |
| Feature 05 | `FishingScoreService` — fishing score value |
| Feature 13 | `SavedLocationsService` — saved location names |
| Feature 06 | Home screen context; button placement |

---

## Out of Scope (MVP)

| Item | Future Feature |
|------|---------------|
| Share as PNG/branded image | Feature 22 (Premium) |
| Custom caption editing | Feature 22+ |
| Share history / re-share | Feature 20 (Catch Logging) |
| Analytics on share events | Feature 21 (Analytics) |
| QR code on shared image | Feature 22+ |
| Link shortening (bit.ly, etc.) | Feature 22+ |
| Schedule share for later | Feature 22+ |

---

## Future Enhancements

- **Share to Strava:** Anglers on Strava could log a fishing trip with MoonBite score
- **Share to Discord:** Direct integration with fishing Discord servers
- **Webhook URL:** Advanced users can POST share data to custom webhooks
- **Share with comparison:** "Today's score is 73, but yesterday was 65—getting better!"
