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
import { ActiveLocationService } from '../locations/active-location.service';
import { PreferencesService } from '../preferences/preferences.service';
import { SolunarData, SolunarPeriod, SolunarService } from './solunar.service';
import { WeatherService } from '../weather/weather.service';

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
  private readonly activeLocationService = inject(ActiveLocationService);
  private readonly prefs = inject(PreferencesService);
  private readonly solunarService = inject(SolunarService);
  private readonly weatherService = inject(WeatherService);

  readonly isIdle = computed(() => this.activeLocationService.status() === 'idle');

  readonly isLocating = this.activeLocationService.isLocating;

  readonly hasError = this.activeLocationService.hasError;

  readonly solunarData = computed<SolunarData | null>(() => {
    const coords = this.activeLocationService.coords();
    if (!coords) return null;
    return this.solunarService.calculateForToday(coords.latitude, coords.longitude);
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
    const coords = this.activeLocationService.coords();
    if (!coords) return [];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i);
      const dateUtc = d.toISOString().slice(0, 10);
      return this.solunarService.calculateForDateString(dateUtc, coords.latitude, coords.longitude);
    });
  });

  constructor() {
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }

  formatTime(isoString: string): string {
    const data = this.solunarData();
    if (data) {
      const tz = this.weatherService.getTimezone(data.latitude, data.longitude);
      if (tz) return this.prefs.formatTimeInZone(isoString, tz);
      return this.prefs.formatTimeForLongitude(isoString, data.longitude);
    }
    return this.prefs.formatTime(isoString);
  }

  forecastRatingStars(rating: 1 | 2 | 3 | 4): string {
    return '★'.repeat(rating) + '☆'.repeat(4 - rating);
  }

  periodAriaLabel(period: SolunarPeriod): string {
    return `${period.description}: ${this.formatTime(period.startUtc)} to ${this.formatTime(period.endUtc)}`;
  }
}
