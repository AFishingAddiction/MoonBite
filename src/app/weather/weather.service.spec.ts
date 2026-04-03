import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  WeatherCondition,
  WeatherData,
  WeatherService,
  getWeatherDescription,
  getWeatherEmoji,
} from './weather.service';

// ─────────────────────────────────────────────────────────────────────────────
// Mock API response matching Open-Meteo structure
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_API_RESPONSE = {
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
  current: {
    time: '2026-04-03T14:30',
    temperature_2m: 12.5,
    apparent_temperature: 10.2,
    precipitation: 0.0,
    weather_code: 2,
    surface_pressure: 1013.25,
    cloud_cover: 45,
    wind_speed_10m: 18.5,
    wind_gusts_10m: 32.1,
  },
};

const LAT = 40.7128;
const LON = -74.006;
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WeatherService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  // ── Instantiation ─────────────────────────────────────────────────────────

  describe('instantiation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ── getWeatherForLocation() ───────────────────────────────────────────────

  describe('getWeatherForLocation()', () => {
    it('returns an Observable that emits WeatherData on success', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe((data) => {
        expect(data).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('maps API response fields to WeatherData correctly', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe((data) => {
        const d = data as WeatherData;
        expect(d.temperatureCelsius).toBe(12.5);
        expect(d.apparentTemperatureCelsius).toBe(10.2);
        expect(d.precipitationMm).toBe(0.0);
        expect(d.weatherCode).toBe(2);
        expect(d.barometricPressureHpa).toBe(1013.25);
        expect(d.cloudCoverPercent).toBe(45);
        expect(d.windSpeedKmh).toBe(18.5);
        expect(d.windGustKmh).toBe(32.1);
        expect(d.timezone).toBe('America/New_York');
        expect(d.latitude).toBe(40.7128);
        expect(d.longitude).toBe(-74.006);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('sets fetchedAtUtc to a valid ISO 8601 string', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe((data) => {
        const d = data as WeatherData;
        expect(d.fetchedAtUtc).toBeTruthy();
        expect(new Date(d.fetchedAtUtc).toISOString()).toBe(d.fetchedAtUtc);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('includes fishingScoreContribution in [0, 100]', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe((data) => {
        const d = data as WeatherData;
        expect(d.fishingScoreContribution).toBeGreaterThanOrEqual(0);
        expect(d.fishingScoreContribution).toBeLessThanOrEqual(100);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('includes a pressureTrend field', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe((data) => {
        const d = data as WeatherData;
        expect(['rising', 'falling', 'steady']).toContain(d.pressureTrend);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('sends request to Open-Meteo with correct query params', () => {
      service.getWeatherForLocation(LAT, LON).subscribe();

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      expect(req.request.params.get('latitude')).toBe(String(LAT));
      expect(req.request.params.get('longitude')).toBe(String(LON));
      expect(req.request.params.get('timezone')).toBe('auto');
      expect(req.request.params.get('current')).toContain('surface_pressure');
      req.flush(MOCK_API_RESPONSE);
    });

    it('emits null on HTTP error (graceful degradation)', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe((data) => {
        expect(data).toBeNull();
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
    });

    it('throws synchronously for latitude out of range (> 90)', () => {
      expect(() => service.getWeatherForLocation(91, LON)).toThrowError(/invalid coordinates/i);
    });

    it('throws synchronously for latitude out of range (< -90)', () => {
      expect(() => service.getWeatherForLocation(-91, LON)).toThrowError(/invalid coordinates/i);
    });

    it('throws synchronously for longitude out of range (> 180)', () => {
      expect(() => service.getWeatherForLocation(LAT, 181)).toThrowError(/invalid coordinates/i);
    });

    it('throws synchronously for longitude out of range (< -180)', () => {
      expect(() => service.getWeatherForLocation(LAT, -181)).toThrowError(/invalid coordinates/i);
    });
  });

  // ── Caching ───────────────────────────────────────────────────────────────

  describe('caching', () => {
    it('getCachedWeather() returns null when no data cached', () => {
      expect(service.getCachedWeather(LAT, LON)).toBeNull();
    });

    it('getCachedWeather() returns data after a successful fetch', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe(() => {
        const cached = service.getCachedWeather(LAT, LON);
        expect(cached).toBeTruthy();
        expect((cached as WeatherData).temperatureCelsius).toBe(12.5);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('second call within TTL returns cached data (no HTTP request)', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe(() => {
        service.getWeatherForLocation(LAT, LON).subscribe((data) => {
          expect(data).toBeTruthy();
          httpMock.expectNone((r) => r.url.startsWith(OPEN_METEO_BASE));
          done();
        });
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });

    it('clearCache() removes cached data', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe(() => {
        service.clearCache();
        expect(service.getCachedWeather(LAT, LON)).toBeNull();
        done();
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      req.flush(MOCK_API_RESPONSE);
    });
  });

  // ── refreshWeather() ──────────────────────────────────────────────────────

  describe('refreshWeather()', () => {
    it('makes a new HTTP request even when cache is valid', (done) => {
      service.getWeatherForLocation(LAT, LON).subscribe(() => {
        service.refreshWeather(LAT, LON).subscribe((data) => {
          expect(data).toBeTruthy();
          done();
        });

        const refreshReq = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
        refreshReq.flush(MOCK_API_RESPONSE);
      });

      const firstReq = httpMock.expectOne((r) => r.url.startsWith(OPEN_METEO_BASE));
      firstReq.flush(MOCK_API_RESPONSE);
    });
  });

  // ── calculatePressureTrend() ──────────────────────────────────────────────

  describe('calculatePressureTrend()', () => {
    it('returns "steady" when previousPressure is null', () => {
      expect(service.calculatePressureTrend(1013, null)).toBe('steady');
    });

    it('returns "steady" when pressure change is within ±2 hPa', () => {
      expect(service.calculatePressureTrend(1013, 1012)).toBe('steady');
      expect(service.calculatePressureTrend(1013, 1014)).toBe('steady');
    });

    it('returns "rising" when pressure increased by > 2 hPa', () => {
      expect(service.calculatePressureTrend(1016, 1013)).toBe('rising');
      expect(service.calculatePressureTrend(1020, 1010)).toBe('rising');
    });

    it('returns "falling" when pressure decreased by > 2 hPa', () => {
      expect(service.calculatePressureTrend(1010, 1013)).toBe('falling');
      expect(service.calculatePressureTrend(990, 1013)).toBe('falling');
    });

    it('boundary: +2 hPa is steady (threshold is exclusive)', () => {
      expect(service.calculatePressureTrend(1015, 1013)).toBe('steady');
    });

    it('boundary: -2 hPa is steady (threshold is exclusive)', () => {
      expect(service.calculatePressureTrend(1011, 1013)).toBe('steady');
    });
  });

  // ── calculateFishingScore() ───────────────────────────────────────────────

  describe('calculateFishingScore()', () => {
    it('returns a number in [0, 100]', () => {
      const score = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('ideal conditions (steady high pressure, calm wind, partly cloudy, no rain) score >= 80', () => {
      const score = service.calculateFishingScore({
        barometricPressureHpa: 1020,
        pressureTrend: 'steady',
        windSpeedKmh: 12,
        cloudCoverPercent: 35,
        precipitationMm: 0,
      });
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('poor conditions (falling pressure, strong wind, overcast, rain) score <= 30', () => {
      const score = service.calculateFishingScore({
        barometricPressureHpa: 990,
        pressureTrend: 'falling',
        windSpeedKmh: 32,
        cloudCoverPercent: 85,
        precipitationMm: 2,
      });
      expect(score).toBeLessThanOrEqual(30);
    });

    it('is deterministic (same inputs = same output)', () => {
      const input = {
        barometricPressureHpa: 1013,
        pressureTrend: 'steady' as const,
        windSpeedKmh: 20,
        cloudCoverPercent: 50,
        precipitationMm: 0,
      };
      expect(service.calculateFishingScore(input)).toBe(service.calculateFishingScore(input));
    });

    it('calm wind (0–5 km/h) gives max wind score (30 pts)', () => {
      const calm = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 3,
        cloudCoverPercent: 50,
        precipitationMm: 0,
      });
      const strong = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 35,
        cloudCoverPercent: 50,
        precipitationMm: 0,
      });
      expect(calm).toBeGreaterThan(strong);
    });

    it('heavy precipitation (> 5 mm) reduces score significantly', () => {
      const noRain = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      const heavyRain = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 6,
      });
      expect(noRain).toBeGreaterThan(heavyRain + 8);
    });

    it('partly cloudy (10–50%) scores higher than clear sky (0–10%)', () => {
      const partlyCloudy = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      const clearSky = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 5,
        precipitationMm: 0,
      });
      expect(partlyCloudy).toBeGreaterThan(clearSky);
    });

    it('steady pressure scores higher than falling pressure', () => {
      const steady = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      const falling = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'falling',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(steady).toBeGreaterThan(falling);
    });

    it('returns integer (no fractional scores)', () => {
      const score = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 18,
        cloudCoverPercent: 45,
        precipitationMm: 0,
      });
      expect(Number.isInteger(score)).toBeTrue();
    });

    it('returns 0 for worst possible conditions', () => {
      const score = service.calculateFishingScore({
        barometricPressureHpa: 980,
        pressureTrend: 'falling',
        windSpeedKmh: 50,
        cloudCoverPercent: 100,
        precipitationMm: 10,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('returns 100 for best possible conditions', () => {
      const score = service.calculateFishingScore({
        barometricPressureHpa: 1020,
        pressureTrend: 'steady',
        windSpeedKmh: 0,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(score).toBeLessThanOrEqual(100);
    });

    it('gale wind (> 40 km/h) gives minimum wind score', () => {
      const gale = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 50,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      const light = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 8,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(gale).toBeLessThan(light);
    });

    it('mostly cloudy (50–80%) scores less than partly cloudy', () => {
      const mostlyCloudy = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 65,
        precipitationMm: 0,
      });
      const partlyCloudy = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(mostlyCloudy).toBeLessThan(partlyCloudy);
    });

    it('trace precipitation (0–0.5 mm) scores less than no rain', () => {
      const trace = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0.3,
      });
      const none = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(trace).toBeLessThan(none);
    });

    it('light precipitation (0.5–2 mm) scores less than trace', () => {
      const light = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 1,
      });
      const trace = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0.3,
      });
      expect(light).toBeLessThan(trace);
    });

    it('moderate precipitation (2–5 mm) scores less than light', () => {
      const moderate = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 3,
      });
      const light = service.calculateFishingScore({
        barometricPressureHpa: 1013,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 1,
      });
      expect(moderate).toBeLessThan(light);
    });

    it('rising pressure scores lower than steady (fish acclimatise to stable conditions)', () => {
      const rising = service.calculateFishingScore({
        barometricPressureHpa: 1016,
        pressureTrend: 'rising',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      const steady = service.calculateFishingScore({
        barometricPressureHpa: 1016,
        pressureTrend: 'steady',
        windSpeedKmh: 10,
        cloudCoverPercent: 30,
        precipitationMm: 0,
      });
      expect(rising).toBeLessThan(steady);
    });
  });

  // ── getWeatherDescription() ───────────────────────────────────────────────

  describe('getWeatherDescription()', () => {
    it('returns "Clear Sky" for code 0', () => {
      expect(getWeatherDescription(WeatherCondition.ClearSky)).toBe('Clear Sky');
    });

    it('returns "Partly Cloudy" for code 2', () => {
      expect(getWeatherDescription(WeatherCondition.PartlyCloudy)).toBe('Partly Cloudy');
    });

    it('returns "Overcast" for code 3', () => {
      expect(getWeatherDescription(WeatherCondition.Overcast)).toBe('Overcast');
    });

    it('returns "Light Rain" for code 61', () => {
      expect(getWeatherDescription(WeatherCondition.RainLight)).toBe('Light Rain');
    });

    it('returns "Thunderstorm" for code 95', () => {
      expect(getWeatherDescription(WeatherCondition.Thunderstorm)).toBe('Thunderstorm');
    });

    it('returns "Unknown" for unrecognised WMO code', () => {
      expect(getWeatherDescription(99 as WeatherCondition)).toBe('Thunderstorm with Heavy Hail');
      // Cast to a bogus value to test the fallback
      expect(getWeatherDescription(999 as WeatherCondition)).toBe('Unknown');
    });
  });

  // ── getWeatherEmoji() ─────────────────────────────────────────────────────

  describe('getWeatherEmoji()', () => {
    it('returns ☀️ for ClearSky (0)', () => {
      expect(getWeatherEmoji(WeatherCondition.ClearSky)).toBe('☀️');
    });

    it('returns 🌤️ for MainlyClear (1)', () => {
      expect(getWeatherEmoji(WeatherCondition.MainlyClear)).toBe('🌤️');
    });

    it('returns ⛅ for PartlyCloudy (2)', () => {
      expect(getWeatherEmoji(WeatherCondition.PartlyCloudy)).toBe('⛅');
    });

    it('returns ☁️ for Overcast (3)', () => {
      expect(getWeatherEmoji(WeatherCondition.Overcast)).toBe('☁️');
    });

    it('returns 🌫️ for Fog (45)', () => {
      expect(getWeatherEmoji(WeatherCondition.Fog)).toBe('🌫️');
    });

    it('returns 🌫️ for DepositingRimeFog (48)', () => {
      expect(getWeatherEmoji(WeatherCondition.DepositingRimeFog)).toBe('🌫️');
    });

    it('returns 🌦️ for Drizzle codes (51–57)', () => {
      expect(getWeatherEmoji(WeatherCondition.DrizzleLight)).toBe('🌦️');
      expect(getWeatherEmoji(WeatherCondition.DrizzleDense)).toBe('🌦️');
    });

    it('returns 🌧️ for Rain codes (61–67)', () => {
      expect(getWeatherEmoji(WeatherCondition.RainLight)).toBe('🌧️');
      expect(getWeatherEmoji(WeatherCondition.RainHeavy)).toBe('🌧️');
    });

    it('returns ❄️ for Snow codes (71–77)', () => {
      expect(getWeatherEmoji(WeatherCondition.SnowLight)).toBe('❄️');
      expect(getWeatherEmoji(WeatherCondition.SnowGrains)).toBe('❄️');
    });

    it('returns 🌧️ for RainShowers (80–82)', () => {
      expect(getWeatherEmoji(WeatherCondition.RainShowersSlight)).toBe('🌧️');
      expect(getWeatherEmoji(WeatherCondition.RainShowersViolent)).toBe('🌧️');
    });

    it('returns 🌨️ for SnowShowers (85–86)', () => {
      expect(getWeatherEmoji(WeatherCondition.SnowShowersSlight)).toBe('🌨️');
      expect(getWeatherEmoji(WeatherCondition.SnowShowersHeavy)).toBe('🌨️');
    });

    it('returns ⛈️ for Thunderstorm (95+)', () => {
      expect(getWeatherEmoji(WeatherCondition.Thunderstorm)).toBe('⛈️');
      expect(getWeatherEmoji(WeatherCondition.ThunderstormWithHeavyHail)).toBe('⛈️');
    });
  });
});
