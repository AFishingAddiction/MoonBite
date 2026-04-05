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
import { MoonPhaseData, MoonPhaseService, PhaseName } from './moon-phase.service';

const PHASE_ADVICE: Record<PhaseName, string> = {
  'New Moon':
    'New moons are prime fishing periods — reduced light favors active feeders. Night fishing is particularly effective.',
  'Waxing Crescent':
    'Fish activity is picking up as the moon grows. Expect steady action, especially in early morning and evening.',
  'First Quarter':
    'Half-lit skies provide balanced light levels. Time your trips to solunar peak windows for best results.',
  'Waxing Gibbous':
    'Bright moonlight is increasing. Focus on dawn and dusk; work structure and shade during the day.',
  'Full Moon':
    'Some fish feed heavily under the full moon, others grow inactive. Focus on structure and work shade lines.',
  'Waning Gibbous':
    'Activity often picks back up post-full moon. Return to evening and night fishing strategies.',
  'Last Quarter': 'Half-lit skies again favor steady fishing. Early mornings are prime windows.',
  'Waning Crescent':
    'The transition toward new moon brings renewed activity. Prepare for excellent new moon conditions ahead.',
};

const LUNAR_CYCLE = 29.530588861;

@Component({
  selector: 'app-moon-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SlicePipe],
  templateUrl: './moon-details.component.html',
  styleUrl: './moon-details.component.scss',
})
export class MoonDetailsComponent {
  private readonly moonPhaseService = inject(MoonPhaseService);

  readonly moonData = signal(this.moonPhaseService.calculateForToday());
  readonly scoreReady = signal(false);

  readonly scorePercent = computed(() => `${this.moonData().fishingScoreContribution}%`);

  readonly moonDay = computed(() => Math.floor(this.moonData().moonAge));

  readonly daysToFullMoon = computed(() => {
    const age = this.moonData().moonAge;
    const halfCycle = LUNAR_CYCLE / 2;
    const raw = halfCycle - age;
    const result = raw > 0 ? Math.round(raw) : Math.round(raw + LUNAR_CYCLE);
    return result > 0 ? result : Math.round(LUNAR_CYCLE);
  });

  readonly daysToNewMoon = computed(() => {
    const age = this.moonData().moonAge;
    const raw = LUNAR_CYCLE - age;
    const result = raw > 0 ? Math.round(raw) : Math.round(raw + LUNAR_CYCLE);
    return result > 0 ? result : Math.round(LUNAR_CYCLE);
  });

  readonly scoreTierClass = computed((): 'good' | 'fair' | 'poor' => {
    const score = this.moonData().fishingScoreContribution;
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  });

  readonly phaseAdvice = computed(() => PHASE_ADVICE[this.moonData().phaseName]);

  readonly forecastDays: readonly MoonPhaseData[];

  constructor() {
    const today = new Date();
    this.forecastDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i);
      return this.moonPhaseService.calculateForDate(d);
    });

    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }
}
