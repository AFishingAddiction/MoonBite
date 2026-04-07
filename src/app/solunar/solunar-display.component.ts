import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveLocationService } from '../locations/active-location.service';
import { PreferencesService } from '../preferences/preferences.service';
import { SolunarData, SolunarPeriod, SolunarService } from './solunar.service';
import { WeatherService } from '../weather/weather.service';

@Component({
  selector: 'app-solunar-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './solunar-display.component.html',
  styleUrl: './solunar-display.component.scss',
})
export class SolunarDisplayComponent {
  private readonly activeLocationService = inject(ActiveLocationService);
  private readonly solunarService = inject(SolunarService);
  private readonly prefs = inject(PreferencesService);
  private readonly weatherService = inject(WeatherService);

  protected readonly isIdle = computed(() => this.activeLocationService.status() === 'idle');

  protected readonly isLocating = this.activeLocationService.isLocating;

  protected readonly hasError = this.activeLocationService.hasError;

  protected readonly solunarData = computed<SolunarData | null>(() => {
    const coords = this.activeLocationService.coords();
    if (!coords) return null;
    return this.solunarService.calculateForToday(coords.latitude, coords.longitude);
  });

  protected readonly isPolar = computed(() => this.solunarData()?.moonriseUtc === null);

  protected readonly scoreReady = signal(false);

  protected readonly scorePercent = computed(() => {
    const data = this.solunarData();
    return data ? `${data.fishingScoreContribution}%` : '0%';
  });

  protected readonly ratingStars = computed(() => {
    const data = this.solunarData();
    if (!data) return '';
    return '★'.repeat(data.rating) + '☆'.repeat(4 - data.rating);
  });

  constructor() {
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }

  protected formatTime(isoString: string): string {
    const data = this.solunarData();
    if (data) {
      const tz = this.weatherService.getTimezone(data.latitude, data.longitude);
      if (tz) return this.prefs.formatTimeInZone(isoString, tz);
      return this.prefs.formatTimeForLongitude(isoString, data.longitude);
    }
    const d = new Date(isoString);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m} UTC`;
  }

  protected periodAriaLabel(period: SolunarPeriod): string {
    return `${period.description}: ${this.formatTime(period.startUtc)} to ${this.formatTime(period.endUtc)}`;
  }
}
