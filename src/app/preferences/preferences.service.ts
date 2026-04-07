import { Injectable, Signal, computed, signal } from '@angular/core';
import { TimeFormat, UnitSystem, UserPreferences } from './preferences.model';

const STORAGE_KEY = 'moonbite_preferences';
const DEFAULT_PREFERENCES: UserPreferences = { unitSystem: 'imperial', timeFormat: '12h' };
const VALID_UNIT_SYSTEMS: readonly UnitSystem[] = ['metric', 'imperial'];
const VALID_TIME_FORMATS: readonly TimeFormat[] = ['12h', '24h'];

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly _preferences = signal<UserPreferences>(this.loadPreferences());

  readonly preferences: Signal<UserPreferences> = this._preferences.asReadonly();

  readonly unitSystem: Signal<UnitSystem> = computed(() => this._preferences().unitSystem);

  readonly timeFormat: Signal<TimeFormat> = computed(() => this._preferences().timeFormat);

  setUnitSystem(system: UnitSystem): void {
    const updated: UserPreferences = { ...this._preferences(), unitSystem: system };
    this._preferences.set(updated);
    this.persistPreferences(updated);
  }

  setTimeFormat(format: TimeFormat): void {
    const updated: UserPreferences = { ...this._preferences(), timeFormat: format };
    this._preferences.set(updated);
    this.persistPreferences(updated);
  }

  convertTemperature(celsius: number): number {
    if (this._preferences().unitSystem === 'imperial') {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  }

  convertWindSpeed(kmh: number): number {
    if (this._preferences().unitSystem === 'imperial') {
      return kmh / 1.60934;
    }
    return kmh;
  }

  convertPressure(hpa: number): number {
    if (this._preferences().unitSystem === 'imperial') {
      return hpa / 33.8639;
    }
    return hpa;
  }

  convertPrecipitation(mm: number): number {
    if (this._preferences().unitSystem === 'imperial') {
      return mm / 25.4;
    }
    return mm;
  }

  getTemperatureUnit(): '°C' | '°F' {
    return this._preferences().unitSystem === 'imperial' ? '°F' : '°C';
  }

  getWindSpeedUnit(): 'km/h' | 'mph' {
    return this._preferences().unitSystem === 'imperial' ? 'mph' : 'km/h';
  }

  getPressureUnit(): 'hPa' | 'inHg' {
    return this._preferences().unitSystem === 'imperial' ? 'inHg' : 'hPa';
  }

  getPrecipitationUnit(): 'mm' | 'in' {
    return this._preferences().unitSystem === 'imperial' ? 'in' : 'mm';
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const mm = String(minutes).padStart(2, '0');

    if (this._preferences().timeFormat === '24h') {
      const hh = String(hours).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    const period = hours < 12 ? 'AM' : 'PM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${mm} ${period}`;
  }

  /**
   * Format a UTC ISO string using an IANA timezone (e.g. "America/New_York").
   * Uses the browser's Intl API to produce a real civil UTC offset.
   * Time format (12h/24h) respects user preference.
   * Returns e.g. "9:30 AM UTC-5" or "09:30 UTC-5" or "8:00 PM UTC+5:30".
   */
  formatTimeInZone(isoString: string, ianaTimezone: string): string {
    const date = new Date(isoString);
    const is24h = this._preferences().timeFormat === '24h';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      hour: is24h ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !is24h,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    return parts
      .map((p) => (p.type === 'timeZoneName' ? p.value.replace('GMT', 'UTC') : p.value))
      .join('')
      .trim();
  }

  /**
   * Format a UTC ISO string as local solar time for the given longitude.
   *
   * Offset = longitude / 15 hours (Local Mean Solar Time).
   * Time format (12h/24h) respects user preference.
   * Appends a UTC offset label: "UTC±0", "UTC+2", "UTC−5", "UTC+5:30", etc.
   */
  formatTimeForLongitude(isoString: string, longitude: number): string {
    const date = new Date(isoString);
    const offsetTotalMinutes = Math.round((longitude / 15) * 60);
    const offsetHours = Math.trunc(offsetTotalMinutes / 60);
    const offsetMins = Math.abs(offsetTotalMinutes % 60);

    let totalMins = date.getUTCHours() * 60 + date.getUTCMinutes() + offsetTotalMinutes;
    totalMins = ((totalMins % 1440) + 1440) % 1440;

    const adjustedHours = Math.floor(totalMins / 60);
    const adjustedMinutes = totalMins % 60;
    const mm = String(adjustedMinutes).padStart(2, '0');

    let timeStr: string;
    if (this._preferences().timeFormat === '24h') {
      timeStr = `${String(adjustedHours).padStart(2, '0')}:${mm}`;
    } else {
      const period = adjustedHours < 12 ? 'AM' : 'PM';
      const hour12 = adjustedHours % 12 === 0 ? 12 : adjustedHours % 12;
      timeStr = `${hour12}:${mm} ${period}`;
    }

    let offsetLabel: string;
    if (offsetTotalMinutes === 0) {
      offsetLabel = 'UTC\u00B10';
    } else {
      const sign = offsetHours >= 0 ? '+' : '\u2212';
      const absHours = Math.abs(offsetHours);
      offsetLabel =
        offsetMins === 0
          ? `UTC${sign}${absHours}`
          : `UTC${sign}${absHours}:${String(offsetMins).padStart(2, '0')}`;
    }

    return `${timeStr} ${offsetLabel}`;
  }

  private loadPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PREFERENCES;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFERENCES;

      const obj = parsed as Record<string, unknown>;
      const unitSystem = obj['unitSystem'];
      const timeFormat = obj['timeFormat'];

      if (
        !VALID_UNIT_SYSTEMS.includes(unitSystem as UnitSystem) ||
        !VALID_TIME_FORMATS.includes(timeFormat as TimeFormat)
      ) {
        return DEFAULT_PREFERENCES;
      }

      return {
        unitSystem: unitSystem as UnitSystem,
        timeFormat: timeFormat as TimeFormat,
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  private persistPreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage unavailable — silently ignore
    }
  }
}
