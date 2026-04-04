import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { GeolocationService } from '../geolocation/geolocation.service';
import { FishingScore, FishingScoreService } from './fishing-score.service';

@Component({
  selector: 'app-fishing-score-display',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fishing-score-display.component.html',
  styleUrl: './fishing-score-display.component.scss',
})
export class FishingScoreDisplayComponent {
  private readonly geoService = inject(GeolocationService);
  private readonly fishingScoreService = inject(FishingScoreService);

  protected readonly geoStatus = computed(() => this.geoService.state().status);

  /** Reactive score signal — undefined while loading, null on error, FishingScore on success. */
  readonly score = toSignal(
    toObservable(this.geoService.state).pipe(
      switchMap((state) => {
        if (state.status !== 'granted' || !state.position) {
          return of(null as FishingScore | null);
        }
        const { latitude, longitude } = state.position.coords;
        const dateUtc = new Date().toISOString().slice(0, 10);
        return this.fishingScoreService.getScore(latitude, longitude, dateUtc);
      }),
    ),
    { initialValue: undefined },
  );
}
