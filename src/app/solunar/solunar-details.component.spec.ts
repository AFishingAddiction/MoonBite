import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SolunarDetailsComponent } from './solunar-details.component';
import { GeolocationState } from '../geolocation/geolocation.service';
import { ActiveLocationService, ActiveCoords } from '../locations/active-location.service';
import { SolunarService, SolunarData, SolunarPeriod } from './solunar.service';
import { WeatherService } from '../weather/weather.service';

// ── Factories ─────────────────────────────────────────────────────────────────

function makePeriod(overrides: Partial<SolunarPeriod> = {}): SolunarPeriod {
  return {
    type: 'major',
    index: 1,
    startUtc: '2026-04-05T13:32:00.000Z',
    endUtc: '2026-04-05T15:32:00.000Z',
    durationMinutes: 120,
    rating: 4,
    description: 'Moon Overhead',
    ...overrides,
  };
}

function makeSolunarData(overrides: Partial<SolunarData> = {}): SolunarData {
  return {
    periods: [
      makePeriod({ index: 1, type: 'major', description: 'Moon Overhead', startUtc: '2026-04-05T08:32:00.000Z', endUtc: '2026-04-05T10:32:00.000Z' }),
      makePeriod({ index: 2, type: 'minor', description: 'Moonrise', durationMinutes: 60, startUtc: '2026-04-05T09:32:00.000Z', endUtc: '2026-04-05T10:32:00.000Z' }),
      makePeriod({ index: 3, type: 'minor', description: 'Moonset', durationMinutes: 60, startUtc: '2026-04-05T21:32:00.000Z', endUtc: '2026-04-05T22:32:00.000Z' }),
      makePeriod({ index: 4, type: 'major', description: 'Moon Underfoot', startUtc: '2026-04-05T20:32:00.000Z', endUtc: '2026-04-05T22:32:00.000Z' }),
    ],
    moonUpperTransitUtc: '2026-04-05T14:32:00.000Z',
    moonLowerTransitUtc: '2026-04-05T02:32:00.000Z',
    moonriseUtc: '2026-04-05T08:32:00.000Z',
    moonsetUtc: '2026-04-05T20:32:00.000Z',
    rating: 4,
    fishingScoreContribution: 100,
    dateUtc: '2026-04-05',
    latitude: 40.7128,
    longitude: -74.006,
    ...overrides,
  };
}

