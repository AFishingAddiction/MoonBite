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
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { WeatherData, WeatherService, getWeatherDescription, getWeatherEmoji } from './weather.service';

// ── Advice copy keyed by score tier ───────────────────────────────────────────

const SCORE_ADVICE: Record<'good' | 'fair' | 'poor', string> = {
  good: 'Excellent fishing conditions — stable pressure, light winds, and manageable cloud cover create optimal feeding windows. Get out there!',
  fair: 'Decent conditions for fishing. Some factors are limiting peak activity — focus on structure and be patient during transition periods.',
  poor: 'Challenging weather conditions. Falling pressure or strong winds typically slow fish activity. Consider timing your outing around weather breaks.',
};

@Component({
  selector: 'app-weather-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './weather-details.component.html',
  styleUrl: './weather-details.component.scss',
})
export class WeatherDetailsComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly weatherService = inject(WeatherService);

  readonly geoState = this.geoService.state;

  readonly isIdle = computed(() => this.geoState().status === 'idle');

  readonly isLocating = computed(() => {
    const s = this.geoState().status;
    return s === 'idle' || s === 'requesting';
  });

  readonly weather = toSignal(
    toObservable(this.geoService.state).pipe(
      switchMap((state) => {
        if (state.status !== 'granted' || !state.position) return of(undefined);
        const { latitude, longitude } = state.position.coords;
        return this.weatherService.getWeatherForLocation(latitude, longitude);
      }),
    ),
  );

  readonly hasData = computed(() => {
    const w = this.weather();
    return w !== undefined && w !== null;
  });

  readonly hasError = computed(() => {
    const s = this.geoState().status;
    return s === 'denied' || s === 'unavailable' || s === 'error' || this.weather() === null;
  });

  readonly scoreReady = signal(false);

  readonly scorePercent = computed(() => {
    const w = this.weather();
    return w ? `${w.fishingScoreContribution}%` : '0%';
  });

  readonly scoreTierClass = computed((): 'good' | 'fair' | 'poor' => {
    const w = this.weather();
    if (!w) return 'poor';
    const s = w.fishingScoreContribution;
    if (s >= 75) return 'good';
    if (s >= 50) return 'fair';
    return 'poor';
  });

  readonly weatherEmoji = computed(() => {
    const code = this.weather()?.weatherCode;
    return code !== undefined ? getWeatherEmoji(code) : '';
  });

  readonly weatherDescription = computed(() => {
    const code = this.weather()?.weatherCode;
    return code !== undefined ? getWeatherDescription(code) : '';
  });

  readonly pressureTrendIcon = computed(() => {
    const trend = this.weather()?.pressureTrend ?? 'steady';
    if (trend === 'rising') return '↑';
    if (trend === 'falling') return '↓';
    return '→';
  });

  readonly pressureTrendLabel = computed(() => {
    const trend = this.weather()?.pressureTrend ?? 'steady';
    if (trend === 'rising') return 'Rising';
    if (trend === 'falling') return 'Falling';
    return 'Steady';
  });

  readonly advice = computed(() => SCORE_ADVICE[this.scoreTierClass()]);

  readonly scoreBreakdown = computed<{ pressure: number; wind: number; cloud: number; precipitation: number } | null>(
    () => {
      const w = this.weather();
      if (!w) return null;
      return this.weatherService.getScoreBreakdown(w);
    },
  );

  constructor() {
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }
}
