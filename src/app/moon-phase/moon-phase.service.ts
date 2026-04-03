import { Injectable } from '@angular/core';

export type PhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonPhaseData {
  /** Phase index 0 (New Moon) through 7 (Waning Crescent) */
  phaseIndex: number;
  /** Human-readable phase name */
  phaseName: PhaseName;
  /** Illumination as a percentage 0–100 */
  illuminationPercent: number;
  /** Days elapsed since the last new moon (0–29.5) */
  moonAge: number;
  /** Unicode moon emoji for the phase */
  phaseEmoji: string;
  /** Fishing score contribution 0–100; peaks at new and full moon */
  fishingScoreContribution: number;
  /** UTC date string (YYYY-MM-DD) for which data was calculated */
  dateUtc: string;
  /** Optional latitude (reserved for future moon rise/set, Feature 08) */
  latitude?: number;
  /** Optional longitude (reserved for future moon rise/set, Feature 08) */
  longitude?: number;
}

// Astronomical constants (Meeus, "Astronomical Algorithms", 2nd ed., Chapter 49)
const LUNAR_CYCLE = 29.530588861; // mean synodic month in days
// Known new moon: JD 2451550.09766 ≈ 2000-01-06 14:20 UTC
const JD_EPOCH_NEW_MOON = 2451550.09766;
// Julian Day Number of the Unix epoch (1970-01-01 00:00 UTC)
const JD_UNIX_EPOCH = 2440587.5;

const PHASE_NAMES: readonly PhaseName[] = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

const PHASE_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'] as const;

@Injectable({ providedIn: 'root' })
export class MoonPhaseService {
  /**
   * Calculate moon phase data for a given UTC Date.
   */
  calculateForDate(date: Date): MoonPhaseData {
    const moonAge = this.getMoonAge(date);
    const phaseIndex = Math.floor((moonAge / LUNAR_CYCLE) * 8) % 8;
    const illuminationPercent = Math.round(this.getIllumination(moonAge));
    const fishingScoreContribution = this.calculateFishingScore(illuminationPercent);

    return {
      phaseIndex,
      phaseName: PHASE_NAMES[phaseIndex],
      illuminationPercent,
      moonAge: Math.round(moonAge * 100) / 100,
      phaseEmoji: PHASE_EMOJIS[phaseIndex],
      fishingScoreContribution,
      dateUtc: this.toUtcDateString(date),
    };
  }

  /**
   * Calculate moon phase data for the current date/time.
   */
  calculateForToday(): MoonPhaseData {
    return this.calculateForDate(new Date());
  }

  /**
   * Calculate moon phase data for an ISO 8601 date string (e.g. "2024-03-25").
   * The date is interpreted as midnight UTC.
   */
  calculateForDateString(dateString: string): MoonPhaseData {
    return this.calculateForDate(new Date(`${dateString}T00:00:00Z`));
  }

  /**
   * Compute the fishing score contribution (0–100) from an illumination percentage.
   *
   * Formula: 25·cos(4π·x) + 10·cos(2π·x) + 65 where x = illumination/100
   * Produces scores of 100 at new and full moon, 80 at quarters, ~40 at crescents/gibbous.
   */
  calculateFishingScore(illuminationPercent: number): number {
    const x = illuminationPercent / 100;
    const score = 25 * Math.cos(4 * Math.PI * x) + 10 * Math.cos(2 * Math.PI * x) + 65;
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private getMoonAge(date: Date): number {
    const jd = date.getTime() / 86400000 + JD_UNIX_EPOCH;
    const daysSinceEpoch = jd - JD_EPOCH_NEW_MOON;
    return ((daysSinceEpoch % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  }

  private getIllumination(moonAge: number): number {
    return ((1 - Math.cos((2 * Math.PI * moonAge) / LUNAR_CYCLE)) / 2) * 100;
  }

  private toUtcDateString(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
