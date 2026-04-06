import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { SolunarData, SolunarPeriod, SolunarService } from './solunar.service';

// ── Advice copy keyed by rating (1–4) ─────────────────────────────────────────

const RATING_ADVICE: Record<1 | 2 | 3 | 4, string> = {
  4: 'Peak solunar conditions — new and full moons amplify feeding activity. Major periods are prime windows; plan your outing around them for maximum results.',
  3: 'Strong solunar activity at a quarter moon. Major transit windows are highly productive — time your casts to peak periods for the best action.',
  2: 'Moderate solunar influence today. Fish are active but selective — focus on cover, structure, and transition areas during major periods.',
  1: 'Lower solunar intensity today. Patience pays off — target feeding edges and work slower presentations during the major transit windows.',
};

@Component({
  selector: 'app-solunar-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SlicePipe],
  templateUrl: './solunar-details.component.html',
  styleUrl: './solunar-details.component.scss',
})
export class SolunarDetailsComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly solunarService = inject(SolunarService);

  readonly geoState = this.geoService.state;

  readonly isIdle = computed(() => this.geoState().status === 'idle');

  readonly isLocating = computed(() => {
    const s = this.geoState().status;
    return s === 'idle' || s === 'requesting';
  });

  readonly hasError = computed(() => {
    const s = this.geoState().status;
    return s === 'denied' || s === 'unavailable' || s === 'error';
  });

  readonly solunarData = computed<SolunarData | null>(() => {
    const state = this.geoState();
    if (state.status !== 'granted' || !state.position) return null;
    const { latitude, longitude } = state.position.coords;
    return this.solunarService.calculateForToday(latitude, longitude);
  });

  readonly isPolar = computed(() => this.solunarData()?.moonriseUtc === null);

  readonly scoreReady = signal(false);

  readonly scorePercent = computed(() => {
    const data = this.solunarData();
    return data ? `${data.fishingScoreContribution}%` : '0%';
  });

  readonly ratingStars = computed(() => {
    const data = this.solunarData();
    if (!data) return '';
    return '★'.repeat(data.rating) + '☆'.repeat(4 - data.rating);
  });

  readonly scoreTierClass = computed((): 'good' | 'fair' | 'poor' => {
    const data = this.solunarData();
    if (!data) return 'poor';
    const s = data.fishingScoreContribution;
    if (s >= 75) return 'good';
    if (s >= 50) return 'fair';
    return 'poor';
  });

  readonly advice = computed(() => {
    const data = this.solunarData();
    if (!data) return '';
    return RATING_ADVICE[data.rating];
  });

  readonly forecastDays = computed<SolunarData[]>(() => {
    const state = this.geoState();
    if (state.status !== 'granted' || !state.position) return [];
    const { latitude, longitude } = state.position.coords;
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i);
      const dateUtc = d.toISOString().slice(0, 10);
      return this.solunarService.calculateForDateString(dateUtc, latitude, longitude);
    });
  });

  constructor() {
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }

  formatTime(isoString: string): string {
    const d = new Date(isoString);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m} UTC`;
  }

  forecastRatingStars(rating: 1 | 2 | 3 | 4): string {
    return '★'.repeat(rating) + '☆'.repeat(4 - rating);
  }

  periodAriaLabel(period: SolunarPeriod): string {
    return `${period.description}: ${this.formatTime(period.startUtc)} to ${this.formatTime(period.endUtc)}`;
  }
}