function makeGrantedState(
  latitude = 40.7128,
  longitude = -74.006
): GeolocationState {
  return {
    status: 'granted',
    position: {
      coords: {
        latitude,
        longitude,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition,
    error: null,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('SolunarDetailsComponent', () => {
  let fixture: ComponentFixture<SolunarDetailsComponent>;
  let component: SolunarDetailsComponent;
  let coordsSignal: ReturnType<typeof signal<ActiveCoords | null>>;
  let statusSignal: ReturnType<typeof signal<GeolocationState['status']>>;
  let isLocatingSignal: ReturnType<typeof signal<boolean>>;
  let hasErrorSignal: ReturnType<typeof signal<boolean>>;
  let mockSolunarService: jasmine.SpyObj<SolunarService>;
  let mockWeatherService: jasmine.SpyObj<WeatherService>;

  const defaultData = makeSolunarData();

  beforeEach(async () => {
    coordsSignal = signal<ActiveCoords | null>(null);
    statusSignal = signal<GeolocationState['status']>('idle');
    isLocatingSignal = signal(true); // 'idle' counts as locating (awaiting permission)
    hasErrorSignal = signal(false);

    const mockActiveService = {
      coords: coordsSignal.asReadonly(),
      status: statusSignal.asReadonly(),
      isLocating: isLocatingSignal.asReadonly(),
      hasError: hasErrorSignal.asReadonly(),
    };

    mockSolunarService = jasmine.createSpyObj<SolunarService>('SolunarService', [
      'calculateForToday',
      'calculateForDate',
      'calculateForDateString',
      'getSolunarRating',
      'calculateFishingScore',
    ]);
    mockSolunarService.calculateForToday.and.returnValue(defaultData);
    mockSolunarService.calculateForDateString.and.callFake((dateUtc: string) =>
      makeSolunarData({ dateUtc })
    );

    mockWeatherService = jasmine.createSpyObj<WeatherService>('WeatherService', ['getTimezone']);
    mockWeatherService.getTimezone.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [SolunarDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: ActiveLocationService, useValue: mockActiveService },
        { provide: SolunarService, useValue: mockSolunarService },
        { provide: WeatherService, useValue: mockWeatherService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SolunarDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setGeoState(state: GeolocationState): void {
    const pos = state.status === 'granted' ? state.position : null;
    coordsSignal.set(
      pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude, name: null } : null,
    );
    statusSignal.set(state.status);
    isLocatingSignal.set(state.status === 'idle' || state.status === 'requesting');
    hasErrorSignal.set(
      state.status === 'denied' || state.status === 'unavailable' || state.status === 'error',
    );
    fixture.detectChanges();
  }

  // ─── Group 1: Component creation ────────────────────────────────────────────

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('renders back link to home', () => {
      const link = fixture.debugElement.query(By.css('a[routerLink="/"]'));
      expect(link).toBeTruthy();
    });
  });

  // ─── Group 2: Geolocation states ────────────────────────────────────────────

  describe('Geolocation state: idle', () => {
    it('isIdle() returns true when status is idle', () => {
      expect(component.isIdle()).toBeTrue();
    });

    it('isLocating() returns true when status is idle', () => {
      expect(component.isLocating()).toBeTrue();
    });

    it('hasError() returns false when status is idle', () => {
      expect(component.hasError()).toBeFalse();
    });

    it('shows location prompt when idle', () => {
      const el = fixture.debugElement.query(By.css('.solunar-detail__state-card'));
      expect(el).toBeTruthy();
    });

    it('does not render hero section when idle', () => {
      const hero = fixture.debugElement.query(By.css('.solunar-detail__hero'));
      expect(hero).toBeNull();
    });
  });

  describe('Geolocation state: requesting', () => {
    beforeEach(() => {
      setGeoState({ status: 'requesting', position: null, error: null });
    });

    it('isIdle() returns false when requesting', () => {
      expect(component.isIdle()).toBeFalse();
    });

    it('isLocating() returns true when requesting', () => {
      expect(component.isLocating()).toBeTrue();
    });

    it('shows state card when requesting', () => {
      const el = fixture.debugElement.query(By.css('.solunar-detail__state-card'));
      expect(el).toBeTruthy();
    });

    it('does not render hero section when requesting', () => {
      const hero = fixture.debugElement.query(By.css('.solunar-detail__hero'));
      expect(hero).toBeNull();
    });
  });

  describe('Geolocation state: denied', () => {
    beforeEach(() => {
      setGeoState({ status: 'denied', position: null, error: null });
    });

    it('hasError() returns true when denied', () => {
      expect(component.hasError()).toBeTrue();
    });

    it('isLocating() returns false when denied', () => {
      expect(component.isLocating()).toBeFalse();
    });

    it('shows error state card when denied', () => {
      const el = fixture.debugElement.query(By.css('.solunar-detail__state-card'));
      expect(el).toBeTruthy();
    });

    it('does not render hero section when denied', () => {
      const hero = fixture.debugElement.query(By.css('.solunar-detail__hero'));
      expect(hero).toBeNull();
    });
  });

  describe('Geolocation state: unavailable', () => {
    beforeEach(() => {
      setGeoState({ status: 'unavailable', position: null, error: null });
    });

    it('hasError() returns true when unavailable', () => {
      expect(component.hasError()).toBeTrue();
    });
  });

  describe('Geolocation state: error', () => {
    beforeEach(() => {
      setGeoState({ status: 'error', position: null, error: null });
    });

    it('hasError() returns true when error', () => {
      expect(component.hasError()).toBeTrue();
    });
  });

  // ─── Group 3: solunarData computed ──────────────────────────────────────────

  describe('solunarData computed', () => {
    it('returns null when not granted', () => {
      expect(component.solunarData()).toBeNull();
    });

    it('returns SolunarData when granted', () => {
      setGeoState(makeGrantedState());
      expect(component.solunarData()).not.toBeNull();
      expect(mockSolunarService.calculateForToday).toHaveBeenCalledWith(40.7128, -74.006);
    });

    it('passes correct lat/lng from geolocation', () => {
      setGeoState(makeGrantedState(51.5074, -0.1278));
      expect(mockSolunarService.calculateForToday).toHaveBeenCalledWith(51.5074, -0.1278);
    });
  });

  // ─── Group 4: ratingStars computed ──────────────────────────────────────────

  describe('ratingStars computed', () => {
    it('returns empty string when no data', () => {
      expect(component.ratingStars()).toBe('');
    });

    it('returns 4 filled stars for rating 4', () => {
      setGeoState(makeGrantedState());
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 4 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.ratingStars()).toBe('★★★★');
    });

    it('returns 3 filled + 1 empty for rating 3', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 3 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.ratingStars()).toBe('★★★☆');
    });

    it('returns 1 filled + 3 empty for rating 1', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 1 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.ratingStars()).toBe('★☆☆☆');
    });
  });

  // ─── Group 5: scoreTierClass computed ───────────────────────────────────────

  describe('scoreTierClass computed', () => {
    it('returns "poor" when no data', () => {
      expect(component.scoreTierClass()).toBe('poor');
    });

    it('returns "good" for score >= 75', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ fishingScoreContribution: 90 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('good');
    });

    it('returns "good" for score exactly 75', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ fishingScoreContribution: 75 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('good');
    });

    it('returns "fair" for score 50-74', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ fishingScoreContribution: 70 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('returns "fair" for score exactly 50', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ fishingScoreContribution: 50 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('returns "poor" for score < 50', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ fishingScoreContribution: 40 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('poor');
    });
  });

  // ─── Group 6: advice computed ────────────────────────────────────────────────

  describe('advice computed', () => {
    it('returns empty string when no data', () => {
      expect(component.advice()).toBe('');
    });

    it('returns non-empty advice for rating 4', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 4 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.advice()).toContain('Peak solunar');
    });

    it('returns non-empty advice for rating 3', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 3 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.advice().length).toBeGreaterThan(0);
    });

    it('returns non-empty advice for rating 2', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 2 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.advice().length).toBeGreaterThan(0);
    });

    it('returns non-empty advice for rating 1', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ rating: 1 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.advice().length).toBeGreaterThan(0);
    });
  });

  // ─── Group 7: formatTime ─────────────────────────────────────────────────────

  describe('formatTime', () => {
    // formatTime now delegates to PreferencesService; default is 12h format
    it('formats 14:32 UTC as 2:32 PM in default 12h mode', () => {
      expect(component.formatTime('2026-04-05T14:32:00.000Z')).toBe('2:32 PM');
    });

    it('formats 02:05 UTC as 2:05 AM in default 12h mode', () => {
      expect(component.formatTime('2026-04-05T02:05:00.000Z')).toBe('2:05 AM');
    });

    it('formats 10:03 UTC as 10:03 AM in default 12h mode', () => {
      expect(component.formatTime('2026-04-05T10:03:00.000Z')).toBe('10:03 AM');
    });

    it('formats midnight as 12:00 AM in default 12h mode', () => {
      expect(component.formatTime('2026-04-05T00:00:00.000Z')).toBe('12:00 AM');
    });
  });

  // ─── Group 8: forecastRatingStars ────────────────────────────────────────────

  describe('forecastRatingStars', () => {
    it('returns 4 stars for rating 4', () => {
      expect(component.forecastRatingStars(4)).toBe('★★★★');
    });

    it('returns 1 star + 3 empty for rating 1', () => {
      expect(component.forecastRatingStars(1)).toBe('★☆☆☆');
    });

    it('returns 2 stars + 2 empty for rating 2', () => {
      expect(component.forecastRatingStars(2)).toBe('★★☆☆');
    });
  });

  // ─── Group 9: periodAriaLabel ─────────────────────────────────────────────────

  describe('periodAriaLabel', () => {
    it('returns label containing description and time', () => {
      const period = makePeriod({
        description: 'Moon Overhead',
        startUtc: '2026-04-05T13:32:00.000Z',
        endUtc: '2026-04-05T15:32:00.000Z',
      });
      const label = component.periodAriaLabel(period);
      expect(label).toContain('Moon Overhead');
      // formatTime uses PreferencesService; default is 12h — 13:32 UTC → 1:32 PM, 15:32 UTC → 3:32 PM
      expect(label).toContain('1:32 PM');
      expect(label).toContain('3:32 PM');
    });
  });

  // ─── Group 10: isPolar computed ──────────────────────────────────────────────

  describe('isPolar computed', () => {
    it('returns false when moonriseUtc is not null', () => {
      setGeoState(makeGrantedState());
      expect(component.isPolar()).toBeFalse();
    });

    it('returns true when moonriseUtc is null', () => {
      mockSolunarService.calculateForToday.and.returnValue(
        makeSolunarData({ moonriseUtc: null, moonsetUtc: null, periods: [
          makePeriod({ index: 1 }),
          makePeriod({ index: 2, description: 'Moon Underfoot' }),
        ]})
      );
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.isPolar()).toBeTrue();
    });
  });

  // ─── Group 11: scorePercent computed ─────────────────────────────────────────

  describe('scorePercent computed', () => {
    it('returns "0%" when no data', () => {
      expect(component.scorePercent()).toBe('0%');
    });

    it('returns correct percentage string when data is available', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ fishingScoreContribution: 90 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.scorePercent()).toBe('90%');
    });
  });

  // ─── Group 12: forecastDays computed ─────────────────────────────────────────

  describe('forecastDays computed', () => {
    it('returns empty array when not granted', () => {
      expect(component.forecastDays()).toEqual([]);
    });

    it('returns 7 items when granted', () => {
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(component.forecastDays().length).toBe(7);
    });

    it('calls calculateForDateString for each of 7 days', () => {
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      expect(mockSolunarService.calculateForDateString).toHaveBeenCalledTimes(7);
    });

    it('passes correct lat/lng to calculateForDateString', () => {
      setGeoState(makeGrantedState(51.5, -0.12));
      fixture.detectChanges();
      const calls = mockSolunarService.calculateForDateString.calls.allArgs();
      calls.forEach(args => {
        expect(args[1]).toBe(51.5);
        expect(args[2]).toBe(-0.12);
      });
    });

    it('each forecast day has a dateUtc string', () => {
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      component.forecastDays().forEach(day => {
        expect(day.dateUtc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  // ─── Group 13: DOM — hero section ────────────────────────────────────────────

  describe('DOM — hero section (location granted)', () => {
    beforeEach(() => {
      setGeoState(makeGrantedState());
    });

    it('renders h1 "Solunar Table"', () => {
      const h1 = fixture.debugElement.query(By.css('h1'));
      expect(h1.nativeElement.textContent).toContain('Solunar Table');
    });

    it('renders today date', () => {
      const dateEl = fixture.debugElement.query(By.css('.solunar-detail__hero-date'));
      expect(dateEl.nativeElement.textContent).toContain('2026-04-05');
    });

    it('renders rating stars element', () => {
      const stars = fixture.debugElement.query(By.css('.solunar-detail__rating-stars'));
      expect(stars).toBeTruthy();
    });

    it('renders score bar track with role="meter"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter).toBeTruthy();
    });

    it('score bar has correct aria-valuenow', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter.attributes['aria-valuenow']).toBe('100');
    });

    it('score bar has aria-valuemin="0" and aria-valuemax="100"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter.attributes['aria-valuemin']).toBe('0');
      expect(meter.attributes['aria-valuemax']).toBe('100');
    });

    it('state card is not shown when data is available', () => {
      const stateCard = fixture.debugElement.query(By.css('.solunar-detail__state-card'));
      expect(stateCard).toBeNull();
    });
  });

  // ─── Group 14: DOM — stats grid ──────────────────────────────────────────────

  describe('DOM — stats grid (location granted)', () => {
    beforeEach(() => {
      setGeoState(makeGrantedState());
    });

    it('renders exactly 4 stat cells', () => {
      const stats = fixture.debugElement.queryAll(By.css('.solunar-detail__stat'));
      expect(stats.length).toBe(4);
    });

    it('stat cells have aria-labels', () => {
      const stats = fixture.debugElement.queryAll(By.css('.solunar-detail__stat'));
      stats.forEach(stat => {
        expect(stat.attributes['aria-label']).toBeTruthy();
      });
    });
  });

  // ─── Group 15: DOM — periods list ────────────────────────────────────────────

  describe('DOM — periods list (location granted)', () => {
    beforeEach(() => {
      setGeoState(makeGrantedState());
    });

    it('renders 4 period rows for non-polar location', () => {
      const periods = fixture.debugElement.queryAll(By.css('.solunar-detail__period'));
      expect(periods.length).toBe(4);
    });

    it('periods have aria-labels', () => {
      const periods = fixture.debugElement.queryAll(By.css('.solunar-detail__period'));
      periods.forEach(p => {
        expect(p.attributes['aria-label']).toBeTruthy();
      });
    });

    it('does not show polar note for non-polar location', () => {
      const note = fixture.debugElement.query(By.css('.solunar-detail__polar-note'));
      expect(note).toBeNull();
    });

    it('shows polar note when moonriseUtc is null', () => {
      mockSolunarService.calculateForToday.and.returnValue(
        makeSolunarData({ moonriseUtc: null, moonsetUtc: null, periods: [
          makePeriod({ index: 1 }),
          makePeriod({ index: 2, description: 'Moon Underfoot' }),
        ]})
      );
      setGeoState(makeGrantedState(70, 25));
      fixture.detectChanges();
      const note = fixture.debugElement.query(By.css('.solunar-detail__polar-note'));
      expect(note).toBeTruthy();
    });
  });

  // ─── Group 16: DOM — advice section ──────────────────────────────────────────

  describe('DOM — advice section (location granted)', () => {
    beforeEach(() => {
      setGeoState(makeGrantedState());
    });

    it('renders advice text element', () => {
      const advice = fixture.debugElement.query(By.css('.solunar-detail__advice'));
      expect(advice).toBeTruthy();
    });

    it('advice text is non-empty', () => {
      const advice = fixture.debugElement.query(By.css('.solunar-detail__advice'));
      expect(advice.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    });
  });

  // ─── Group 17: DOM — forecast section ────────────────────────────────────────

  describe('DOM — forecast section (location granted)', () => {
    beforeEach(() => {
      setGeoState(makeGrantedState());
    });

    it('renders exactly 7 forecast cards', () => {
      const cards = fixture.debugElement.queryAll(By.css('.solunar-detail__forecast-card'));
      expect(cards.length).toBe(7);
    });

    it('first forecast card has today modifier', () => {
      const first = fixture.debugElement.query(By.css('.solunar-detail__forecast-card--today'));
      expect(first).toBeTruthy();
    });

    it('first forecast card has aria-current="date"', () => {
      const first = fixture.debugElement.query(By.css('.solunar-detail__forecast-card--today'));
      expect(first.attributes['aria-current']).toBe('date');
    });

    it('non-today cards do not have aria-current', () => {
      const cards = fixture.debugElement.queryAll(By.css('.solunar-detail__forecast-card'));
      // cards[0] is today; rest should not have aria-current
      for (let i = 1; i < cards.length; i++) {
        expect(cards[i].attributes['aria-current']).toBeFalsy();
      }
    });

    it('each forecast card shows a date', () => {
      const dates = fixture.debugElement.queryAll(By.css('.solunar-detail__forecast-date'));
      expect(dates.length).toBe(7);
    });

    it('each forecast card shows rating stars', () => {
      const ratings = fixture.debugElement.queryAll(By.css('.solunar-detail__forecast-rating'));
      expect(ratings.length).toBe(7);
    });

    it('each forecast card shows a score', () => {
      const scores = fixture.debugElement.queryAll(By.css('.solunar-detail__forecast-score'));
      expect(scores.length).toBe(7);
    });

    it('forecast list has aria-label', () => {
      const list = fixture.debugElement.query(By.css('ol[aria-label]'));
      expect(list).toBeTruthy();
    });
  });

  // ─── Group 18: DOM — back link ────────────────────────────────────────────────

  describe('DOM — back link', () => {
    it('renders back link with aria-label', () => {
      const link = fixture.debugElement.query(By.css('.solunar-detail__back-link'));
      expect(link).toBeTruthy();
      expect(link.attributes['aria-label']).toBeTruthy();
    });

    it('back link has routerLink="/"', () => {
      const link = fixture.debugElement.query(By.css('a[routerLink="/"]'));
      expect(link).toBeTruthy();
    });

    it('back link contains back arrow text', () => {
      const link = fixture.debugElement.query(By.css('.solunar-detail__back-link'));
      expect(link.nativeElement.textContent).toContain('←');
    });
  });

  // ─── Group 19: Feature 19 — formatTime delegates to formatTimeForLongitude ──

  describe('Feature 19 — formatTime uses longitude offset', () => {
    // defaultData has longitude: -74.006
    // offset = -74.006 / 15 ≈ -5h
    // The component must call formatTimeForLongitude(isoString, longitude)
    // so results include a UTC offset label

    beforeEach(() => {
      setGeoState(makeGrantedState());
    });

    it('formatTime result includes a UTC offset label when longitude is available', () => {
      const result = component.formatTime('2026-04-05T14:32:00.000Z');
      expect(result).toMatch(/UTC[+\-\u2212]\d/);
    });

    it('formatTime result does NOT return bare time without offset label', () => {
      const result = component.formatTime('2026-04-05T14:32:00.000Z');
      expect(result).not.toBe('2:32 PM');
    });

    it('formatTime applies negative offset for western longitude (-74.006)', () => {
      // longitude -74.006 → offset = -4h56m (LMT) → 14:32 UTC becomes 09:36 local
      const result = component.formatTime('2026-04-05T14:32:00.000Z');
      expect(result).toMatch(/UTC[\u2212\-]4:56/);
    });

    it('formatTime applies correct offset for eastern longitude (+30)', () => {
      mockSolunarService.calculateForToday.and.returnValue(makeSolunarData({ longitude: 30 }));
      setGeoState(makeGrantedState());
      fixture.detectChanges();
      // longitude 30 → offset +2h → 14:32 UTC = 16:32 local
      const result = component.formatTime('2026-04-05T14:32:00.000Z');
      expect(result).toContain('UTC+2');
    });

    it('formatTime does not throw when solunarData is null', () => {
      setGeoState({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      expect(() => component.formatTime('2026-04-05T14:32:00.000Z')).not.toThrow();
    });

    it('periodAriaLabel includes UTC offset label after feature 19', () => {
      const period = makePeriod({
        description: 'Moon Overhead',
        startUtc: '2026-04-05T14:32:00.000Z',
        endUtc: '2026-04-05T16:32:00.000Z',
      });
      const label = component.periodAriaLabel(period);
      expect(label).toMatch(/UTC[\u2212\-+]\d/);
    });

    it('formatTime uses IANA timezone from WeatherService when available', () => {
      mockWeatherService.getTimezone.and.returnValue('America/New_York');
      setGeoState(makeGrantedState());
      // 14:32 UTC in America/New_York (UTC-4 during DST or UTC-5 in winter)
      const result = component.formatTime('2026-04-05T14:32:00.000Z');
      expect(result).toMatch(/UTC[-\u2212+]\d/);
      expect(result).not.toMatch(/UTC[-\u2212]\d:\d{2}/); // no fractional LMT offset
    });
  });
});
