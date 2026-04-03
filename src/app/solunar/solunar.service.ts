import { inject, Injectable } from '@angular/core';
import { MoonPhaseService } from '../moon-phase/moon-phase.service';

// ── Constants ──────────────────────────────────────────────────────────────

/** Mean synodic month in days (same epoch as MoonPhaseService). */
const LUNAR_CYCLE = 29.530588861;

/**
 * The moon transits the local meridian ~50.47 minutes later each solar day.
 * At new moon (age ≈ 0), the moon and sun share the same right ascension and
 * both transit at local solar noon (12:00 LMT).
 */
const LUNAR_TRANSIT_DELAY_HOURS = 50.47 / 60;
const NEW_MOON_TRANSIT_LMT_HOURS = 12;

/** Moon rise/set occurs approximately 6 hours before/after upper transit. */
const MOONRISE_OFFSET_HOURS = 6;

/** Major period: ±60 minutes around transit (120-minute window). */
const MAJOR_HALF_DURATION_MS = 60 * 60 * 1000;

/** Minor period: ±30 minutes around moonrise/moonset (60-minute window). */
const MINOR_HALF_DURATION_MS = 30 * 60 * 1000;

/** Latitudes beyond ±66.5° are treated as polar (no moonrise/moonset). */
const POLAR_THRESHOLD = 66.5;

/** Convert degrees of longitude to hours of time offset. */
const DEG_TO_HOURS = 1 / 15;

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface SolunarPeriod {
  /** 'major' (moon transit) or 'minor' (moonrise/moonset). */
  type: 'major' | 'minor';
  /** Chronological sequence index within the day (1–4). */
  index: 1 | 2 | 3 | 4;
  /** ISO datetime string (UTC) for period start. */
  startUtc: string;
  /** ISO datetime string (UTC) for period end. */
  endUtc: string;
  /** Duration in minutes: 120 for major, 60 for minor. */
  durationMinutes: 120 | 60;
  /** Traditional solunar rating for this period (derived from moon phase). */
  rating: 1 | 2 | 3 | 4;
  /** Human-readable description of the celestial event. */
  description: 'Moon Overhead' | 'Moon Underfoot' | 'Moonrise' | 'Moonset';
}

