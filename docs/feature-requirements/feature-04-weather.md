# Feature 04 — Weather Data Service

**Status:** Complete

## Overview

MoonBite's daily fishing score combines celestial factors (moon phase, solunar transits) with real-time atmospheric conditions. This feature provides an Angular HTTP-based service that fetches current-day weather data from the free Open-Meteo API for any location. The service returns structured weather data, barometric pressure stability analysis, and fishing score contribution (0–100).

Unlike Features 02–03 (pure calculation services), the Weather Service is location-dependent, requires HTTP, and provides live data. It's consumed by Feature 05 (Fishing Score Calculation Engine) for the weather contribution score and by Feature 10 (Weather Details Screen) for rich weather breakdowns.

## User Stories

> As the fishing score engine, I want current weather data (temperature, wind, cloud cover, pressure) for a location so that I can weight atmospheric conditions in the daily score.

> As a user viewing my daily fishing score, I want to understand how weather affects the prediction so that I can plan trips knowing which conditions are favorable.

> As a power user, I want to see detailed weather conditions and how each factor (pressure, wind, clouds, rain) impacts the fishing score so that I can make data-driven fishing decisions.

> As a product team, I want weather data with <5 min staleness so that scores remain relevant throughout the day.

## Data Model

### WeatherCondition Enum

WMO weather codes mapped to human-readable conditions and fishing impact.

```typescript
enum WeatherCondition {
  // Clear sky
  ClearSky = 0,

  // Mainly clear
  MainlyClear = 1,

  // Partly cloudy
  PartlyCloudy = 2,

  // Overcast
  Overcast = 3,

  // Drizzle (light rain)
  Drizzle = 45,
  FreezedrizzleLight = 48,

  // Rain
  RainLight = 51,
  RainModerate = 53,
  RainHeavy = 55,

  // Rain showers
  RainShowersSlight = 80,
  RainShowersModerate = 81,
  RainShowersViolent = 82,

  // Thunderstorm
  Thunderstorm = 95,
  ThunderstormWithHail = 96,
  ThunderstormWithHeavyHail = 99,

  // Snow (unfavorable for fishing, rare coastal condition)
  SnowLight = 71,
  SnowModerate = 73,
  SnowHeavy = 75,
}

function getWeatherDescription(code: WeatherCondition): string {
  // Returns human-readable description
}

function isFishingUnfavorableWeather(code: WeatherCondition): boolean {
  // Returns true for rain, thunderstorm, snow
}
```

### WeatherData

The service's primary output. Used by Feature 05 (scoring) and Feature 10 (details screen).

```typescript
interface WeatherData {
  // Current temperature in Celsius
  temperatureCelsius: number;

  // Apparent/"feels like" temperature in Celsius
  apparentTemperatureCelsius: number;

  // Wind speed at 10m height in km/h
  windSpeedKmh: number;

  // Wind gust speed at 10m height in km/h
  windGustKmh: number;

  // Cloud cover as percentage (0–100)
  cloudCoverPercent: number;

  // Precipitation (mm) in current time period (hourly)
  precipitationMm: number;

  // WMO weather code (0–99)
  // Decoded using WeatherCondition enum
  weatherCode: WeatherCondition;

  // Surface barometric pressure in hPa (hectopascals)
  // Typical range: 950–1050 hPa
  barometricPressureHpa: number;

  // Barometric pressure trend over past 3 hours
  // 'rising' = pressure increased by >2 hPa
  // 'falling' = pressure decreased by >2 hPa
  // 'steady' = within ±2 hPa
  pressureTrend: 'rising' | 'falling' | 'steady';

  // Fishing score contribution (0–100)
  // Composite of wind, pressure, clouds, precipitation
  fishingScoreContribution: number;

  // ISO time string (UTC) when data was fetched
  fetchedAtUtc: string;

  // ISO date string (UTC) for which forecast data applies
  dateUtc: string;

  // Latitude used for API call (decimal degrees)
  latitude: number;

  // Longitude used for API call (decimal degrees)
  longitude: number;

  // Timezone string from Open-Meteo (e.g., "America/New_York")
  timezone: string;
}
```

