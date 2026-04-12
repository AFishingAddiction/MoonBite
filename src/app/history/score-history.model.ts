/** A single day's recorded score for a location. */
export interface DailyScoreRecord {
  readonly date: string;        // YYYY-MM-DD
  readonly score: number;       // 0–100
  readonly moonPhase: string;
  readonly moonEmoji: string;
  readonly factors: {
    readonly moon: number;
    readonly solunar: number;
    readonly weather: number;
  };
}

/** All recorded scores for a single location. */
export interface LocationHistory {
  readonly latitude: number;
  readonly longitude: number;
  readonly records: DailyScoreRecord[];
}

/** Query result for a time-range view. */
export interface HistorySlice {
  readonly records: DailyScoreRecord[];
  readonly highScore: number;
  readonly lowScore: number;
  readonly highDate: string;
  readonly lowDate: string;
  readonly averageScore: number;
}
