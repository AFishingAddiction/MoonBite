import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ScoreBreakdownComponent } from './score-breakdown.component';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { FishingScore, FishingScoreService } from './fishing-score.service';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeFishingScore(overrides: Partial<FishingScore> = {}): FishingScore {
  return {
    score: 78,
    breakdown: {
      moonPhaseScore: 62,
      solunarScore: 90,
      weatherScore: 77,
      moonPhaseWeighted: 19,
      solunarWeighted: 32,
      weatherWeighted: 27,
      weatherAvailable: true,
    },
    weights: { moonPhase: 0.3, solunar: 0.35, weather: 0.35 },
    dateUtc: '2026-04-06',
    latitude: 40.7128,
    longitude: -74.006,
    ...overrides,
  };
}

function makeGrantedState(latitude = 40.7128, longitude = -74.006): GeolocationState {
  return {
    status: 'granted',
    position: {
      coords: { latitude, longitude, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now(),
    } as GeolocationPosition,
    error: null,
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ScoreBreakdownComponent', () => {
  let fixture: ComponentFixture<ScoreBreakdownComponent>;
  let component: ScoreBreakdownComponent;
  let stateSignal: ReturnType<typeof signal<GeolocationState>>;
  let mockFishingScoreService: jasmine.SpyObj<FishingScoreService>;

  const defaultScore = makeFishingScore();

  beforeEach(async () => {
    stateSignal = signal<GeolocationState>({ status: 'idle', position: null, error: null });

    mockFishingScoreService = jasmine.createSpyObj<FishingScoreService>('FishingScoreService', ['getScore']);
    mockFishingScoreService.getScore.and.returnValue(of(defaultScore));

    await TestBed.configureTestingModule({
      imports: [ScoreBreakdownComponent],
      providers: [
        provideRouter([]),
        {
          provide: GeolocationService,
          useValue: { state: stateSignal },
        },
        { provide: FishingScoreService, useValue: mockFishingScoreService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Idle state ───────────────────────────────────────────────────────────────

  describe('idle state (no location)', () => {
    it('shows the location prompt', () => {
      const prompt = fixture.debugElement.query(By.css('.score-detail__location-prompt'));
      expect(prompt).not.toBeNull();
    });

    it('does not show the score number', () => {
      const number = fixture.debugElement.query(By.css('.score-detail__number'));
      expect(number).toBeNull();
    });

    it('does not show the loading spinner', () => {
      const spinner = fixture.debugElement.query(By.css('.score-detail__loading'));
      expect(spinner).toBeNull();
    });
  });

  // ── Loading state ────────────────────────────────────────────────────────────

  describe('loading state', () => {
    beforeEach(() => {
      stateSignal.set({ status: 'requesting', position: null, error: null });
      fixture.detectChanges();
    });

    it('shows a loading spinner', () => {
      const spinner = fixture.debugElement.query(By.css('.score-detail__loading'));
      expect(spinner).not.toBeNull();
    });

    it('shows "Calculating score…" text', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Calculating score');
    });

    it('does not show the score number', () => {
      const number = fixture.debugElement.query(By.css('.score-detail__number'));
      expect(number).toBeNull();
    });
  });

  // ── Error state ──────────────────────────────────────────────────────────────

  describe('error state (geo denied)', () => {
    beforeEach(() => {
      stateSignal.set({
        status: 'denied',
        position: null,
        error: { code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 },
      });
      fixture.detectChanges();
    });

    it('shows the error message', () => {
      const error = fixture.debugElement.query(By.css('.score-detail__error'));
      expect(error).not.toBeNull();
    });

    it('does not show the score number', () => {
      const number = fixture.debugElement.query(By.css('.score-detail__number'));
      expect(number).toBeNull();
    });
  });

  // ── Success state ─────────────────────────────────────────────────────────────

  describe('success state', () => {
    beforeEach(() => {
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
    });

    it('shows the composite score number', () => {
      const number = fixture.debugElement.query(By.css('.score-detail__number'));
      expect(number).not.toBeNull();
      expect(number.nativeElement.textContent).toContain('78');
    });

    it('shows the tier label', () => {
      const label = fixture.debugElement.query(By.css('.score-detail__tier-label'));
      expect(label).not.toBeNull();
    });

    it('shows the composite score bar with role="meter"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter).not.toBeNull();
    });

    it('shows three factor rows', () => {
      const factors = fixture.debugElement.queryAll(By.css('.score-detail__factor'));
      expect(factors.length).toBe(3);
    });

    it('shows the moon phase raw score', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('62');
    });

    it('shows the solunar raw score', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('90');
    });

    it('shows the weather raw score', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('77');
    });

    it('shows the moon phase weighted contribution', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('19');
    });

    it('shows the solunar weighted contribution', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('32');
    });

    it('shows the weather weighted contribution', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('27');
    });

    it('has a link to /moon for moon phase factor', () => {
      const moonLink = fixture.debugElement.query(By.css('a[href="/moon"]'));
      expect(moonLink).not.toBeNull();
    });

    it('has a link to /solunar for solunar factor', () => {
      const solunarLink = fixture.debugElement.query(By.css('a[href="/solunar"]'));
      expect(solunarLink).not.toBeNull();
    });

    it('has a link to /weather for weather factor', () => {
      const weatherLink = fixture.debugElement.query(By.css('a[href="/weather"]'));
      expect(weatherLink).not.toBeNull();
    });

    it('shows the algorithm explanation section', () => {
      const section = fixture.debugElement.query(By.css('.score-detail__algorithm'));
      expect(section).not.toBeNull();
    });

    it('shows the advice section', () => {
      const section = fixture.debugElement.query(By.css('.score-detail__advice-section'));
      expect(section).not.toBeNull();
    });

    it('does not show the weather unavailable warning when weather is available', () => {
      const warning = fixture.debugElement.query(By.css('.score-detail__weather-warning'));
      expect(warning).toBeNull();
    });
  });

  // ── Weather unavailable ───────────────────────────────────────────────────────

  describe('success state with weather unavailable', () => {
    beforeEach(() => {
      mockFishingScoreService.getScore.and.returnValue(
        of(
          makeFishingScore({
            score: 71,
            breakdown: {
              moonPhaseScore: 60,
              solunarScore: 80,
              weatherScore: 0,
              moonPhaseWeighted: 28,
              solunarWeighted: 43,
              weatherWeighted: 0,
              weatherAvailable: false,
            },
          }),
        ),
      );
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
    });

    it('shows the weather unavailable warning', () => {
      const warning = fixture.debugElement.query(By.css('.score-detail__weather-warning'));
      expect(warning).not.toBeNull();
    });
  });

  // ── scoreTierClass() computed ─────────────────────────────────────────────────

  describe('scoreTierClass()', () => {
    it('returns "good" for score >= 75', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 75 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('good');
    });

    it('returns "good" for score = 100', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 100 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('good');
    });

    it('returns "fair" for score = 74', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 74 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('returns "fair" for score = 50', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 50 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('returns "poor" for score = 49', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 49 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('poor');
    });

    it('returns "poor" for score = 0', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 0 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('poor');
    });
  });

  // ── tierLabel() computed ──────────────────────────────────────────────────────

  describe('tierLabel()', () => {
    it('returns "Excellent Conditions" for good tier', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 80 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.tierLabel()).toBe('Excellent Conditions');
    });

    it('returns "Good Conditions" for fair tier', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 60 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.tierLabel()).toBe('Good Conditions');
    });

    it('returns "Poor Conditions" for poor tier', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 30 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.tierLabel()).toBe('Poor Conditions');
    });
  });

  // ── scorePercent() computed ───────────────────────────────────────────────────

  describe('scorePercent()', () => {
    it('returns the score as a percent string', () => {
      mockFishingScoreService.getScore.and.returnValue(of(makeFishingScore({ score: 78 })));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scorePercent()).toBe('78%');
    });
  });

  // ── Back link ─────────────────────────────────────────────────────────────────

  describe('back link', () => {
    it('renders a back link to /', () => {
      const backLink = fixture.debugElement.query(By.css('a[href="/"]'));
      expect(backLink).not.toBeNull();
    });
  });
});
