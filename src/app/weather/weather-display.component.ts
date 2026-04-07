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
import { ActiveLocationService } from '../locations/active-location.service';
import { WeatherData, WeatherService, getWeatherDescription, getWeatherEmoji } from './weather.service';
import { PreferencesService } from '../preferences/preferences.service';

@Component({
  selector: 'app-weather-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './weather-display.component.html',
  styleUrl: './weather-display.component.scss',
})
export class WeatherDisplayComponent {
  private readonly activeLocationService = inject(ActiveLocationService);
  private readonly weatherService = inject(WeatherService);
  private readonly prefs = inject(PreferencesService);

  protected readonly isIdle = computed(() => this.activeLocationService.status() === 'idle');

  protected readonly isLocating = this.activeLocationService.isLocating;

  protected readonly isDenied = this.activeLocationService.hasError;

  // Drives the HTTP fetch reactively: re-fetches when location changes
  protected readonly weather = toSignal(
    toObservable(this.activeLocationService.coords).pipe(
      switchMap(coords => {
        if (!coords) return of(undefined);
        return this.weatherService.getWeatherForLocation(coords.latitude, coords.longitude);
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

  constructor() {
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }
}