## Service Spec

### WeatherService

An Angular singleton service that manages HTTP requests to Open-Meteo and caches results.

```typescript
interface WeatherService {
  // Fetch current-day weather for a location
  // @param latitude — Decimal degrees (-90 to 90)
  // @param longitude — Decimal degrees (-180 to 180)
  // @returns Observable<WeatherData | null>
  // Null returned on API error (with error logged)
  getWeatherForLocation(latitude: number, longitude: number): Observable<WeatherData | null>;

  // Get cached weather data if available and not stale (< 5 min old)
  // @param latitude — Decimal degrees
  // @param longitude — Decimal degrees
  // @returns WeatherData | null (null if no cache or stale)
  getCachedWeather(latitude: number, longitude: number): WeatherData | null;

  // Force refresh weather data (bypass cache)
  // @param latitude — Decimal degrees
  // @param longitude — Decimal degrees
  // @returns Observable<WeatherData | null>
  refreshWeather(latitude: number, longitude: number): Observable<WeatherData | null>;

  // Invalidate all cached data (e.g., on logout or navigation)
  clearCache(): void;

  // Calculate barometric pressure trend by comparing current pressure
  // to a baseline (for future multi-day comparison)
  // @param currentPressure — hPa
  // @param previousPressure — hPa (from 3 hours ago, or null if unavailable)
  // @returns 'rising' | 'falling' | 'steady'
  calculatePressureTrend(currentPressure: number, previousPressure: number | null): 'rising' | 'falling' | 'steady';

  // Calculate fishing score contribution (0–100) from weather factors
  // @param data — Partial WeatherData (pressure, wind, clouds, precipitation, code)
  // @returns 0–100 fishing score
  calculateFishingScore(data: Partial<WeatherData>): number;
}
```

### API Endpoint

**Base URL:** `https://api.open-meteo.com/v1/forecast`

**Query Parameters:**
```
GET /forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,apparent_temperature,precipitation,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_gusts_10m
  &timezone=auto
```

**Example Request:**
```
GET https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,apparent_temperature,precipitation,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_gusts_10m&timezone=auto
```

