import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { take } from 'rxjs/operators';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { SplashScreenComponent } from './splash/splash-screen.component';
import { NotificationToastComponent } from './notifications/notification-toast.component';
import { NotificationService } from './notifications/notification.service';
import { ActiveLocationService } from './locations/active-location.service';
import { MoonPhaseService } from './moon-phase/moon-phase.service';
import { FishingScoreService } from './scoring/fishing-score.service';
import { ScoreHistoryService } from './history/score-history.service';
import { WeatherService } from './weather/weather.service';
import { PreferencesService } from './preferences/preferences.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, BottomNavComponent, SplashScreenComponent, NotificationToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnDestroy {
  private readonly locationService = inject(ActiveLocationService);
  private readonly scoreService = inject(FishingScoreService);
  private readonly historyService = inject(ScoreHistoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly prefsService = inject(PreferencesService);
  private readonly moonPhaseService = inject(MoonPhaseService);
  private readonly weatherService = inject(WeatherService);

  readonly unreadCount = this.notificationService.unreadCount;

  /** Controls splash-screen visibility. Hides once location resolves AND minimum time elapses. */
  readonly showSplash = signal(true);

  // Both conditions must be true before we hide the splash.
  private locationReady = false;
  private minTimeElapsed = false;

  private readonly splashTimeout: ReturnType<typeof setTimeout>;
  private readonly minDisplayTimeout: ReturnType<typeof setTimeout>;

  readonly todayLabel = computed(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  constructor() {
    // Hide splash once location is available or an error is reached,
    // but only after the minimum display time has also elapsed.
    effect(() => {
      const coords = this.locationService.coords();
      const hasError = this.locationService.hasError();
      if (coords || hasError) {
        this.locationReady = true;
        this.maybeHideSplash();
      }
    });

    // Minimum display time: splash shows for at least 800ms so it's actually visible.
    this.minDisplayTimeout = setTimeout(() => {
      this.minTimeElapsed = true;
      this.maybeHideSplash();
    }, 800);

    // Safety timeout: never block the user for more than 5 seconds.
    this.splashTimeout = setTimeout(() => this.showSplash.set(false), 5000);

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
        .subscribe(score => {
          this.historyService.recordTodayScore(score, coords.latitude, coords.longitude);
          this.runNotificationChecks(score?.score ?? null, coords.latitude, coords.longitude);
        });
    });
  }

  private runNotificationChecks(score: number | null, latitude: number, longitude: number): void {
    const prefs = this.prefsService.notificationPrefs();
    if (!prefs.notificationsEnabled) return;

    if (score !== null && prefs.scoreJump) {
      this.notificationService.checkScoreJump(score, 'current', 'Current Location', true, false);
    }

    if (prefs.moonMilestone) {
      const moon = this.moonPhaseService.calculateForToday();
      this.notificationService.checkMoonMilestone(moon.moonAge, true);
    }

    if (prefs.pressureAlert) {
      const weather = this.weatherService.getCachedWeather(latitude, longitude);
      if (weather) {
        this.notificationService.checkPressureAlert(
          weather.barometricPressureHpa,
          'current',
          'Current Location',
          true,
          false,
        );
      }
    }
  }

  private maybeHideSplash(): void {
    if (this.locationReady && this.minTimeElapsed) {
      this.showSplash.set(false);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.splashTimeout);
    clearTimeout(this.minDisplayTimeout);
  }
}
