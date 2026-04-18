/** Data needed to build a shareable message. */
export interface SharePayload {
  /** Composite fishing score 0–100. */
  score: number;
  /** Location name, or null if only GPS coordinates are available. */
  locationName: string | null;
  latitude: number;
  longitude: number;
  /** Moon phase name, e.g. "Waxing Gibbous". */
  phaseName: string;
  /** Moon phase emoji, e.g. "🌔". */
  phaseEmoji: string;
  /** Moon illumination percentage 0–100. */
  illuminationPercent: number;
  /** Best solunar peak time range, e.g. "7:45 AM – 9:15 AM", or null if unavailable. */
  bestPeakTime: string | null;
}

export type ShareResultStatus = 'shared' | 'copied' | 'cancelled' | 'error';

export interface ShareResult {
  readonly status: ShareResultStatus;
  readonly message: string;
}
