import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { ActiveLocationService } from '../locations/active-location.service';
import { FishingScore, FishingScoreService } from './fishing-score.service';

@Component({
  selector: 'app-fishing-score-display',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fishing-score-display.component.html',
  styleUrl: './fishing-score-display.component.scss',
})
export class FishingScoreDisplayComponent {
  private readonly activeLocationService = inject(ActiveLocationService);
  private readonly fishingScoreService = inject(FishingScoreService);

  protected readonly geoStatus = this.activeLocationService.status;

  /** Reactive score signal — undefined while loading, null on error, FishingScore on success. */
  readonly score = toSignal(
    toObservable(this.activeLocationService.coords).pipe(
      switchMap(coords => {
        if (!coords) return of(null as FishingScore | null);
        const dateUtc = new Date().toISOString().slice(0, 10);
        return this.fishingScoreService.getScore(coords.latitude, coords.longitude, dateUtc);
      }),
    ),
    { initialValue: undefined },
  );
}
