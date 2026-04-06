import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { FishingScore, FishingScoreService } from './fishing-score.service';

// ── Advice copy keyed by score tier ───────────────────────────────────────────

const SCORE_ADVICE: Record<'good' | 'fair' | 'poor', string> = {
  good: 'Outstanding fishing conditions today. All key factors align for peak activity — plan your trip around solunar peak windows for best results.',
  fair: 'Decent conditions for a productive outing. Some factors are limiting peak activity — focus on structure and time your trips to solunar peaks.',
  poor: 'Challenging conditions today. Unfavorable factors will slow fish activity. Consider targeting sheltered areas and waiting for better conditions.',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function tierFor(score: number): 'good' | 'fair' | 'poor' {
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-score-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './score-breakdown.component.html',
  styleUrl: './score-breakdown.component.scss',
})
export class ScoreBreakdownComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly fishingScoreService = inject(FishingScoreService);

  readonly geoState = this.geoService.state;

  readonly isIdle = computed(() => this.geoState().status === 'idle');

  readonly isLoading = computed(() => {
    const s = this.geoState().status;
    return s === 'requesting' || (s === 'granted' && this.fishingScore() === undefined);
  });

  readonly hasError = computed(() => {
    const s = this.geoState().status;
    return (
      s === 'denied' || s === 'unavailable' || s === 'error' || this.fishingScore() === null
    );
  });

  readonly fishingScore = toSignal(
    toObservable(this.geoService.state).pipe(
      switchMap((state) => {
        if (state.status !== 'granted' || !state.position) return of(undefined);
        const { latitude, longitude } = state.position.coords;
        const dateUtc = new Date().toISOString().slice(0, 10);
        return this.fishingScoreService.getScore(
          latitude,
          longitude,
          dateUtc,
        ) as ReturnType<FishingScoreService['getScore']>;
      }),
    ),
  );

  readonly scoreReady = signal(false);

  readonly scorePercent = computed(() => {
    const s = this.fishingScore();
    return s ? `${s.score}%` : '0%';
  });

  readonly scoreTierClass = computed((): 'good' | 'fair' | 'poor' => {
    const s = this.fishingScore();
    if (!s) return 'poor';
    return tierFor(s.score);
  });

  readonly tierLabel = computed((): string => {
    const tier = this.scoreTierClass();
    if (tier === 'good') return 'Excellent Conditions';
    if (tier === 'fair') return 'Good Conditions';
    return 'Poor Conditions';
  });

  readonly advice = computed(() => SCORE_ADVICE[this.scoreTierClass()]);

  readonly moonScorePercent = computed(() => {
    const s = this.fishingScore() as FishingScore | null | undefined;
    return s ? `${s.breakdown.moonPhaseScore}%` : '0%';
  });

  readonly solunarScorePercent = computed(() => {
    const s = this.fishingScore() as FishingScore | null | undefined;
    return s ? `${s.breakdown.solunarScore}%` : '0%';
  });

  readonly weatherScorePercent = computed(() => {
    const s = this.fishingScore() as FishingScore | null | undefined;
    return s ? `${s.breakdown.weatherScore}%` : '0%';
  });

  readonly moonTierClass = computed(() =>
    tierFor((this.fishingScore() as FishingScore | null | undefined)?.breakdown.moonPhaseScore ?? 0),
  );

  readonly solunarTierClass = computed(() =>
    tierFor((this.fishingScore() as FishingScore | null | undefined)?.breakdown.solunarScore ?? 0),
  );

  readonly weatherTierClass = computed(() =>
    tierFor((this.fishingScore() as FishingScore | null | undefined)?.breakdown.weatherScore ?? 0),
  );

  constructor() {
    afterNextRender(() => this.scoreReady.set(true));
  }
}
