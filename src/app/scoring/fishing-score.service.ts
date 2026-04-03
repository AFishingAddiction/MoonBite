import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { MoonPhaseService } from '../moon-phase/moon-phase.service';
import { SolunarService } from '../solunar/solunar.service';
import { WeatherData, WeatherService } from '../weather/weather.service';

// ─── Models ───────────────────────────────────────────────────────────────────

/** Weighting applied to each input factor (must sum to 1.0). */
export interface ScoringWeights {
  moonPhase: number;
  solunar: number;
  weather: number;
}

/** Per-factor breakdown returned alongside the composite score. */
export interface ScoreBreakdown {
  /** Raw 0–100 contribution from MoonPhaseService. */
  moonPhaseScore: number;
  /** Raw 0–100 contribution from SolunarService. */
  solunarScore: number;
  /** Raw 0–100 contribution from WeatherService (0 when unavailable). */
  weatherScore: number;
  /** moonPhaseScore × effective weight, rounded. */
  moonPhaseWeighted: number;
  /** solunarScore × effective weight, rounded. */
  solunarWeighted: number;
  /** weatherScore × effective weight (0 when unavailable), rounded. */
  weatherWeighted: number;
  /** False when WeatherService returned null and its weight was redistributed. */
  weatherAvailable: boolean;
}

/** The primary output of FishingScoreService. */
export interface FishingScore {
  /** Composite fishing score 0–100 (rounded integer). */
  score: number;
  /** How each factor contributed. */
  breakdown: ScoreBreakdown;
  /** Weights used for this calculation. */
  weights: ScoringWeights;
  /** UTC date string (YYYY-MM-DD) the score was calculated for. */
  dateUtc: string;
  /** Latitude used for location-dependent calculations. */
  latitude: number;
  /** Longitude used for location-dependent calculations. */
  longitude: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: ScoringWeights = {
  moonPhase: 0.3,
  solunar: 0.35,
  weather: 0.35,
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FishingScoreService {
  private readonly moonPhaseService = inject(MoonPhaseService);
  private readonly solunarService = inject(SolunarService);
  private readonly weatherService = inject(WeatherService);

  /**
   * Calculate composite fishing score for a given location and date.
   *
   * @param latitude  Decimal degrees (−90 to 90)
   * @param longitude Decimal degrees (−180 to 180)
   * @param dateUtc   ISO date string YYYY-MM-DD
   * @param moonPhaseScore  Raw 0–100 from MoonPhaseService
   * @param solunarScore    Raw 0–100 from SolunarService
   * @param weatherData     Current WeatherData, or null if unavailable
   */
  calculate(
    latitude: number,
    longitude: number,
    dateUtc: string,
    moonPhaseScore: number,
    solunarScore: number,
    weatherData: WeatherData | null,
  ): FishingScore {
    if (latitude < -90 || latitude > 90) {
      throw new RangeError(`Invalid latitude: ${latitude}. Must be in [-90, 90].`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new RangeError(`Invalid longitude: ${longitude}. Must be in [-180, 180].`);
    }

    const weatherAvailable = weatherData !== null;
    const weatherScore = weatherData?.fishingScoreContribution ?? 0;
    const weights = DEFAULT_WEIGHTS;

    let effectiveMoonWeight: number;
    let effectiveSolunarWeight: number;
    let effectiveWeatherWeight: number;

    if (weatherAvailable) {
      effectiveMoonWeight = weights.moonPhase;
      effectiveSolunarWeight = weights.solunar;
      effectiveWeatherWeight = weights.weather;
    } else {
      // Redistribute weather weight proportionally to the remaining two factors
      const remaining = weights.moonPhase + weights.solunar;
      effectiveMoonWeight = weights.moonPhase / remaining;
      effectiveSolunarWeight = weights.solunar / remaining;
      effectiveWeatherWeight = 0;
    }

    const moonPhaseWeighted = Math.round(moonPhaseScore * effectiveMoonWeight);
    const solunarWeighted = Math.round(solunarScore * effectiveSolunarWeight);
    const weatherWeighted = Math.round(weatherScore * effectiveWeatherWeight);

    const rawScore =
      moonPhaseScore * effectiveMoonWeight +
      solunarScore * effectiveSolunarWeight +
      weatherScore * effectiveWeatherWeight;

    const score = Math.round(Math.min(100, Math.max(0, rawScore)));

    return {
      score,
      breakdown: {
        moonPhaseScore,
        solunarScore,
        weatherScore,
        moonPhaseWeighted,
        solunarWeighted,
        weatherWeighted,
        weatherAvailable,
      },
      weights,
      dateUtc,
      latitude,
      longitude,
    };
  }

  /**
   * Fetch weather then compute the composite score.
   * Emits null on unrecoverable error.
   *
   * @param latitude  Decimal degrees
   * @param longitude Decimal degrees
   * @param dateUtc   ISO date string YYYY-MM-DD
   */
  getScore(latitude: number, longitude: number, dateUtc: string): Observable<FishingScore | null> {
    const moonData = this.moonPhaseService.calculateForDateString(dateUtc);
    const solunarData = this.solunarService.calculateForDateString(dateUtc, latitude, longitude);

    return this.weatherService.getWeatherForLocation(latitude, longitude).pipe(
      map((weatherData) =>
        this.calculate(
          latitude,
          longitude,
          dateUtc,
          moonData.fishingScoreContribution,
          solunarData.fishingScoreContribution,
          weatherData,
        ),
      ),
      catchError(() => of(null)),
    );
  }
}
