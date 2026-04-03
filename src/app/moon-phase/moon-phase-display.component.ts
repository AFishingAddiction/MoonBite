import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MoonPhaseService } from './moon-phase.service';

@Component({
  selector: 'app-moon-phase-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './moon-phase-display.component.html',
  styleUrl: './moon-phase-display.component.scss',
})
export class MoonPhaseDisplayComponent {
  private readonly moonPhaseService = inject(MoonPhaseService);

  protected readonly moonData = signal(this.moonPhaseService.calculateForToday());
  protected readonly scoreReady = signal(false);
  protected readonly scorePercent = computed(() => `${this.moonData().fishingScoreContribution}%`);
  protected readonly moonDay = computed(() => Math.floor(this.moonData().moonAge));

  constructor() {
    // Defer setting scoreReady to after the first render so the CSS transition
    // fires from width:0 → computed width, giving a mount animation.
    afterNextRender(() => {
      this.scoreReady.set(true);
    });
  }
}
