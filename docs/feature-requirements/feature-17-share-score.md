# Feature 17 — Share Score / Daily Report

## Summary

Enable anglers to share today's fishing score via Web Share API (mobile) with a clipboard-copy fallback modal (desktop). Pure client-side; no backend.

---

## 1. New Files

| Path | Responsibility |
|---|---|
| `src/app/share/share.model.ts` | `SharePayload` and `ShareResult` interfaces |
| `src/app/share/share.service.ts` | Builds share text; dispatches Web Share API or clipboard copy |
| `src/app/share/share-button.component.ts` | Smart button — invokes `ShareService`; shows inline feedback |
| `src/app/share/share-button.component.html` | Button + fallback modal markup |
| `src/app/share/share-button.component.scss` | Component styles |
| `src/app/share/share-button.component.spec.ts` | Unit tests for the component |
| `src/app/share/share.service.spec.ts` | Unit tests for the service |

No new route. The button renders inside `HomeComponent` via the existing dashboard layout.

---

## 2. Interfaces / Models

### `src/app/share/share.model.ts`

```typescript
/** All data required to compose the shareable report text. */
export interface SharePayload {
  /** Composite score 0–100. */
  score: number;
  /** ISO date string YYYY-MM-DD (UTC). */
  dateUtc: string;
  /** Human-readable location name, or null when using raw GPS. */
  locationName: string | null;
  /** Decimal latitude — included in share text when locationName is null. */
  latitude: number;
  /** Decimal longitude — included in share text when locationName is null. */
  longitude: number;
  /** Moon phase label, e.g. "Waxing Gibbous". */
  phaseName: string;
  /** Moon phase emoji, e.g. "🌔". */
  phaseEmoji: string;
  /** 0–100 moon contribution. */
  moonScore: number;
  /** 0–100 solunar contribution. */
  solunarScore: number;
  /** 0–100 weather contribution; null when weather unavailable. */
  weatherScore: number | null;
}

/** Outcome of a single share attempt. */
export type ShareResultStatus = 'shared' | 'copied' | 'cancelled' | 'error';

export interface ShareResult {
  status: ShareResultStatus;
  /** Human-readable message suitable for display in a toast or modal. */
  message: string;
}
```

---

## 3. ShareService

### File: `src/app/share/share.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ShareService {
  /**
   * Returns true when the Web Share API is available (typically mobile browsers).
   * Reads `navigator.share` at call-time so it can be overridden in tests.
   */
  canUseWebShare(): boolean;

  /**
   * Builds the plain-text shareable report from a `SharePayload`.
   *
   * Example output:
   *   MoonBite Fishing Report — April 18, 2026
   *   Location: Lake Tahoe
   *   Score: 82/100
   *   Moon: Waxing Gibbous 🌔 (score: 75)
   *   Solunar: 90  |  Weather: 80
   *   https://moonbite.app
   *
   * Pure function — no side effects.
   */
  buildShareText(payload: SharePayload): string;

  /**
   * Attempts Web Share API first; falls back to clipboard write.
   * Never throws — all errors are caught and encoded in `ShareResult`.
   *
   * Resolves with:
   *   - `{ status: 'shared' }` — navigator.share() resolved
   *   - `{ status: 'cancelled' }` — user dismissed native sheet (AbortError)
   *   - `{ status: 'copied' }` — clipboard write succeeded (fallback path)
   *   - `{ status: 'error' }` — both paths failed
   */
  share(payload: SharePayload): Promise<ShareResult>;

  /**
   * Writes `text` to the system clipboard.
   * Exposed separately so the fallback modal "Copy" button can call it directly.
   * Resolves with `{ status: 'copied' }` on success, `{ status: 'error' }` on failure.
   */
  copyToClipboard(text: string): Promise<ShareResult>;
}
```

Implementation notes:
- `share()` calls `navigator.share({ title, text })` when `canUseWebShare()` is true, then falls back to `copyToClipboard()`.
- Catches `AbortError` separately from other `DOMException` types.
- `buildShareText()` formats `dateUtc` using `Intl.DateTimeFormat` in the user's locale (no locale dependency injection needed).
- Inject `DOCUMENT` token (from `@angular/common`) to access `navigator` and `document.execCommand` fallback so tests can override the DOM.

---

## 4. ShareButtonComponent

### File: `src/app/share/share-button.component.ts`

```typescript
@Component({
  selector: 'app-share-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [/* CommonModule not needed — use @if / @for */],
  templateUrl: './share-button.component.html',
  styleUrl: './share-button.component.scss',
})
export class ShareButtonComponent {
  // ── Inputs ──────────────────────────────────────────────────────────────
  /** Full payload assembled by the parent. Required; button is disabled when null. */
  readonly payload = input<SharePayload | null>(null);