export interface SolunarData {
  /** Four daily solunar periods in chronological order (2 for polar regions). */
  periods: SolunarPeriod[];
  /** Moon upper transit (overhead) — ISO datetime string (UTC). */
  moonUpperTransitUtc: string;
  /** Moon lower transit (underfoot, 12 h after upper) — ISO datetime string (UTC). */
  moonLowerTransitUtc: string;
  /** Moonrise — ISO datetime string (UTC). Null for polar regions. */
  moonriseUtc: string | null;
  /** Moonset — ISO datetime string (UTC). Null for polar regions. */
  moonsetUtc: string | null;
  /** Traditional solunar day rating (1–4). */
  rating: 1 | 2 | 3 | 4;
  /** Fishing score contribution (0–100) for Feature 05 integration. */
  fishingScoreContribution: number;
  /** UTC date string (YYYY-MM-DD) for which data was calculated. */
  dateUtc: string;
  /** Latitude in decimal degrees (−90 to 90). */
  latitude: number;
  /** Longitude in decimal degrees (−180 to 180). */
  longitude: number;
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SolunarService {
  private readonly moonPhaseService = inject(MoonPhaseService);

  /**
   * Calculate solunar data for a given UTC date and location.
   *
   * Algorithm (simplified, ±30 min accuracy):
   * 1. Derive moon age from MoonPhaseService.
   * 2. Compute upper transit in local mean solar time (LMT):
   *    transitLmt = (12 + moonAge × 50.47min/60) mod 24
   * 3. Convert LMT → UTC by applying the longitude offset:
   *    transitUtc = transitLmt − longitude/15
   * 4. Lower transit = upper + 12 h; moonrise = upper − 6 h; moonset = upper + 6 h.
   * 5. For |lat| > 66.5° (polar), omit moonrise/moonset and return 2 major periods.
   */
  calculateForDate(date: Date, latitude: number, longitude: number): SolunarData {
    const moonData = this.moonPhaseService.calculateForDate(date);
    const moonAge = moonData.moonAge;

    // Upper transit in local mean solar time (mod-safe)
    const transitLmtHours =
      (((NEW_MOON_TRANSIT_LMT_HOURS + moonAge * LUNAR_TRANSIT_DELAY_HOURS) % 24) + 24) % 24;

    // Convert to UTC (longitude positive east → earlier UTC)
    const transitUtcHours = (((transitLmtHours - longitude * DEG_TO_HOURS) % 24) + 24) % 24;

    // Anchor to the requested date's UTC midnight
    const baseDateMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const upperTransitMs = baseDateMs + transitUtcHours * 3_600_000;
    const lowerTransitMs = upperTransitMs + 12 * 3_600_000;

    const isPolar = Math.abs(latitude) > POLAR_THRESHOLD;
    const moonriseMs = isPolar ? null : upperTransitMs - MOONRISE_OFFSET_HOURS * 3_600_000;
    const moonsetMs = isPolar ? null : upperTransitMs + MOONRISE_OFFSET_HOURS * 3_600_000;

    const rating = this.getSolunarRating(moonAge);
    const periods = this.buildPeriods(
      upperTransitMs,
      lowerTransitMs,
      moonriseMs,
      moonsetMs,
      rating
    );
    const fishingScoreContribution = this.calculateFishingScore(periods, moonAge);

    return {
      periods,
      moonUpperTransitUtc: new Date(upperTransitMs).toISOString(),
      moonLowerTransitUtc: new Date(lowerTransitMs).toISOString(),
      moonriseUtc: moonriseMs !== null ? new Date(moonriseMs).toISOString() : null,
      moonsetUtc: moonsetMs !== null ? new Date(moonsetMs).toISOString() : null,
      rating,
      fishingScoreContribution,
      dateUtc: date.toISOString().slice(0, 10),
      latitude,
      longitude,
    };
  }

  /** Calculate solunar data for the current UTC date at the given location. */
  calculateForToday(latitude: number, longitude: number): SolunarData {
    return this.calculateForDate(new Date(), latitude, longitude);
  }

  /**
   * Calculate solunar data for an ISO 8601 date string (e.g. "2024-06-15").
   * The date is interpreted as midnight UTC.
   */
  calculateForDateString(dateString: string, latitude: number, longitude: number): SolunarData {
    return this.calculateForDate(new Date(`${dateString}T00:00:00Z`), latitude, longitude);
  }

  /**
   * Return the traditional solunar rating (1–4) based on moon age.
   * - New moon (age 0–3) and full moon (age 14–17): rating 4 — peak activity
   * - First quarter (age 6–9) and last quarter (age 22–25): rating 3
   * - All other periods: rating 1
   */
  getSolunarRating(moonAge: number): 1 | 2 | 3 | 4 {
    const age = ((moonAge % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    // New moon window: 0–3 days after, plus late waning crescent (approaching)
    if (age < 3 || age >= LUNAR_CYCLE - 3) return 4;
    // First quarter
    if (age >= 6 && age < 9) return 3;
    // Full moon window: ±~2 days around 14.765 (expanded to catch pre-full)
    if (age >= 13 && age < 17) return 4;
    // Last quarter
    if (age >= 22 && age < 25) return 3;
    return 1;
  }

  /**
   * Calculate fishing score contribution (0–100) from solunar periods and moon age.
   *
   * Formula:
   *   base  = 60 if 4 periods available, 40 if polar (2 periods only)
   *   score = base + rating × 10
   *   clamped to [0, 100]
   */
  calculateFishingScore(periods: SolunarPeriod[], moonAge: number): number {
    const rating = this.getSolunarRating(moonAge);
    const base = periods.length >= 4 ? 60 : 40;
    return Math.min(100, Math.max(0, Math.round(base + rating * 10)));
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Build the sorted array of SolunarPeriod objects.
   * Events are sorted chronologically by their centre time, then windowed.
   */
  private buildPeriods(
    upperTransitMs: number,
    lowerTransitMs: number,
    moonriseMs: number | null,
    moonsetMs: number | null,
    rating: 1 | 2 | 3 | 4
  ): SolunarPeriod[] {
    type RawEvent = {
      ms: number;
      type: 'major' | 'minor';
      description: SolunarPeriod['description'];
    };

    const events: RawEvent[] = [
      { ms: upperTransitMs, type: 'major', description: 'Moon Overhead' },
      { ms: lowerTransitMs, type: 'major', description: 'Moon Underfoot' },
    ];

    if (moonriseMs !== null) {
      events.push({ ms: moonriseMs, type: 'minor', description: 'Moonrise' });
    }
    if (moonsetMs !== null) {
      events.push({ ms: moonsetMs, type: 'minor', description: 'Moonset' });
    }

    events.sort((a, b) => a.ms - b.ms);

    return events.map((ev, i) => {
      const half = ev.type === 'major' ? MAJOR_HALF_DURATION_MS : MINOR_HALF_DURATION_MS;
      const duration: 120 | 60 = ev.type === 'major' ? 120 : 60;
      return {
        type: ev.type,
        index: (i + 1) as 1 | 2 | 3 | 4,
        startUtc: new Date(ev.ms - half).toISOString(),
        endUtc: new Date(ev.ms + half).toISOString(),
        durationMinutes: duration,
        rating,
        description: ev.description,
      };
    });
  }
}
