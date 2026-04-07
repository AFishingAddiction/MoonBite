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
import { ActiveLocationService } from '../locations/active-location.service';
import { WeatherData, WeatherService, getWeatherDescription, getWeatherEmoji } from './weather.service';
import { PreferencesService } from '../preferences/preferences.service';

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
  private readonly activeLocationService = inject(ActiveLocationService);
  private readonly weatherService = inject(WeatherService);
  private readonly prefs = inject(PreferencesService);

  readonly isIdle = computed(() => this.activeLocationService.status() === 'idle');

  readonly isLocating = this.activeLocationService.isLocating;

  readonly weather = toSignal(
    toObservable(this.activeLocationService.coords).pipe(
      switchMap(coords => {
        if (!coords) return of(undefined);
        return this.weatherService.getWeatherForLocation(coords.latitude, coords.longitude);
      }),
    ),
  );

  readonly hasData = computed(() => {
    const w = this.weather();
    return w !== undefined && w !== null;
  });

  readonly hasError = computed(() => {
    return this.activeLocationService.hasError() || this.weather() === null;
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

  readonly tempDisplay = computed(() => {
    const w = this.weather();
    if (!w) return '';
    return `${Math.round(this.prefs.convertTemperature(w.temperatureCelsius))}${this.prefs.getTemperatureUnit()}`;
  });

  readonly feelsLikeDisplay = computed(() => {
    const w = this.weather();
    if (!w) return '';
    return `${Math.round(this.prefs.convertTemperature(w.apparentTemperatureCelsius))}${this.prefs.getTemperatureUnit()}`;
  });

  readonly windDisplay = computed(() => {
    const w = this.weather();
    if (!w) return '';
    return `${this.prefs.convertWindSpeed(w.windSpeedKmh).toFixed(1)} ${this.prefs.getWindSpeedUnit()}`;
  });

  readonly windGustDisplay = computed(() => {
    const w = this.weather();
    if (!w) return '';
    return `${this.prefs.convertWindSpeed(w.windGustKmh).toFixed(1)} ${this.prefs.getWindSpeedUnit()}`;
  });

  readonly pressureDisplay = computed(() => {
    const w = this.weather();
    if (!w) return '';
    const p = this.prefs.convertPressure(w.barometricPressureHpa);
    const unit = this.prefs.getPressureUnit();
    return unit === 'inHg' ? `${p.toFixed(2)} ${unit}` : `${p.toFixed(0)} ${unit}`;
  });

  readonly precipDisplay = computed(() => {
    const w = this.weather();
    if (!w) return '';
    const v = this.prefs.convertPrecipitation(w.precipitationMm);
    return `${v.toFixed(2)} ${this.prefs.getPrecipitationUnit()}`;
  });

  // Gust warning threshold converted to current unit (30 km/h ≈ 18.6 mph)
  readonly gustHighThreshold = computed(() =>
    this.prefs.unitSystem() === 'imperial' ? 18.6 : 30
  );

  readonly pressureUnit = computed(() => this.prefs.getPressureUnit());
  readonly tempUnit = computed(() => this.prefs.getTemperatureUnit());
  readonly windUnit = computed(() => this.prefs.getWindSpeedUnit());

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
