import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { MoonPhaseData, MoonPhaseService } from '../moon-phase/moon-phase.service';
import { SolunarData, SolunarService } from '../solunar/solunar.service';
import { WeatherData, WeatherService } from '../weather/weather.service';
import { FishingScore, FishingScoreService } from './fishing-score.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWeatherData(fishingScoreContribution: number): WeatherData {
  return {
    temperatureCelsius: 20,
    apparentTemperatureCelsius: 20,
    windSpeedKmh: 10,
    windGustKmh: 15,
    cloudCoverPercent: 30,
    precipitationMm: 0,
    weatherCode: 0 as WeatherData['weatherCode'],
    barometricPressureHpa: 1013,
    pressureTrend: 'steady',
    fishingScoreContribution,
    fetchedAtUtc: '2024-06-01T12:00:00Z',
    dateUtc: '2024-06-01',
    latitude: 40,
    longitude: -74,
    timezone: 'America/New_York',
  };
}

function makeMoonPhaseData(fishingScoreContribution: number): MoonPhaseData {
  return {
    phaseIndex: 0,
    phaseName: 'New Moon',
    illuminationPercent: 0,
    moonAge: 0,
    phaseEmoji: '🌑',
    fishingScoreContribution,
    dateUtc: '2024-06-01',
  };
}

