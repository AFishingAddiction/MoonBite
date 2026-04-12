import { Injectable, inject } from '@angular/core';
import { FishingScore } from '../scoring/fishing-score.service';
import { MoonPhaseService } from '../moon-phase/moon-phase.service';
import { DailyScoreRecord, HistorySlice, LocationHistory } from './score-history.model';

@Injectable({ providedIn: 'root' })
export class ScoreHistoryService {
  private readonly moonPhaseService = inject(MoonPhaseService);

  static readonly KEY_PREFIX = 'moonbite_history_';
  private static readonly MAX_DAYS = 30;

  /**
   * Record today's fishing score for the active location.
   * Idempotent per day per location — overwrites if called again on the same day.
   * Prunes records older than 30 days on each write.
   */
  recordTodayScore(
    score: FishingScore | null,
    latitude: number,
    longitude: number,
  ): boolean {
    if (!score) return false;

    const dateUtc = new Date().toISOString().slice(0, 10);
    const moonData = this.moonPhaseService.calculateForDateString(dateUtc);

    const record: DailyScoreRecord = {
      date: dateUtc,
      score: score.score,
      moonPhase: moonData.phaseName,
      moonEmoji: moonData.phaseEmoji,
      factors: {
        moon: score.breakdown.moonPhaseScore,
        solunar: score.breakdown.solunarScore,
        weather: score.breakdown.weatherScore,
      },
    };

    const key = this.buildKey(latitude, longitude);
    const history = this.loadHistory(key);

    // Upsert: replace existing entry for today, or prepend new one
    const existingIdx = history.records.findIndex(r => r.date === dateUtc);
    let records: DailyScoreRecord[];
    if (existingIdx >= 0) {
      records = history.records.map((r, i) => (i === existingIdx ? record : r));
    } else {
      records = [record, ...history.records];
    }

    // Prune records older than MAX_DAYS
    const cutoff = this.dateMinus(dateUtc, ScoreHistoryService.MAX_DAYS - 1);
    records = records.filter(r => r.date >= cutoff);

    // Sort descending (newest first)
    records.sort((a, b) => b.date.localeCompare(a.date));

    this.saveHistory(key, { latitude, longitude, records });
    return true;
  }

  /**
   * Load the history slice for a given location and time range.
   */
  getHistory(
    latitude: number,
    longitude: number,
    days: 7 | 14 | 30,
  ): HistorySlice {
    const key = this.buildKey(latitude, longitude);
    const history = this.loadHistory(key);

    const dateUtc = new Date().toISOString().slice(0, 10);
    const cutoff = this.dateMinus(dateUtc, days - 1);
    const records = history.records
      .filter(r => r.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (records.length === 0) {
      return { records: [], highScore: 0, lowScore: 0, highDate: '', lowDate: '', averageScore: 0 };
    }

    let highScore = -Infinity;
    let lowScore = Infinity;
    let highDate = '';
    let lowDate = '';
    let sum = 0;

    for (const r of records) {
      sum += r.score;
      if (r.score > highScore) {
        highScore = r.score;
        highDate = r.date;
      }
      if (r.score < lowScore) {
        lowScore = r.score;
        lowDate = r.date;
      }
    }

    return {
      records,
      highScore,
      lowScore,
      highDate,
      lowDate,
      averageScore: Math.round(sum / records.length),
    };
  }

  /** Clear all history data from localStorage. */
  clear(): void {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(ScoreHistoryService.KEY_PREFIX),
    );
    keys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  }

  private buildKey(lat: number, lng: number): string {
    const roundedLat = parseFloat(lat.toFixed(4));
    const roundedLng = parseFloat(lng.toFixed(4));
    return `${ScoreHistoryService.KEY_PREFIX}${roundedLat}_${roundedLng}`;
  }

  private loadHistory(key: string): LocationHistory {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { latitude: 0, longitude: 0, records: [] };
      return JSON.parse(raw) as LocationHistory;
    } catch {
      return { latitude: 0, longitude: 0, records: [] };
    }
  }

  private saveHistory(key: string, history: LocationHistory): void {
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }

  /** Returns the ISO date string for (dateUtc minus N days). */
  private dateMinus(dateUtc: string, days: number): string {
    const d = new Date(dateUtc + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  }
}
