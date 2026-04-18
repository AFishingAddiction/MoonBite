import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { ActiveLocationService } from '../locations/active-location.service';
import { FishingScoreService } from '../scoring/fishing-score.service';
import { MoonPhaseService } from '../moon-phase/moon-phase.service';
import { SolunarService, SolunarPeriod } from '../solunar/solunar.service';
import { ShareService } from './share.service';
import { SharePayload, ShareResult } from './share.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLocalTime(utcString: string): string {
  return new Date(utcString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function buildPeakTimeString(periods: SolunarPeriod[]): string | null {
  const best = periods.find(p => p.type === 'major') ?? null;
  if (!best) return null;
  return `${formatLocalTime(best.startUtc)} – ${formatLocalTime(best.endUtc)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-share-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './share-button.component.html',
  styleUrl: './share-button.component.scss',
})
export class ShareButtonComponent {
  private readonly activeLocationService = inject(ActiveLocationService);
  private readonly fishingScoreService = inject(FishingScoreService);
  private readonly moonPhaseService = inject(MoonPhaseService);
  private readonly solunarService = inject(SolunarService);
  protected readonly shareService = inject(ShareService);

  private readonly dateUtc = new Date().toISOString().slice(0, 10);

  private readonly scoreSignal = toSignal(
    toObservable(this.activeLocationService.coords).pipe(
      switchMap(coords => {
        if (!coords) return of(null);
        return this.fishingScoreService.getScore(coords.latitude, coords.longitude, this.dateUtc);
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly payload = computed<SharePayload | null>(() => {
    const coords = this.activeLocationService.coords();
    const score = this.scoreSignal();
    if (!coords || !score) return null;

    const moonData = this.moonPhaseService.calculateForDateString(this.dateUtc);
    const solunarData = this.solunarService.calculateForDateString(
      this.dateUtc,
      coords.latitude,
      coords.longitude,
    );

    return {
      score: score.score,
      locationName: coords.name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      phaseName: moonData.phaseName,
      phaseEmoji: moonData.phaseEmoji,
      illuminationPercent: moonData.illuminationPercent,
      bestPeakTime: buildPeakTimeString(solunarData.periods),
    };
  });

  protected readonly isPending = signal(false);
  protected readonly showFallbackModal = signal(false);
  protected readonly lastResult = signal<ShareResult | null>(null);
  protected readonly toastVisible = signal(false);

  protected readonly isDisabled = computed(() => this.isPending() || this.payload() === null);

  protected getSharePreviewText(): string {
    const p = this.payload();
    return p ? this.shareService.buildShareText(p) : '';
  }

  protected getShareUrl(): string {
    const p = this.payload();
    return p ? this.shareService.buildShareUrl(p) : '';
  }

  async onShare(): Promise<void> {
    const p = this.payload();
    if (!p || this.isPending()) return;

    this.isPending.set(true);
    this.lastResult.set(null);

    if (!this.shareService.canUseWebShare()) {
      this.showFallbackModal.set(true);
      this.isPending.set(false);
      return;
    }

    const result = await this.shareService.share(p);
    this.lastResult.set(result);
    this.isPending.set(false);

    if (result.status === 'shared' || result.status === 'copied') {
      this.showToast();
    }
  }

  async onCopyToClipboard(): Promise<void> {
    const p = this.payload();
    if (!p) return;

    const text = this.shareService.buildShareText(p);
    const url = this.shareService.buildShareUrl(p);
    const result = await this.shareService.copyToClipboard(`${text}\n${url}`);
    this.lastResult.set(result);

    if (result.status === 'copied') {
      this.showToast();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.showFallbackModal()) {
      this.closeFallbackModal();
    }
  }

  closeFallbackModal(): void {
    this.showFallbackModal.set(false);
  }

  private showToast(): void {
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
