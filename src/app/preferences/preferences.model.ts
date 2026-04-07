export type UnitSystem = 'metric' | 'imperial';
export type TimeFormat = '12h' | '24h';

export interface UserPreferences {
  readonly unitSystem: UnitSystem;
  readonly timeFormat: TimeFormat;
}