function makeSolunarData(fishingScoreContribution: number): SolunarData {
  return {
    periods: [],
    moonUpperTransitUtc: '2024-06-01T12:00:00Z',
    moonLowerTransitUtc: '2024-06-01T00:00:00Z',
    moonriseUtc: null,
    moonsetUtc: null,
    rating: 4,
    fishingScoreContribution,
    dateUtc: '2024-06-01',
    latitude: 40.7128,
    longitude: -74.006,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FishingScoreService', () => {
  let service: FishingScoreService;
  let moonPhaseService: jasmine.SpyObj<MoonPhaseService>;
  let solunarService: jasmine.SpyObj<SolunarService>;
  let weatherService: jasmine.SpyObj<WeatherService>;

  const LAT = 40.7128;
  const LNG = -74.006;
  const DATE_UTC = '2024-06-01';

  beforeEach(() => {
    moonPhaseService = jasmine.createSpyObj<MoonPhaseService>('MoonPhaseService', [
      'calculateForDateString',
    ]);
    solunarService = jasmine.createSpyObj<SolunarService>('SolunarService', [
      'calculateForDateString',
    ]);
    weatherService = jasmine.createSpyObj<WeatherService>('WeatherService', [
      'getWeatherForLocation',
    ]);

    TestBed.configureTestingModule({
      providers: [
        FishingScoreService,
        { provide: MoonPhaseService, useValue: moonPhaseService },
        { provide: SolunarService, useValue: solunarService },
        { provide: WeatherService, useValue: weatherService },
      ],
    });

    service = TestBed.inject(FishingScoreService);
  });

  // ── calculate() ─────────────────────────────────────────────────────────────

  describe('calculate()', () => {
    it('computes correct weighted composite with all three inputs', () => {
      // moon=80×0.30=24, solunar=90×0.35=31.5, weather=70×0.35=24.5 → 80
      const result = service.calculate(LAT, LNG, DATE_UTC, 80, 90, makeWeatherData(70));

      expect(result.score).toBe(80);
      expect(result.breakdown.moonPhaseScore).toBe(80);
      expect(result.breakdown.solunarScore).toBe(90);
      expect(result.breakdown.weatherScore).toBe(70);
      expect(result.breakdown.weatherAvailable).toBeTrue();
    });

    it('redistributes weather weight when weatherData is null', () => {
      // moon=60×(0.30/0.65)=27.69, solunar=80×(0.35/0.65)=43.08 → round(70.77)=71
      const result = service.calculate(LAT, LNG, DATE_UTC, 60, 80, null);

      expect(result.score).toBe(71);
      expect(result.breakdown.weatherAvailable).toBeFalse();
      expect(result.breakdown.weatherWeighted).toBe(0);
    });

    it('returns 0 when all inputs are 0', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 0, 0, makeWeatherData(0));
      expect(result.score).toBe(0);
    });

    it('returns 100 when all inputs are 100', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 100, 100, makeWeatherData(100));
      expect(result.score).toBe(100);
    });

    it('clamps score to [0, 100]', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 100, 100, makeWeatherData(100));
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('includes correct metadata in result', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 70, 70, makeWeatherData(70));
      expect(result.dateUtc).toBe(DATE_UTC);
      expect(result.latitude).toBe(LAT);
      expect(result.longitude).toBe(LNG);
    });

    it('includes default weights in result', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 50, 50, makeWeatherData(50));
      expect(result.weights.moonPhase).toBeCloseTo(0.3, 5);
      expect(result.weights.solunar).toBeCloseTo(0.35, 5);
      expect(result.weights.weather).toBeCloseTo(0.35, 5);
    });

    it('throws RangeError for invalid latitude', () => {
      expect(() => service.calculate(91, LNG, DATE_UTC, 50, 50, null)).toThrowError(RangeError);
      expect(() => service.calculate(-91, LNG, DATE_UTC, 50, 50, null)).toThrowError(RangeError);
    });

    it('throws RangeError for invalid longitude', () => {
      expect(() => service.calculate(LAT, 181, DATE_UTC, 50, 50, null)).toThrowError(RangeError);
      expect(() => service.calculate(LAT, -181, DATE_UTC, 50, 50, null)).toThrowError(RangeError);
    });

    it('rounds score to nearest integer', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 50, 50, makeWeatherData(51));
      expect(Number.isInteger(result.score)).toBeTrue();
    });

    it('calculates correct weighted components in breakdown', () => {
      const result = service.calculate(LAT, LNG, DATE_UTC, 80, 90, makeWeatherData(70));
      // moonPhaseWeighted = round(80 × 0.30) = 24
      expect(result.breakdown.moonPhaseWeighted).toBe(24);
      // solunarWeighted = round(90 × 0.35) = round(31.4999…) = 31 (IEEE 754)
      expect(result.breakdown.solunarWeighted).toBe(31);
      // weatherWeighted = round(70 × 0.35) = round(24.5000…) = 25 (V8 IEEE 754)
      expect(result.breakdown.weatherWeighted).toBe(25);
    });
  });

  // ── getScore() ───────────────────────────────────────────────────────────────

  describe('getScore()', () => {
    beforeEach(() => {
      moonPhaseService.calculateForDateString.and.returnValue(makeMoonPhaseData(80));
      solunarService.calculateForDateString.and.returnValue(makeSolunarData(90));
      weatherService.getWeatherForLocation.and.returnValue(of(makeWeatherData(70)));
    });

    it('emits a FishingScore when all services return data', (done) => {
      service.getScore(LAT, LNG, DATE_UTC).subscribe({
        next: (score: FishingScore | null) => {
          expect(score).not.toBeNull();
          expect(score!.score).toBe(80);
          done();
        },
      });
    });

    it('emits a FishingScore with weatherAvailable=false when weather returns null', (done) => {
      weatherService.getWeatherForLocation.and.returnValue(of(null));

      service.getScore(LAT, LNG, DATE_UTC).subscribe({
        next: (score: FishingScore | null) => {
          expect(score).not.toBeNull();
          expect(score!.breakdown.weatherAvailable).toBeFalse();
          done();
        },
      });
    });

    it('emits null when an error occurs', (done) => {
      weatherService.getWeatherForLocation.and.returnValue(
        throwError(() => new Error('Network error')),
      );

      service.getScore(LAT, LNG, DATE_UTC).subscribe({
        next: (score: FishingScore | null) => {
          expect(score).toBeNull();
          done();
        },
      });
    });

    it('calls moon phase service with correct date', (done) => {
      service.getScore(LAT, LNG, DATE_UTC).subscribe(() => {
        expect(moonPhaseService.calculateForDateString).toHaveBeenCalledWith(DATE_UTC);
        done();
      });
    });

    it('calls solunar service with correct parameters', (done) => {
      service.getScore(LAT, LNG, DATE_UTC).subscribe(() => {
        expect(solunarService.calculateForDateString).toHaveBeenCalledWith(DATE_UTC, LAT, LNG);
        done();
      });
    });

    it('calls weather service with correct coordinates', (done) => {
      service.getScore(LAT, LNG, DATE_UTC).subscribe(() => {
        expect(weatherService.getWeatherForLocation).toHaveBeenCalledWith(LAT, LNG);
        done();
      });
    });
  });
});
