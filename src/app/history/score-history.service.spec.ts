import { TestBed } from '@angular/core/testing';
import { ScoreHistoryService } from './score-history.service';
import { MoonPhaseService } from '../moon-phase/moon-phase.service';
import { FishingScore } from '../scoring/fishing-score.service';
import { DailyScoreRecord } from './score-history.model';

const LAT = 37.3382;
const LNG = -121.8863;
const KEY = `moonbite_history_${LAT}_${LNG}`;

function makeScore(overrides: Partial<FishingScore> = {}): FishingScore {
  return {
    score: 82,
    breakdown: {
      moonPhaseScore: 90,
      solunarScore: 78,
      weatherScore: 75,
      moonPhaseWeighted: 36,
      solunarWeighted: 27,
      weatherWeighted: 19,
      weatherAvailable: true,
    },
    weights: { moonPhase: 0.4, solunar: 0.35, weather: 0.25 },
    dateUtc: new Date().toISOString().slice(0, 10),
    latitude: LAT,
    longitude: LNG,
    ...overrides,
  };
}

function seedRecords(records: DailyScoreRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify({ latitude: LAT, longitude: LNG, records }));
}

function makeRecord(date: string, score: number): DailyScoreRecord {
  return {
    date,
    score,
    moonPhase: 'Full Moon',
    moonEmoji: '🌕',
    factors: { moon: score, solunar: score, weather: score },
  };
}

