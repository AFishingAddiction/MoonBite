import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { SolunarData, SolunarPeriod, SolunarService } from './solunar.service';

@Component({
  selector: 'app-solunar-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './solunar-display.component.html',
  styleUrl: './solunar-display.component.scss',
})
export class SolunarDisplayComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly solunarService = inject(SolunarService);

  protected readonly geoState = this.geoService.state;

  protected readonly isIdle = computed(() => this.geoState().status === 'idle');

  protected readonly isLocating = computed(() => {
    const s = this.geoState().status;
    return s === 'idle' || s === 'requesting';
  });

  protected readonly hasError = computed(() => {
    const s = this.geoState().status;
    return s === 'denied' || s === 'unavailable' || s === 'error';
  });

  protected readonly solunarData = computed<SolunarData | null>(() => {
    const state = this.geoState();
    if (state.status !== 'granted' || !state.position) return null;
    const { latitude, longitude } = state.position.coords;
    return this.solunarService.calculateForToday(latitude, longitude);
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
    const d = new Date(isoString);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m} UTC`;
  }

  protected periodAriaLabel(period: SolunarPeriod): string {
    return `${period.description}: ${this.formatTime(period.startUtc)} to ${this.formatTime(period.endUtc)}`;
  }
}
