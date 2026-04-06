import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { WeatherDetailsComponent } from './weather-details.component';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { WeatherService, WeatherData, WeatherCondition } from './weather.service';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temperatureCelsius: 22,
    apparentTemperatureCelsius: 20,
    windSpeedKmh: 12,
    windGustKmh: 18,
    cloudCoverPercent: 15,
    precipitationMm: 0,
    weatherCode: WeatherCondition.ClearSky,
    barometricPressureHpa: 1018,
    pressureTrend: 'steady',
    fishingScoreContribution: 82,
    fetchedAtUtc: '2026-04-06T10:00:00.000Z',
    dateUtc: '2026-04-06',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
    ...overrides,
  };
}

function makeGrantedState(latitude = 40.7128, longitude = -74.006): GeolocationState {
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

describe('WeatherDetailsComponent', () => {
  let fixture: ComponentFixture<WeatherDetailsComponent>;
  let component: WeatherDetailsComponent;
  let stateSignal: ReturnType<typeof signal<GeolocationState>>;
  let mockWeatherService: jasmine.SpyObj<WeatherService>;

  const defaultData = makeWeatherData();

  beforeEach(async () => {
    stateSignal = signal<GeolocationState>({ status: 'idle', position: null, error: null });

    mockWeatherService = jasmine.createSpyObj<WeatherService>('WeatherService', [
      'getWeatherForLocation',
      'getScoreBreakdown',
    ]);
    mockWeatherService.getWeatherForLocation.and.returnValue(of(defaultData));
    mockWeatherService.getScoreBreakdown.and.returnValue({
      pressure: 36,
      wind: 28,
      cloud: 14,
      precipitation: 10,
    });

    await TestBed.configureTestingModule({
      imports: [WeatherDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: GeolocationService,
          useValue: { state: stateSignal },
        },
        { provide: WeatherService, useValue: mockWeatherService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Idle state ───────────────────────────────────────────────────────────────

  describe('idle state', () => {
    it('shows location prompt when geolocation is idle', () => {
      const prompt = fixture.debugElement.query(By.css('.weather-detail__state-card'));
      expect(prompt).toBeTruthy();
      expect(prompt.nativeElement.textContent).toContain('Share your location');
    });

    it('does not render the hero section when idle', () => {
      const hero = fixture.debugElement.query(By.css('.weather-detail__hero'));
      expect(hero).toBeNull();
    });

    it('isIdle() returns true', () => {
      expect(component.isIdle()).toBeTrue();
    });
  });

  // ── Requesting state ─────────────────────────────────────────────────────────

  describe('requesting state', () => {
    beforeEach(() => {
      stateSignal.set({ status: 'requesting', position: null, error: null });
      fixture.detectChanges();
    });

    it('shows skeleton loading state', () => {
      const stateCard = fixture.debugElement.query(By.css('.weather-detail__state-card'));
      expect(stateCard).toBeTruthy();
      const skeleton = fixture.debugElement.query(By.css('.weather-detail__skeleton-line'));
      expect(skeleton).toBeTruthy();
    });

    it('sets aria-busy on the loading state card', () => {
      const stateCard = fixture.debugElement.query(By.css('.weather-detail__state-card'));
      expect(stateCard.nativeElement.getAttribute('aria-busy')).toBe('true');
    });

    it('does not render hero when requesting', () => {
      const hero = fixture.debugElement.query(By.css('.weather-detail__hero'));
      expect(hero).toBeNull();
    });

    it('isLocating() returns true', () => {
      expect(component.isLocating()).toBeTrue();
    });
  });

  // ── Error states ─────────────────────────────────────────────────────────────

  describe('denied state', () => {
    beforeEach(() => {
      stateSignal.set({
        status: 'denied',
        position: null,
        error: null,
      });
      fixture.detectChanges();
    });

    it('shows error message', () => {
      const errorCard = fixture.debugElement.query(By.css('.weather-detail__state-card--error'));
      expect(errorCard).toBeTruthy();
      expect(errorCard.nativeElement.textContent).toContain('Location unavailable');
    });

    it('does not render hero', () => {
      const hero = fixture.debugElement.query(By.css('.weather-detail__hero'));
      expect(hero).toBeNull();
    });

    it('hasError() returns true', () => {
      expect(component.hasError()).toBeTrue();
    });
  });

  describe('unavailable state', () => {
    beforeEach(() => {
      stateSignal.set({ status: 'unavailable', position: null, error: null });
      fixture.detectChanges();
    });

    it('shows error state card', () => {
      const errorCard = fixture.debugElement.query(By.css('.weather-detail__state-card--error'));
      expect(errorCard).toBeTruthy();
    });
  });

  describe('HTTP error (weather returns null)', () => {
    beforeEach(() => {
      mockWeatherService.getWeatherForLocation.and.returnValue(of(null));
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
    });

    it('shows error state when weather fetch returns null', () => {
      const errorCard = fixture.debugElement.query(By.css('.weather-detail__state-card--error'));
      expect(errorCard).toBeTruthy();
    });

    it('hasError() returns true', () => {
      expect(component.hasError()).toBeTrue();
    });
  });

  // ── Data loaded state ─────────────────────────────────────────────────────────

  describe('granted state with data', () => {
    beforeEach(() => {
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
    });

    // Hero section
    describe('hero section', () => {
      it('renders the hero section', () => {
        const hero = fixture.debugElement.query(By.css('.weather-detail__hero'));
        expect(hero).toBeTruthy();
      });

      it('shows the weather condition h1', () => {
        const h1 = fixture.debugElement.query(By.css('.weather-detail__hero-title'));
        expect(h1).toBeTruthy();
        expect(h1.nativeElement.textContent.trim()).toBe('Clear Sky');
      });

      it('shows today\'s date', () => {
        const date = fixture.debugElement.query(By.css('.weather-detail__hero-date'));
        expect(date.nativeElement.textContent).toContain('2026-04-06');
      });

      it('shows temperature', () => {
        const temp = fixture.debugElement.query(By.css('.weather-detail__temp'));
        expect(temp.nativeElement.textContent).toContain('22');
      });

      it('shows feels-like temperature', () => {
        const feelsLike = fixture.debugElement.query(By.css('.weather-detail__feels-like'));
        expect(feelsLike.nativeElement.textContent).toContain('20');
      });

      it('shows weather emoji', () => {
        const emoji = fixture.debugElement.query(By.css('.weather-detail__hero-emoji'));
        expect(emoji).toBeTruthy();
        expect(emoji.nativeElement.getAttribute('aria-hidden')).toBe('true');
      });

      it('renders the score bar', () => {
        const track = fixture.debugElement.query(By.css('.score-bar__track'));
        expect(track).toBeTruthy();
      });

      it('score bar has meter role', () => {
        const track = fixture.debugElement.query(By.css('.score-bar__track'));
        expect(track.nativeElement.getAttribute('role')).toBe('meter');
      });

      it('score bar aria-valuenow matches fishing score', () => {
        const track = fixture.debugElement.query(By.css('.score-bar__track'));
        expect(track.nativeElement.getAttribute('aria-valuenow')).toBe('82');
      });

      it('score bar has aria-valuemin 0 and aria-valuemax 100', () => {
        const track = fixture.debugElement.query(By.css('.score-bar__track'));
        expect(track.nativeElement.getAttribute('aria-valuemin')).toBe('0');
        expect(track.nativeElement.getAttribute('aria-valuemax')).toBe('100');
      });
    });

    // Stats grid
    describe('stats grid', () => {
      it('renders 4 stat cells', () => {
        const stats = fixture.debugElement.queryAll(By.css('.weather-detail__stat'));
        expect(stats.length).toBe(4);
      });

      it('shows temperature stat', () => {
        const statValues = fixture.debugElement.queryAll(By.css('.weather-detail__stat-value'));
        const text = statValues.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('22');
      });

      it('shows wind speed stat', () => {
        const statValues = fixture.debugElement.queryAll(By.css('.weather-detail__stat-value'));
        const text = statValues.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('12');
      });

      it('shows pressure stat', () => {
        const statValues = fixture.debugElement.queryAll(By.css('.weather-detail__stat-value'));
        const text = statValues.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('1018');
      });

      it('shows cloud cover stat', () => {
        const statValues = fixture.debugElement.queryAll(By.css('.weather-detail__stat-value'));
        const text = statValues.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('15');
      });

      it('shows trend icon in stats', () => {
        const trendIcon = fixture.debugElement.query(By.css('.weather-detail__trend-icon'));
        expect(trendIcon).toBeTruthy();
      });
    });

    // Conditions card
    describe('conditions section', () => {
      it('renders conditions section', () => {
        const section = fixture.debugElement.query(By.css('.weather-detail__conditions-section'));
        expect(section).toBeTruthy();
      });

      it('shows feels-like row', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__condition-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Feels Like');
      });

      it('shows precipitation row', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__condition-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Precipitation');
      });

      it('shows wind gusts row', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__condition-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Wind Gusts');
      });

      it('shows pressure trend row', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__condition-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Pressure Trend');
      });

      it('does not show gust warning when gusts <= 30 km/h', () => {
        const warning = fixture.debugElement.query(By.css('.weather-detail__gust-warning'));
        expect(warning).toBeNull();
      });
    });

    describe('gust warning', () => {
      beforeEach(() => {
        mockWeatherService.getWeatherForLocation.and.returnValue(
          of(makeWeatherData({ windGustKmh: 45 }))
        );
        stateSignal.set({ status: 'idle', position: null, error: null });
        fixture.detectChanges();
        stateSignal.set(makeGrantedState());
        fixture.detectChanges();
      });

      it('shows gust warning icon when gusts > 30 km/h', () => {
        const warning = fixture.debugElement.query(By.css('.weather-detail__gust-warning'));
        expect(warning).toBeTruthy();
      });
    });

    // Score breakdown
    describe('fishing score breakdown', () => {
      it('renders impact section', () => {
        const section = fixture.debugElement.query(By.css('.weather-detail__impact-section'));
        expect(section).toBeTruthy();
      });

      it('renders 4 factor rows', () => {
        const rows = fixture.debugElement.queryAll(By.css('.weather-detail__impact-row'));
        expect(rows.length).toBe(4);
      });

      it('shows pressure factor label', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__impact-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Pressure');
      });

      it('shows wind factor label', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__impact-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Wind');
      });

      it('shows cloud cover factor label', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__impact-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Cloud Cover');
      });

      it('shows precipitation factor label', () => {
        const labels = fixture.debugElement.queryAll(By.css('.weather-detail__impact-label'));
        const text = labels.map(el => el.nativeElement.textContent).join(' ');
        expect(text).toContain('Precipitation');
      });

      it('renders mini-bar tracks for each factor', () => {
        const tracks = fixture.debugElement.queryAll(By.css('.weather-detail__impact-bar-track'));
        expect(tracks.length).toBe(4);
      });

      it('renders mini-bar fills for each factor', () => {
        const fills = fixture.debugElement.queryAll(By.css('.weather-detail__impact-bar-fill'));
        expect(fills.length).toBe(4);
      });

      it('factor rows have role="listitem"', () => {
        const rows = fixture.debugElement.queryAll(By.css('.weather-detail__impact-row'));
        rows.forEach(row => {
          expect(row.nativeElement.getAttribute('role')).toBe('listitem');
        });
      });

      it('factor rows have descriptive aria-label', () => {
        const rows = fixture.debugElement.queryAll(By.css('.weather-detail__impact-row'));
        expect(rows[0].nativeElement.getAttribute('aria-label')).toContain('Pressure');
      });

      it('impact list has role="list"', () => {
        const list = fixture.debugElement.query(By.css('.weather-detail__impact-list'));
        expect(list.nativeElement.getAttribute('role')).toBe('list');
      });
    });

    // Advice section
    describe('advice section', () => {
      it('renders advice section', () => {
        const section = fixture.debugElement.query(By.css('.weather-detail__advice-section'));
        expect(section).toBeTruthy();
      });

      it('shows good advice for high score (82)', () => {
        const advice = fixture.debugElement.query(By.css('.weather-detail__advice'));
        expect(advice.nativeElement.textContent).toContain('Excellent fishing conditions');
      });
    });

    describe('advice for poor score', () => {
      beforeEach(() => {
        mockWeatherService.getWeatherForLocation.and.returnValue(
          of(makeWeatherData({ fishingScoreContribution: 30 }))
        );
        stateSignal.set({ status: 'idle', position: null, error: null });
        fixture.detectChanges();
        stateSignal.set(makeGrantedState());
        fixture.detectChanges();
      });

      it('shows poor advice for low score', () => {
        const advice = fixture.debugElement.query(By.css('.weather-detail__advice'));
        expect(advice.nativeElement.textContent).toContain('Challenging weather conditions');
      });
    });

    describe('advice for fair score', () => {
      beforeEach(() => {
        mockWeatherService.getWeatherForLocation.and.returnValue(
          of(makeWeatherData({ fishingScoreContribution: 60 }))
        );
        stateSignal.set({ status: 'idle', position: null, error: null });
        fixture.detectChanges();
        stateSignal.set(makeGrantedState());
        fixture.detectChanges();
      });

      it('shows fair advice for medium score', () => {
        const advice = fixture.debugElement.query(By.css('.weather-detail__advice'));
        expect(advice.nativeElement.textContent).toContain('Decent conditions');
      });
    });

    // Back navigation
    describe('back navigation', () => {
      it('renders back link', () => {
        const backLink = fixture.debugElement.query(By.css('.weather-detail__back-link'));
        expect(backLink).toBeTruthy();
      });

      it('back link has aria-label', () => {
        const backLink = fixture.debugElement.query(By.css('.weather-detail__back-link'));
        expect(backLink.nativeElement.getAttribute('aria-label')).toBe('Back to Home');
      });

      it('back link points to /', () => {
        const backLink = fixture.debugElement.query(By.css('.weather-detail__back-link'));
        expect(backLink.nativeElement.getAttribute('href')).toBe('/');
      });

      it('back link text contains arrow', () => {
        const backLink = fixture.debugElement.query(By.css('.weather-detail__back-link'));
        expect(backLink.nativeElement.textContent).toContain('←');
      });
    });
  });

  // ── Computed signals ─────────────────────────────────────────────────────────

  describe('computed signals', () => {
    beforeEach(() => {
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
    });

    it('scoreTierClass() returns "good" for score >= 75', () => {
      expect(component.scoreTierClass()).toBe('good');
    });

    it('scoreTierClass() returns "fair" for score 50-74', () => {
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of(makeWeatherData({ fishingScoreContribution: 60 }))
      );
      stateSignal.set({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('scoreTierClass() returns "poor" for score < 50', () => {
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of(makeWeatherData({ fishingScoreContribution: 30 }))
      );
      stateSignal.set({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.scoreTierClass()).toBe('poor');
    });

    it('pressureTrendIcon() returns → for steady', () => {
      expect(component.pressureTrendIcon()).toBe('→');
    });

    it('pressureTrendIcon() returns ↑ for rising', () => {
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of(makeWeatherData({ pressureTrend: 'rising' }))
      );
      stateSignal.set({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.pressureTrendIcon()).toBe('↑');
    });

    it('pressureTrendIcon() returns ↓ for falling', () => {
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of(makeWeatherData({ pressureTrend: 'falling' }))
      );
      stateSignal.set({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.pressureTrendIcon()).toBe('↓');
    });

    it('pressureTrendLabel() returns "Steady" for steady', () => {
      expect(component.pressureTrendLabel()).toBe('Steady');
    });

    it('pressureTrendLabel() returns "Rising" for rising', () => {
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of(makeWeatherData({ pressureTrend: 'rising' }))
      );
      stateSignal.set({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.pressureTrendLabel()).toBe('Rising');
    });

    it('pressureTrendLabel() returns "Falling" for falling', () => {
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of(makeWeatherData({ pressureTrend: 'falling' }))
      );
      stateSignal.set({ status: 'idle', position: null, error: null });
      fixture.detectChanges();
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(component.pressureTrendLabel()).toBe('Falling');
    });

    it('scorePercent() reflects weather fishing score', () => {
      expect(component.scorePercent()).toBe('82%');
    });

    it('weatherEmoji() returns emoji for weather code', () => {
      expect(component.weatherEmoji()).toBe('☀️');
    });

    it('weatherDescription() returns description for weather code', () => {
      expect(component.weatherDescription()).toBe('Clear Sky');
    });

    it('hasData() is true when weather is loaded', () => {
      expect(component.hasData()).toBeTrue();
    });
  });

  // ── WeatherService integration ───────────────────────────────────────────────

  describe('WeatherService interaction', () => {
    it('calls getWeatherForLocation when location granted', () => {
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(mockWeatherService.getWeatherForLocation).toHaveBeenCalledWith(40.7128, -74.006);
    });

    it('calls getScoreBreakdown with weather data', () => {
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
      expect(mockWeatherService.getScoreBreakdown).toHaveBeenCalledWith(defaultData);
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────────

  describe('accessibility', () => {
    beforeEach(() => {
      stateSignal.set(makeGrantedState());
      fixture.detectChanges();
    });

    it('main element has class weather-detail', () => {
      const main = fixture.debugElement.query(By.css('main.weather-detail'));
      expect(main).toBeTruthy();
    });

    it('back link is inside a nav element', () => {
      const nav = fixture.debugElement.query(By.css('nav[aria-label="Page navigation"]'));
      expect(nav).toBeTruthy();
      const link = nav.query(By.css('.weather-detail__back-link'));
      expect(link).toBeTruthy();
    });

    it('hero section is labeled by h1 id', () => {
      const hero = fixture.debugElement.query(By.css('section[aria-labelledby="weather-hero-heading"]'));
      expect(hero).toBeTruthy();
    });

    it('stats section has visually-hidden heading', () => {
      const heading = fixture.debugElement.query(By.css('.weather-detail__visually-hidden'));
      expect(heading).toBeTruthy();
    });

    it('conditions section is labeled', () => {
      const section = fixture.debugElement.query(By.css('section[aria-labelledby="weather-conditions-heading"]'));
      expect(section).toBeTruthy();
    });

    it('impact section is labeled', () => {
      const section = fixture.debugElement.query(By.css('section[aria-labelledby="weather-impact-heading"]'));
      expect(section).toBeTruthy();
    });

    it('advice section is labeled', () => {
      const section = fixture.debugElement.query(By.css('section[aria-labelledby="weather-advice-heading"]'));
      expect(section).toBeTruthy();
    });
  });
});