**Expected Response Structure:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timezone": "America/New_York",
  "current": {
    "time": "2026-04-03T14:30",
    "temperature_2m": 12.5,
    "apparent_temperature": 10.2,
    "precipitation": 0.0,
    "weather_code": 2,
    "surface_pressure": 1013.25,
    "cloud_cover": 45,
    "wind_speed_10m": 18.5,
    "wind_gusts_10m": 32.1
  }
}
```

## Fishing Score Contribution Algorithm

The weather service contributes 0–100 to the daily fishing score. This composite score factors barometric pressure (stability), wind speed, cloud cover, and precipitation.

### Scoring Bands

#### 1. Barometric Pressure (0–40 points)

Fish are most active when pressure is steady or rising slightly. Rapidly falling pressure (storm incoming) reduces activity.

```
Steady + High (>1015 hPa):      40 points
Steady + Normal (1000–1015):    38 points
Steady + Low (<1000 hPa):       35 points
Rising (+2 to +5 hPa/3h):       37 points
Rising (>5 hPa/3h, rapid):      32 points
Falling (-2 to -5 hPa/3h):      28 points
Falling (<-5 hPa/3h, rapid):    15 points (storm incoming)
```

**Implementation:**
- Calculate `pressureTrend` by comparing current to baseline (default: assume steady if no history).
- Apply multiplier: steady=1.0, rising=0.95, falling=0.7–0.4 depending on rate.
- Base score = 38 (normal pressure); scale by multiplier.

#### 2. Wind Speed (0–30 points)

Calm to moderate winds are ideal. Strong winds reduce fish feeding (increased water turbulence).

```
Calm (0–5 km/h):          30 points
Light (5–15 km/h):        28 points
Moderate (15–20 km/h):    22 points
Fresh (20–30 km/h):       12 points
Strong (30–40 km/h):       5 points
Gale (>40 km/h):           2 points
```

**Implementation:**
- Use 10m wind speed (not gust).
- Apply linear interpolation between bands if needed.

#### 3. Cloud Cover (0–20 points)

Partly cloudy is best (fish feed more during low-light). Overcast is acceptable. Clear sky is less ideal (intense light reduces feeding). Heavy overcast is poor.

```
Clear (0–10%):           14 points
Partly Cloudy (10–50%):  20 points
Mostly Cloudy (50–80%):  16 points
Overcast (80–100%):      12 points
```

**Implementation:**
- Linear interpolation within ranges.
- Peak at 30% cloud cover (middle of "partly cloudy").

#### 4. Precipitation (0–10 points)

Any rain reduces fishing activity. Heavier precipitation = lower score.

```
None (0 mm):             10 points
Trace (0–0.5 mm):         8 points
Light (0.5–2 mm):         5 points
Moderate (2–5 mm):        2 points
Heavy (>5 mm):            0 points
```

**Implementation:**
- Use current hourly precipitation.
- Linear falloff; 0 points at 5+ mm.

### Total Calculation

```typescript
function calculateFishingScore(data: WeatherData): number {
  const pressureScore = calculatePressureScore(data.barometricPressureHpa, data.pressureTrend);
  const windScore = calculateWindScore(data.windSpeedKmh);
  const cloudScore = calculateCloudScore(data.cloudCoverPercent);
  const precipScore = calculatePrecipScore(data.precipitationMm);

  return pressureScore + windScore + cloudScore + precipScore;
  // Range: 0–100
}
```

## Acceptance Criteria

### Happy Path: Successful API Call

```gherkin
Scenario: Fetch weather for a valid location
  Given the user is at latitude 40.7128, longitude -74.0060
  When WeatherService.getWeatherForLocation(40.7128, -74.0060) is called
  Then an Observable<WeatherData> is returned
  And WeatherData contains:
    | Field                      | Type            |
    | temperatureCelsius         | number          |
    | windSpeedKmh               | number          |
    | cloudCoverPercent          | 0–100           |
    | barometricPressureHpa      | 950–1050        |
    | fishingScoreContribution   | 0–100           |
    | fetchedAtUtc               | ISO 8601 string |
    | timezone                   | string          |
  And fishing score is deterministic (same conditions = same score)
```

### Caching Behavior

```gherkin
Scenario: Cache weather data for 5 minutes
  Given weather data was fetched at T=0
  When getWeatherForLocation is called again at T=2 min
  Then cached data is returned (no HTTP call)
  
Scenario: Refresh stale cache
  Given weather data was fetched at T=0
  When getWeatherForLocation is called at T=6 min
  Then a new HTTP request is made
  And cache is updated with fresh data

Scenario: Force refresh bypasses cache
  Given cached weather exists
  When refreshWeather() is called
  Then cache is cleared
  And new HTTP request is made immediately
```

### Error Handling

```gherkin
Scenario: API returns HTTP error
  Given Open-Meteo API is unreachable (e.g., 503)
  When getWeatherForLocation is called
  Then Observable<WeatherData | null> emits null
  And error is logged to console (dev-only)
  And no exception is thrown
  And fallback behavior: if cache exists, use it (warn user: "Last known conditions")

Scenario: Invalid coordinates
  Given latitude > 90 or longitude > 180
  When getWeatherForLocation is called
  Then error is thrown with message "Invalid coordinates"
  And service does not make HTTP request

Scenario: Network timeout
  Given network request times out (>10 sec)
  When getWeatherForLocation is called
  Then timeout error is caught
  And null is returned
  And message logged: "Weather fetch timeout, using cached data if available"
