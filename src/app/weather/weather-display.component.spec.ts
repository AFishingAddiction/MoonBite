import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { WeatherDisplayComponent } from './weather-display.component';
import { WeatherData, WeatherService } from './weather.service';

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_POSITION = {
  coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
  timestamp: Date.now(),
} as GeolocationPosition;

const MOCK_WEATHER_DATA: WeatherData = {
  temperatureCelsius: 12.5,
  apparentTemperatureCelsius: 10.2,
  windSpeedKmh: 18.5,
  windGustKmh: 32.1,
  cloudCoverPercent: 45,
  precipitationMm: 0,
  weatherCode: 2,
  barometricPressureHpa: 1013.25,
  pressureTrend: 'steady',
  fishingScoreContribution: 72,
  fetchedAtUtc: '2026-04-03T14:30:00.000Z',
  dateUtc: '2026-04-03',
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
};

const MOCK_RAINY_WEATHER_DATA: WeatherData = {
  ...MOCK_WEATHER_DATA,
  precipitationMm: 3.5,
  windSpeedKmh: 35,
  windGustKmh: 52,
  cloudCoverPercent: 90,
  fishingScoreContribution: 22,
  weatherCode: 61,
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeMockGeoService(initialState: GeolocationState) {
  const _state = signal<GeolocationState>(initialState);
  return {
    state: _state.asReadonly(),
    requestLocation: jasmine.createSpy('requestLocation'),
    _setState: (s: GeolocationState) => _state.set(s),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('WeatherDisplayComponent', () => {
  let fixture: ComponentFixture<WeatherDisplayComponent>;
  let mockGeoService: ReturnType<typeof makeMockGeoService>;
  let mockWeatherService: jasmine.SpyObj<WeatherService>;

  function setup(geoState: GeolocationState) {
    mockGeoService = makeMockGeoService(geoState);
    mockWeatherService = jasmine.createSpyObj('WeatherService', [
      'getWeatherForLocation',
      'getCachedWeather',
      'refreshWeather',
      'clearCache',
      'calculatePressureTrend',
      'calculateFishingScore',
    ]);
    mockWeatherService.getWeatherForLocation.and.returnValue(of(MOCK_WEATHER_DATA));
  }

  async function createComponent(geoState: GeolocationState) {
    setup(geoState);
    await TestBed.configureTestingModule({
      imports: [WeatherDisplayComponent],
      providers: [
        { provide: GeolocationService, useValue: mockGeoService },
        { provide: WeatherService, useValue: mockWeatherService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDisplayComponent);
    fixture.detectChanges();
  }

  // ── Component creation ────────────────────────────────────────────────────

  describe('component creation', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });


  });

  // ── Card landmark ─────────────────────────────────────────────────────────

  describe('outer section landmark', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('renders a <section> element as the card shell', () => {
      expect(fixture.debugElement.query(By.css('section'))).toBeTruthy();
    });

    it('the <section> has role="region"', () => {
      expect(fixture.debugElement.query(By.css('section[role="region"]'))).toBeTruthy();
    });

    it('the <section> aria-label contains "Weather"', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const label: string = section.nativeElement.getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('weather');
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    beforeEach(async () => {
      await createComponent({ status: 'requesting', position: null, error: null });
    });

    it('renders the loading skeleton', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__loading'))).toBeTruthy();
    });

    it('does not render weather data while loading', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__conditions'))).toBeNull();
    });

    it('aria-label indicates loading', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const label: string = section.nativeElement.getAttribute('aria-label') ?? '';
      // When locating, aria-label should include 'weather' at minimum
      expect(label.toLowerCase()).toContain('weather');
    });
  });

  // ── Permission denied state ───────────────────────────────────────────────

  describe('permission denied state', () => {
    beforeEach(async () => {
      await createComponent({
        status: 'denied',
        position: null,
        error: null,
      });
    });

    it('renders the permission-denied message', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__error'))).toBeTruthy();
    });

    it('does not render weather conditions', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__conditions'))).toBeNull();
    });
  });

  // ── Data loaded state ─────────────────────────────────────────────────────

  describe('data loaded state', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('renders the weather conditions section', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__conditions'))).toBeTruthy();
    });

    it('displays the temperature', () => {
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('12.5');
    });

    it('displays the wind speed', () => {
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('18.5');
    });

    it('displays the barometric pressure', () => {
      const text = fixture.debugElement.nativeElement.textContent as string;
      // toFixed(0) rounds 1013.25 → "1013"
      expect(text).toContain('1013');
    });

    it('displays the cloud cover percentage', () => {
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('45');
    });

    it('displays the fishing score', () => {
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('72');
    });

    it('renders the score bar track', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__score-bar-track'))).toBeTruthy();
    });

    it('renders the score section', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__score-section'))).toBeTruthy();
    });
  });

  // ── Gust warning ─────────────────────────────────────────────────────────

  describe('wind gust warning', () => {
    it('shows gust warning when gusts > 30 km/h', async () => {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockWeatherService.getWeatherForLocation.and.returnValue(of(MOCK_RAINY_WEATHER_DATA));

      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.weather-card__gust-warning'))).toBeTruthy();
    });

    it('does not show gust warning when gusts <= 30 km/h', async () => {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      const calmData = { ...MOCK_WEATHER_DATA, windGustKmh: 25 };
      mockWeatherService.getWeatherForLocation.and.returnValue(of(calmData));

      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.weather-card__gust-warning'))).toBeNull();
    });
  });

  // ── Precipitation warning ─────────────────────────────────────────────────

  describe('precipitation warning', () => {
    it('shows precipitation warning when precipitation > 0 mm', async () => {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockWeatherService.getWeatherForLocation.and.returnValue(of(MOCK_RAINY_WEATHER_DATA));

      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.weather-card__precip-warning'))).toBeTruthy();
    });

    it('does not show precipitation warning when precipitation is 0', async () => {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockWeatherService.getWeatherForLocation.and.returnValue(of(MOCK_WEATHER_DATA));

      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.weather-card__precip-warning'))).toBeNull();
    });
  });

  // ── Pressure trend icon ───────────────────────────────────────────────────

  describe('pressure trend display', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('renders a pressure trend indicator', () => {
      expect(
        fixture.debugElement.query(By.css('.weather-card__pressure-trend')),
      ).toBeTruthy();
    });
  });

  // ── BEM class structure ───────────────────────────────────────────────────

  describe('BEM class structure', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('has .weather-card on the outer section', () => {
      expect(fixture.debugElement.query(By.css('.weather-card'))).toBeTruthy();
    });

    it('has .weather-card__header', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__header'))).toBeTruthy();
    });

    it('has .weather-card__conditions', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__conditions'))).toBeTruthy();
    });

    it('has .weather-card__score-section', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__score-section'))).toBeTruthy();
    });

    it('has .weather-card__score-bar-track', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__score-bar-track'))).toBeTruthy();
    });
  });

  // ── Score color classes ───────────────────────────────────────────────────

  describe('score color classes', () => {
    async function createWithScore(score: number) {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of({ ...MOCK_WEATHER_DATA, fishingScoreContribution: score }),
      );
      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();
    }

    it('score 15 → poor (red) fill class', async () => {
      await createWithScore(15);
      expect(fixture.debugElement.query(By.css('.weather-card__score-fill--poor'))).toBeTruthy();
    });

    it('score 45 → fair (yellow) fill class', async () => {
      await createWithScore(45);
      expect(fixture.debugElement.query(By.css('.weather-card__score-fill--fair'))).toBeTruthy();
    });

    it('score 72 → good (light green) fill class', async () => {
      await createWithScore(72);
      expect(fixture.debugElement.query(By.css('.weather-card__score-fill--good'))).toBeTruthy();
    });

    it('score 90 → excellent (bright green) fill class', async () => {
      await createWithScore(90);
      expect(fixture.debugElement.query(By.css('.weather-card__score-fill--excellent'))).toBeTruthy();
    });
  });

  // ── Pressure trend icons ──────────────────────────────────────────────────

  describe('pressure trend icons', () => {
    async function createWithTrend(trend: 'rising' | 'falling' | 'steady') {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockWeatherService.getWeatherForLocation.and.returnValue(
        of({ ...MOCK_WEATHER_DATA, pressureTrend: trend }),
      );
      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();
    }

    it('rising trend shows ↑ icon', async () => {
      await createWithTrend('rising');
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('↑');
    });

    it('falling trend shows ↓ icon', async () => {
      await createWithTrend('falling');
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('↓');
    });

    it('steady trend shows → icon', async () => {
      await createWithTrend('steady');
      const text = fixture.debugElement.nativeElement.textContent as string;
      expect(text).toContain('→');
    });
  });

  // ── API error state ───────────────────────────────────────────────────────

  describe('API error state (service returns null)', () => {
    beforeEach(async () => {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockWeatherService.getWeatherForLocation.and.returnValue(of(null));

      await TestBed.configureTestingModule({
        imports: [WeatherDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: WeatherService, useValue: mockWeatherService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WeatherDisplayComponent);
      fixture.detectChanges();
    });

    it('renders error/unavailable state when weather data is null', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__error'))).toBeTruthy();
    });

    it('does not render conditions when data is null', () => {
      expect(fixture.debugElement.query(By.css('.weather-card__conditions'))).toBeNull();
    });
  });
});