describe('ScoreHistoryService', () => {
  let service: ScoreHistoryService;
  let moonPhaseServiceSpy: jasmine.SpyObj<MoonPhaseService>;

  beforeEach(() => {
    moonPhaseServiceSpy = jasmine.createSpyObj('MoonPhaseService', ['calculateForDateString']);
    moonPhaseServiceSpy.calculateForDateString.and.returnValue({
      phaseIndex: 4,
      phaseName: 'Full Moon',
      illuminationPercent: 100,
      moonAge: 14.75,
      phaseEmoji: '🌕',
      fishingScoreContribution: 95,
      dateUtc: new Date().toISOString().slice(0, 10),
    });

    TestBed.configureTestingModule({
      providers: [
        ScoreHistoryService,
        { provide: MoonPhaseService, useValue: moonPhaseServiceSpy },
      ],
    });

    service = TestBed.inject(ScoreHistoryService);
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  // ── recordTodayScore ────────────────────────────────────────────────────────

  describe('recordTodayScore', () => {
    it('returns false and does not write when score is null', () => {
      expect(service.recordTodayScore(null, LAT, LNG)).toBeFalse();
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('returns true and persists a record when score is valid', () => {
      expect(service.recordTodayScore(makeScore(), LAT, LNG)).toBeTrue();
      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records.length).toBe(1);
      expect(stored.records[0].score).toBe(82);
    });

    it('stores the moon phase emoji and name from MoonPhaseService', () => {
      service.recordTodayScore(makeScore(), LAT, LNG);
      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records[0].moonEmoji).toBe('🌕');
      expect(stored.records[0].moonPhase).toBe('Full Moon');
    });

    it('stores factor scores from the FishingScore breakdown', () => {
      service.recordTodayScore(makeScore(), LAT, LNG);
      const stored = JSON.parse(localStorage.getItem(KEY)!);
      const { factors } = stored.records[0];
      expect(factors.moon).toBe(90);
      expect(factors.solunar).toBe(78);
      expect(factors.weather).toBe(75);
    });

    it('overwrites an existing entry for the same day (idempotent)', () => {
      service.recordTodayScore(makeScore({ score: 82 }), LAT, LNG);
      service.recordTodayScore(makeScore({ score: 70 }), LAT, LNG);
      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records.length).toBe(1);
      expect(stored.records[0].score).toBe(70);
    });

    it('adds a new entry for a different day', () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      seedRecords([makeRecord(yesterdayStr, 75)]);

      service.recordTodayScore(makeScore(), LAT, LNG);

      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records.length).toBe(2);
    });

    it('rounds coordinates to 4 decimal places for the storage key', () => {
      service.recordTodayScore(makeScore(), 37.33821234, -121.88634567);
      expect(localStorage.getItem(KEY)).not.toBeNull();
    });

    it('stores records sorted descending by date', () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      seedRecords([makeRecord(yesterdayStr, 75)]);

      service.recordTodayScore(makeScore(), LAT, LNG);

      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records[0].date >= stored.records[1].date).toBeTrue();
    });

    it('prunes records older than 30 days', () => {
      const old = new Date();
      old.setUTCDate(old.getUTCDate() - 31);
      const oldDate = old.toISOString().slice(0, 10);
      seedRecords([makeRecord(oldDate, 60)]);

      service.recordTodayScore(makeScore(), LAT, LNG);

      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records.every((r: DailyScoreRecord) => r.date !== oldDate)).toBeTrue();
    });

    it('retains records exactly 30 days old (boundary)', () => {
      const boundary = new Date();
      boundary.setUTCDate(boundary.getUTCDate() - 29);
      const boundaryDate = boundary.toISOString().slice(0, 10);
      seedRecords([makeRecord(boundaryDate, 65)]);

      service.recordTodayScore(makeScore(), LAT, LNG);

      const stored = JSON.parse(localStorage.getItem(KEY)!);
      expect(stored.records.some((r: DailyScoreRecord) => r.date === boundaryDate)).toBeTrue();
    });
  });

  // ── getHistory ──────────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('returns an empty slice when no history exists', () => {
      const slice = service.getHistory(LAT, LNG, 7);
      expect(slice.records).toEqual([]);
      expect(slice.highScore).toBe(0);
      expect(slice.lowScore).toBe(0);
      expect(slice.averageScore).toBe(0);
    });

    it('returns records within the requested 7-day window', () => {
      const today = new Date().toISOString().slice(0, 10);
      seedRecords([makeRecord(today, 82)]);
      const slice = service.getHistory(LAT, LNG, 7);
      expect(slice.records.length).toBe(1);
      expect(slice.records[0].score).toBe(82);
    });

    it('excludes records outside the time window', () => {
      const old = new Date();
      old.setUTCDate(old.getUTCDate() - 8);
      const oldDate = old.toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      seedRecords([makeRecord(today, 82), makeRecord(oldDate, 60)]);

      const slice = service.getHistory(LAT, LNG, 7);
      expect(slice.records.every(r => r.date !== oldDate)).toBeTrue();
    });

    it('correctly identifies high and low scores', () => {
      const today = new Date().toISOString().slice(0, 10);
      const d1 = new Date(); d1.setUTCDate(d1.getUTCDate() - 1);
      const d2 = new Date(); d2.setUTCDate(d2.getUTCDate() - 2);
      seedRecords([
        makeRecord(today, 82),
        makeRecord(d1.toISOString().slice(0, 10), 91),
        makeRecord(d2.toISOString().slice(0, 10), 55),
      ]);

      const slice = service.getHistory(LAT, LNG, 7);
      expect(slice.highScore).toBe(91);
      expect(slice.lowScore).toBe(55);
    });

    it('computes the average score', () => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      seedRecords([
        makeRecord(today, 80),
        makeRecord(yesterday.toISOString().slice(0, 10), 60),
      ]);

      const slice = service.getHistory(LAT, LNG, 7);
      expect(slice.averageScore).toBe(70);
    });

    it('returns records sorted descending by date', () => {
      const today = new Date().toISOString().slice(0, 10);
      const d1 = new Date(); d1.setUTCDate(d1.getUTCDate() - 1);
      const d2 = new Date(); d2.setUTCDate(d2.getUTCDate() - 2);
      // Seed in ascending order to verify sorting
      seedRecords([
        makeRecord(d2.toISOString().slice(0, 10), 70),
        makeRecord(d1.toISOString().slice(0, 10), 75),
        makeRecord(today, 82),
      ]);

      const slice = service.getHistory(LAT, LNG, 7);
      expect(slice.records[0].date).toBe(today);
    });

    it('supports 14-day and 30-day windows', () => {
      const records: DailyScoreRecord[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        records.push(makeRecord(d.toISOString().slice(0, 10), 70 + i));
      }
      seedRecords(records);

      expect(service.getHistory(LAT, LNG, 7).records.length).toBe(7);
      expect(service.getHistory(LAT, LNG, 14).records.length).toBe(14);
      expect(service.getHistory(LAT, LNG, 30).records.length).toBe(30);
    });
  });

  // ── clear ───────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all moonbite_history_* keys', () => {
      localStorage.setItem('moonbite_history_37.3382_-121.8863', '{}');
      localStorage.setItem('moonbite_history_40.7128_-74.006', '{}');

      service.clear();

      expect(localStorage.getItem('moonbite_history_37.3382_-121.8863')).toBeNull();
      expect(localStorage.getItem('moonbite_history_40.7128_-74.006')).toBeNull();
    });

    it('does not remove unrelated keys', () => {
      localStorage.setItem('moonbite_saved_locations', '[{}]');
      service.clear();
      expect(localStorage.getItem('moonbite_saved_locations')).not.toBeNull();
      localStorage.removeItem('moonbite_saved_locations');
    });
  });
});