  // ── Internal signals ────────────────────────────────────────────────────
  /** True while a share/copy operation is in-flight. */
  protected readonly isPending = signal<boolean>(false);

  /** Set after share completes; drives inline feedback label. */
  protected readonly lastResult = signal<ShareResult | null>(null);

  /** Controls fallback modal visibility (desktop clipboard copy). */
  protected readonly showFallbackModal = signal<boolean>(false);

  /** Text pre-computed for the modal so it renders without recalculation. */
  protected readonly fallbackText = signal<string>('');

  // ── Computed ─────────────────────────────────────────────────────────────
  protected readonly isDisabled = computed(() => this.isPending() || this.payload() === null);

  // ── Dependencies ─────────────────────────────────────────────────────────
  private readonly shareService = inject(ShareService);

  // ── Methods ──────────────────────────────────────────────────────────────
  protected async onShareClick(): Promise<void>;
  protected async onModalCopy(): Promise<void>;
  protected onModalClose(): void;
}
```

#### Template structure outline

```
<button
  [disabled]="isDisabled()"
  [attr.aria-busy]="isPending()"
  (click)="onShareClick()"
  aria-label="Share today's fishing report">
  @if (isPending()) { <!-- spinner icon --> }
  @else { Share }
</button>

@if (lastResult()?.status === 'copied') {
  <span role="status" aria-live="polite">Copied!</span>
}

<!-- Fallback modal (desktop) -->
@if (showFallbackModal()) {
  <div role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
    <h2 id="share-modal-title">Share Fishing Report</h2>
    <textarea [value]="fallbackText()" readonly></textarea>
    <button (click)="onModalCopy()">Copy to clipboard</button>
    <button (click)="onModalClose()">Close</button>
  </div>
}
```

Accessibility requirements:
- Button uses `aria-busy` while pending.
- Result feedback uses `aria-live="polite"`.
- Modal uses `role="dialog"` + `aria-modal="true"`.
- Focus is trapped in modal and returns to trigger button on close.

---

## 5. Integration into HomeComponent

`HomeComponent` remains a thin shell. It assembles `SharePayload` from existing services and passes it down.

### Changes to `home.component.ts`

1. Import `ShareButtonComponent` and `SharePayload`.
2. Inject `ActiveLocationService`, `FishingScoreService`, `MoonPhaseService`, `SolunarService`.
3. Add a `computed<SharePayload | null>` signal named `sharePayload`:

```typescript
protected readonly sharePayload = computed<SharePayload | null>(() => {
  const coords = this.activeLocation.coords();
  if (!coords) return null;

  const today = new Date().toISOString().slice(0, 10);
  const moon = this.moonPhaseService.calculateForDateString(today);
  const solunar = this.solunarService.calculateForDateString(today, coords.latitude, coords.longitude);
  // FishingScore is already computed by FishingScoreDisplayComponent via the same service;
  // HomeComponent reads the cached Observable result via toSignal().
  const fishing = this.fishingScore();   // toSignal(fishingScoreService.getScore(...))
  if (!fishing) return null;

  return {
    score: fishing.score,
    dateUtc: today,
    locationName: coords.name,
    latitude: coords.latitude,
    longitude: coords.longitude,
    phaseName: moon.phaseName,
    phaseEmoji: moon.phaseEmoji,
    moonScore: fishing.breakdown.moonPhaseScore,
    solunarScore: fishing.breakdown.solunarScore,
    weatherScore: fishing.breakdown.weatherAvailable ? fishing.breakdown.weatherScore : null,
  };
});
```

4. Add `ShareButtonComponent` to `imports` array.
5. In template, place `<app-share-button [payload]="sharePayload()" />` below `FishingScoreDisplayComponent`.

No additional route or resolver needed. `HomeComponent` already coordinates all data signals; `ShareButtonComponent` is purely presentational + action-delegating.

---

## 6. Constraints & Decisions

| Decision | Rationale |
|---|---|
| `ShareService` uses `DOCUMENT` token | Allows test-time override of `navigator.share` and `clipboard` |
| Modal is inline in `ShareButtonComponent`, not a routed page | Keeps feature self-contained; matches "no new routes" requirement |
| `SharePayload` assembled in `HomeComponent` not `ShareService` | Keeps service pure/testable; component owns data composition |
| `canUseWebShare()` called at click time, not construction | Avoids SSR issues; accurate on capability-change |
| No external dependency | Web Share API + Clipboard API are standard; no polyfill needed |
