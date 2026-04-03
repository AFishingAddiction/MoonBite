import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

// ─────────────────────────────────────────────────────────────────────────────
// WMO weather code enum
// ─────────────────────────────────────────────────────────────────────────────

export enum WeatherCondition {
  ClearSky = 0,
  MainlyClear = 1,
  PartlyCloudy = 2,
  Overcast = 3,
  Fog = 45,
  DepositingRimeFog = 48,
  DrizzleLight = 51,
  DrizzleModerate = 53,
  DrizzleDense = 55,
  FreezingDrizzleLight = 56,
  FreezingDrizzleDense = 57,
  RainLight = 61,
  RainModerate = 63,
  RainHeavy = 65,
  FreezingRainLight = 66,
  FreezingRainHeavy = 67,
  SnowLight = 71,
  SnowModerate = 73,
  SnowHeavy = 75,
  SnowGrains = 77,
  RainShowersSlight = 80,
  RainShowersModerate = 81,
  RainShowersViolent = 82,
  SnowShowersSlight = 85,
  SnowShowersHeavy = 86,
  Thunderstorm = 95,
  ThunderstormWithHail = 96,
  ThunderstormWithHeavyHail = 99,
}

export function getWeatherDescription(code: WeatherCondition): string {
  const descriptions: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Icy Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Light Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Light Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail',
  };
  return descriptions[code] ?? 'Unknown';
}

export function getWeatherEmoji(code: WeatherCondition): string {
  if (code === 0) return '☀️';
  if (code === 1) return '🌤️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

// ─────────────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────────────

export interface WeatherData {
  temperatureCelsius: number;
  apparentTemperatureCelsius: number;
  windSpeedKmh: number;
  windGustKmh: number;
  cloudCoverPercent: number;
  precipitationMm: number;
  weatherCode: WeatherCondition;
  barometricPressureHpa: number;
  pressureTrend: 'rising' | 'falling' | 'steady';
  fishingScoreContribution: number;
  fetchedAtUtc: string;
  dateUtc: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    surface_pressure: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
  };
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS =
  'temperature_2m,apparent_temperature,precipitation,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_gusts_10m';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, CacheEntry>();

  getWeatherForLocation(latitude: number, longitude: number): Observable<WeatherData | null> {
    this.validateCoordinates(latitude, longitude);

    const cached = this.getCachedWeather(latitude, longitude);
    if (cached) {
      return of(cached);
    }

    return this.fetchFromApi(latitude, longitude);
  }

  getCachedWeather(latitude: number, longitude: number): WeatherData | null {
    const key = this.cacheKey(latitude, longitude);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  refreshWeather(latitude: number, longitude: number): Observable<WeatherData | null> {
    this.validateCoordinates(latitude, longitude);
    const key = this.cacheKey(latitude, longitude);
    this.cache.delete(key);
    return this.fetchFromApi(latitude, longitude);
  }

  clearCache(): void {
    this.cache.clear();
  }

  calculatePressureTrend(
    currentPressure: number,
    previousPressure: number | null,
  ): 'rising' | 'falling' | 'steady' {
    if (previousPressure === null) return 'steady';
    const delta = currentPressure - previousPressure;
    if (delta > 2) return 'rising';
    if (delta < -2) return 'falling';
    return 'steady';
  }

  calculateFishingScore(
    data: Partial<
      Pick<
        WeatherData,
        'barometricPressureHpa' | 'pressureTrend' | 'windSpeedKmh' | 'cloudCoverPercent' | 'precipitationMm'
      >
    >,
  ): number {
    const pressureScore = this.calcPressureScore(
      data.barometricPressureHpa ?? 1013,
      data.pressureTrend ?? 'steady',
    );
    const windScore = this.calcWindScore(data.windSpeedKmh ?? 0);
    const cloudScore = this.calcCloudScore(data.cloudCoverPercent ?? 0);
    const precipScore = this.calcPrecipScore(data.precipitationMm ?? 0);

    return Math.round(Math.max(0, Math.min(100, pressureScore + windScore + cloudScore + precipScore)));
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private fetchFromApi(latitude: number, longitude: number): Observable<WeatherData | null> {
    const params = new HttpParams()
      .set('latitude', String(latitude))
      .set('longitude', String(longitude))
      .set('current', CURRENT_FIELDS)
      .set('timezone', 'auto');

    return this.http.get<OpenMeteoResponse>(OPEN_METEO_URL, { params }).pipe(
      map((response) => this.mapResponse(response, latitude, longitude)),
      catchError((err) => {
        console.warn('WeatherService: API request failed', err);
        return of(null);
      }),
    );
  }

  private mapResponse(
    response: OpenMeteoResponse,
    latitude: number,
    longitude: number,
  ): WeatherData {
    const c = response.current;
    const pressureTrend = this.calculatePressureTrend(c.surface_pressure, null);

    const data: WeatherData = {
      temperatureCelsius: c.temperature_2m,
      apparentTemperatureCelsius: c.apparent_temperature,
      windSpeedKmh: c.wind_speed_10m,
      windGustKmh: c.wind_gusts_10m,
      cloudCoverPercent: c.cloud_cover,
      precipitationMm: c.precipitation,
      weatherCode: c.weather_code as WeatherCondition,
      barometricPressureHpa: c.surface_pressure,
      pressureTrend,
      fishingScoreContribution: 0,
      fetchedAtUtc: new Date().toISOString(),
      dateUtc: c.time.slice(0, 10),
      latitude,
      longitude,
      timezone: response.timezone,
    };

    data.fishingScoreContribution = this.calculateFishingScore(data);

    this.cache.set(this.cacheKey(latitude, longitude), {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid coordinates: latitude must be in [-90, 90] and longitude in [-180, 180]');
    }
  }

  private cacheKey(latitude: number, longitude: number): string {
    return `${latitude},${longitude}`;
  }

  // ── Score sub-calculations ────────────────────────────────────────────────

  private calcPressureScore(pressureHpa: number, trend: 'rising' | 'falling' | 'steady'): number {
    let base: number;
    if (pressureHpa > 1015) base = 40;
    else if (pressureHpa >= 1000) base = 36;
    else base = 32;

    // Falling pressure penalises heavily (storm incoming = poor fishing)
    const multiplier = trend === 'steady' ? 1.0 : trend === 'rising' ? 0.9 : 0.35;
    return base * multiplier;
  }

  private calcWindScore(windKmh: number): number {
    if (windKmh <= 5) return 30;
    if (windKmh <= 15) return 28;
    if (windKmh <= 20) return 22;
    if (windKmh <= 30) return 12;
    if (windKmh <= 40) return 5;
    return 2;
  }

  private calcCloudScore(cloudPercent: number): number {
    if (cloudPercent <= 10) return 14;
    if (cloudPercent <= 50) return 20;
    if (cloudPercent <= 80) return 14;
    return 8;
  }

  private calcPrecipScore(precipMm: number): number {
    if (precipMm === 0) return 10;
    if (precipMm <= 0.5) return 8;
    if (precipMm <= 2) return 5;
    if (precipMm <= 5) return 2;
    return 0;
  }
}