```

### Fishing Score Calculation

```gherkin
Scenario: Steady high pressure + light wind + partly cloudy + no rain
  Given barometricPressure = 1020 hPa, pressureTrend = steady
  And windSpeed = 12 km/h
  And cloudCover = 35%
  And precipitation = 0 mm
  When calculateFishingScore is called
  Then fishingScoreContribution >= 80 (very favorable)

Scenario: Falling pressure + strong wind + overcast + light rain
  Given barometricPressure = 990 hPa, pressureTrend = falling
  And windSpeed = 32 km/h
  And cloudCover = 85%
  And precipitation = 2 mm
  When calculateFishingScore is called
  Then fishingScoreContribution <= 30 (unfavorable)

Scenario: Clear sky (all factors positive except clouds)
  Given barometricPressure = 1015 hPa, windSpeed = 8 km/h, cloudCover = 5%, precipitation = 0 mm
  When calculateFishingScore is called
  Then fishingScoreContribution = 14 + 30 + 14 + 10 = 68 (good, not best)
```

## Architecture Notes

### HTTP Integration

- Use Angular's `HttpClient` (injected via `inject(HttpClient)`)
- Standalone service with `providedIn: 'root'`
- Return `Observable<WeatherData | null>` for async composition with RxJS operators
- No interceptors; simple GET request with query params

### Caching Strategy

- **Memory-based cache:** Store last fetched `WeatherData` + timestamp in service instance
- **Cache key:** `"${latitude},${longitude}"` (string tuple)
- **TTL:** 5 minutes (300,000 ms) — aligns with Open-Meteo rate limits and user expectations
- **Invalidation:** Manual `clearCache()` or automatic on staleness

### Signal Integration

- Service itself remains Observable-based (composable with Feature 05 engine)
- Consume weather Observable in Feature 05 using `toSignal()` if needed
- Display component (Feature 10) may use `toSignal()` for reactive binding

### Error Handling

- HTTP errors → Observable emits `null` (graceful degradation)
- Validation errors (bad coords) → throw `Error` synchronously
- Log all errors to `console.warn()` (dev-only)
- Fallback: if cache exists and API fails, optionally emit cached data with warning

### Rate Limiting & Quotas

- Open-Meteo free tier: 10,000 calls/day (per IP)
- Caching (5 min TTL) reduces calls by ~97% for typical usage
- No API key required; no authentication overhead
- Single concurrent request per location (use `shareReplay()` for duplicate requests in same window)

## Dev-Only Display Component

### WeatherDisplayComponent

Optional card UI for development and debugging. Displays current conditions and calculated fishing score.

**Props:**
```typescript
interface WeatherDisplayComponent {
  weather: InputSignal<WeatherData | null>;
}
```

**Layout (dark theme, matching SolunarDisplayComponent):**
```
┌─────────────────────────────────┐
│ Weather Conditions              │
├─────────────────────────────────┤
│ 🌦️  Partly Cloudy              │
│ 12.5°C (feels 10.2°C)          │
│ ─────────────────────────────── │
│ Wind:      18.5 km/h (↓32 gust)│
│ Pressure:  1013.25 hPa ↑       │
│ Clouds:    45%                  │
│ Rain:      0 mm                 │
├─────────────────────────────────┤
│ Fishing Score:    78 / 100      │
│ [████████░░]                    │
└─────────────────────────────────┘
```

**Color Indicators:**
- Score 0–30: red (#e74c3c)
- Score 31–60: yellow (#f39c12)
- Score 61–80: light green (#2ecc71)
- Score 81–100: bright green (#27ae60)

**Features:**
- Show WMO code description + emoji
- Display pressure trend icon (↑/↓/→)
- Wind gust warning if >30 km/h
- Precipitation warning if >0 mm
- Responsive layout (full width on mobile, card width on desktop)

## Integration Points

### Consumed By

1. **Feature 05 — Fishing Score Calculation Engine**
   - Consumes `WeatherData.fishingScoreContribution` (0–100)
   - Weights weather alongside moon phase and solunar scores
   - Composite score = (moonScore × 0.3) + (solunarScore × 0.4) + (weatherScore × 0.3)

2. **Feature 10 — Weather Details Screen**
   - Consumes full `WeatherData` object
   - Renders all fields: temperature, wind, pressure, clouds, precipitation
   - Shows scoring breakdown (pressure contribution, wind contribution, etc.)
   - May include chart of pressure trend over past 24h (requires history storage — backlog)

### Consumes

1. **Open-Meteo API (External)**
   - Dependency: network + API availability
   - Fallback: cached data (5 min)

2. **Feature 01 — Geolocation Service**
   - Weather service receives latitude/longitude from geolocation
   - Integrated in Feature 05 or home screen orchestration

## Non-Functional Requirements

| Requirement | Target | Rationale |
|---|---|---|
| API Response Time | <2 sec | Free tier; user expects quick load |
| Cache TTL | 5 minutes | Balance freshness + rate limits |
| Error Recovery | Fallback to cache | Uninterrupted UX; graceful degradation |
| Network Timeout | 10 seconds | Don't block UI; prioritize responsiveness |
| Geolocation Accuracy | ±5 km | Open-Meteo resolution; sufficient for fishing spots |
| Pressure Trend Detection | ±2 hPa threshold | Meteorological standard for stability |
| Test Coverage | 85% (statements, branches, functions, lines) | Standard for MoonBite codebase |
| Observable Subscription Cleanup | Auto-unsubscribe via async pipe or takeUntilDestroyed | Prevent memory leaks |

## Dependencies

- `@angular/common/http` — HttpClient
- `rxjs` — Observable, pipe, operators (shareReplay, catchError, map)
- No external weather library; direct API calls

## Implementation Notes

### Files Delivered

- `src/app/weather/weather.service.ts` — `WeatherService` with full API, HTTP, caching, and score calculation
- `src/app/weather/weather.service.spec.ts` — 69 unit tests, 90%+ branch coverage
- `src/app/weather/weather-display.component.ts` — dev-only display component (signals + `toObservable`/`toSignal`)
- `src/app/weather/weather-display.component.html`
- `src/app/weather/weather-display.component.scss`
- `src/app/weather/weather-display.component.spec.ts` — 31 component tests
- `e2e/tests/weather.spec.ts` — Playwright acceptance tests

### Algorithm

Fishing score = `calcPressureScore` (0–40) + `calcWindScore` (0–30) + `calcCloudScore` (0–20) + `calcPrecipScore` (0–10).

**Pressure multipliers (revised from spec):** steady=1.0, rising=0.9, falling=0.35 — the heavy falling penalty ensures storm-incoming conditions score ≤30.

**Cloud score:** partly cloudy (10–50%) peaks at 20 pts; overcast (80–100%) scores 8 pts.

### Reactive Pattern

The component uses `toObservable(geoService.state).pipe(switchMap(...))` piped into `toSignal()`, matching Angular's signal-first idiom without manual `subscribe`/unsubscribe.

### Caching

5-minute in-memory TTL keyed by `"lat,lon"` string. `clearCache()` available for manual invalidation. `refreshWeather()` bypasses the cache for forced refresh.

### Test Coverage (final)

| Metric | Result |
|---|---|
| Statements | 98.55% |
| Branches | 90.07% |
| Functions | 100% |
| Lines | 98.97% |

## Future Enhancements (Out of Scope)

- **Historical pressure data:** Store pressure readings every hour for trend graph
- **Multi-day forecast:** Extend to 7-day, solunar-aligned predictions
- **Weather alerts:** Push notifications for rapid pressure drops or severe weather
- **Multiple weather providers:** Fallback to WeatherAPI or NOAA if Open-Meteo unavailable
- **UV index:** Solar radiation effect on fish behavior
- **Water temperature:** Integration with specialized water temp APIs (ocean/lake specific)
