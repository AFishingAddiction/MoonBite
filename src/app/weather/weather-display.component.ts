import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { WeatherData, WeatherService, getWeatherDescription, getWeatherEmoji } from './weather.service';

@Component({
  selector: 'app-weather-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './weather-display.component.html',
  styleUrl: './weather-display.component.scss',
})
export class WeatherDisplayComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly weatherService = inject(WeatherService);

  protected readonly geoState = this.geoService.state;

  protected readonly isIdle = computed(() => this.geoState().status === 'idle');

  protected readonly isLocating = computed(() => {
    const s = this.geoState().status;
    return s === 'idle' || s === 'requesting';
  });

  protected readonly isDenied = computed(() => {
    const s = this.geoState().status;
    return s === 'denied' || s === 'unavailable' || s === 'error';
  });

  // Drives the HTTP fetch reactively: re-fetches when location is granted
  protected readonly weather = toSignal(
    toObservable(this.geoService.state).pipe(
      switchMap((state) => {
        if (state.status !== 'granted' || !state.position) return of(undefined);
        const { latitude, longitude } = state.position.coords;
        return this.weatherService.getWeatherForLocation(latitude, longitude);
      }),
    ),
  );

  protected readonly hasData = computed(() => {
    const w = this.weather();
    return w !== undefined && w !== null;
  });

  protected readonly hasError = computed(
    () => this.isDenied() || this.weather() === null,
  );

  protected readonly scoreReady = signal(false);

  protected readonly scoreBarWidth = computed(() => {
    const score = this.weather()?.fishingScoreContribution ?? 0;
    return `${score}%`;
  });

  protected readonly scoreColorClass = computed(() => {
    const score = this.weather()?.fishingScoreContribution ?? 0;
    if (score <= 30) return 'weather-card__score-fill--poor';
    if (score <= 60) return 'weather-card__score-fill--fair';
    if (score <= 80) return 'weather-card__score-fill--good';
    return 'weather-card__score-fill--excellent';
  });

  protected readonly pressureTrendIcon = computed(() => {
    const trend = this.weather()?.pressureTrend ?? 'steady';
    if (trend === 'rising') return '↑';
    if (trend === 'falling') return '↓';
    return '→';
  });

  protected readonly weatherEmoji = computed(() => {
    const code = this.weather()?.weatherCode;
    return code !== undefined ? getWeatherEmoji(code) : '';
  });

  protected readonly weatherDescription = computed(() => {
    const code = this.weather()?.weatherCode;
    return code !== undefined ? getWeatherDescription(code) : '';
  });

  protected readonly sectionAriaLabel = computed(() =>
    this.isLocating() ? 'Weather Conditions loading' : 'Weather Conditions',
  );

  constructor() {
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }
}
