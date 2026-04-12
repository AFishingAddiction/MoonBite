import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { take } from 'rxjs/operators';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { ActiveLocationService } from './locations/active-location.service';
import { FishingScoreService } from './scoring/fishing-score.service';
import { ScoreHistoryService } from './history/score-history.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, BottomNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly locationService = inject(ActiveLocationService);
  private readonly scoreService = inject(FishingScoreService);
  private readonly historyService = inject(ScoreHistoryService);

  readonly todayLabel = computed(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  constructor() {
    // Silently record today's score whenever a location becomes available.
    // The service is idempotent per day per location, so re-firing on location
    // change is safe.
    effect(() => {
      const coords = this.locationService.coords();
      if (!coords) return;
      const dateUtc = new Date().toISOString().slice(0, 10);
      this.scoreService
        .getScore(coords.latitude, coords.longitude, dateUtc)
        .pipe(take(1))
        .subscribe(score =>
          this.historyService.recordTodayScore(score, coords.latitude, coords.longitude),
        );
    });
  }
}
