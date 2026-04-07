import { TestBed } from '@angular/core/testing';
import { PreferencesService } from './preferences.service';

const STORAGE_KEY = 'moonbite_preferences';

describe('PreferencesService', () => {
  let service: PreferencesService;

  function freshService(): PreferencesService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(PreferencesService);
  }

  beforeEach(() => {
    localStorage.clear();
    service = freshService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── Creation and defaults ─────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default unitSystem to imperial', () => {
    expect(service.unitSystem()).toBe('imperial');
  });

  it('should default timeFormat to 12h', () => {
    expect(service.timeFormat()).toBe('12h');
  });

  it('should expose preferences signal with both defaults', () => {
    expect(service.preferences()).toEqual({ unitSystem: 'imperial', timeFormat: '12h' });
  });

  // ─── setUnitSystem() ───────────────────────────────────────────────────────

  it('should update unitSystem signal when setUnitSystem is called', () => {
    service.setUnitSystem('imperial');
    expect(service.unitSystem()).toBe('imperial');
  });

  it('should reflect unitSystem change in preferences signal', () => {
    service.setUnitSystem('imperial');
    expect(service.preferences().unitSystem).toBe('imperial');
  });

  it('should persist unitSystem change to localStorage', () => {
    service.setUnitSystem('imperial');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.unitSystem).toBe('imperial');
  });

  it('should switch unitSystem back to metric', () => {
    service.setUnitSystem('imperial');
    service.setUnitSystem('metric');
    expect(service.unitSystem()).toBe('metric');
  });

  // ─── setTimeFormat() ──────────────────────────────────────────────────────

  it('should update timeFormat signal when setTimeFormat is called', () => {
    service.setTimeFormat('24h');
    expect(service.timeFormat()).toBe('24h');
  });

  it('should reflect timeFormat change in preferences signal', () => {
    service.setTimeFormat('24h');
    expect(service.preferences().timeFormat).toBe('24h');
  });

  it('should persist timeFormat change to localStorage', () => {
    service.setTimeFormat('24h');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.timeFormat).toBe('24h');
  });

  it('should switch timeFormat back to 12h', () => {
    service.setTimeFormat('24h');
    service.setTimeFormat('12h');
    expect(service.timeFormat()).toBe('12h');
  });

  // ─── convertTemperature() ─────────────────────────────────────────────────

  it('should return celsius unchanged in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.convertTemperature(100)).toBe(100);
  });

  it('should convert 0°C to 32°F in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertTemperature(0)).toBe(32);
  });

  it('should convert 100°C to 212°F in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertTemperature(100)).toBe(212);
  });

  it('should convert 24.5°C to approx 76.1°F in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertTemperature(24.5)).toBeCloseTo(76.1, 1);
  });

  it('should convert -40°C to -40°F in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertTemperature(-40)).toBeCloseTo(-40, 1);
  });

  // ─── convertWindSpeed() ───────────────────────────────────────────────────

  it('should return km/h unchanged in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.convertWindSpeed(100)).toBe(100);
  });

  it('should convert 18.3 km/h to approx 11.4 mph in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertWindSpeed(18.3)).toBeCloseTo(11.4, 1);
  });

  it('should convert 0 km/h to 0 mph in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertWindSpeed(0)).toBeCloseTo(0, 2);
  });

  it('should convert 100 km/h to approx 62.1 mph in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertWindSpeed(100)).toBeCloseTo(62.1, 0);
  });

  // ─── convertPressure() ────────────────────────────────────────────────────

  it('should return hPa unchanged in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.convertPressure(1013.5)).toBe(1013.5);
  });

  it('should convert 1013.5 hPa to approx 29.93 inHg in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertPressure(1013.5)).toBeCloseTo(29.93, 2);
  });

  it('should convert 0 hPa to 0 inHg in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertPressure(0)).toBeCloseTo(0, 2);
  });

  // ─── convertPrecipitation() ───────────────────────────────────────────────

  it('should return mm unchanged in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.convertPrecipitation(25.4)).toBe(25.4);
  });

  it('should convert 25.4 mm to exactly 1.0 in in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertPrecipitation(25.4)).toBeCloseTo(1.0, 3);
  });

  it('should convert 0 mm to 0 in in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertPrecipitation(0)).toBeCloseTo(0, 3);
  });

  it('should convert 50.8 mm to 2.0 in in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.convertPrecipitation(50.8)).toBeCloseTo(2.0, 2);
  });

  // ─── getTemperatureUnit() ────────────────────────────────────────────────

  it('should return °C in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.getTemperatureUnit()).toBe('°C');
  });

  it('should return °F in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.getTemperatureUnit()).toBe('°F');
  });

  // ─── getWindSpeedUnit() ──────────────────────────────────────────────────

  it('should return km/h in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.getWindSpeedUnit()).toBe('km/h');
  });

  it('should return mph in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.getWindSpeedUnit()).toBe('mph');
  });

  // ─── getPressureUnit() ───────────────────────────────────────────────────

  it('should return hPa in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.getPressureUnit()).toBe('hPa');
  });

  it('should return inHg in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.getPressureUnit()).toBe('inHg');
  });

  // ─── getPrecipitationUnit() ──────────────────────────────────────────────

  it('should return mm in metric mode', () => {
    service.setUnitSystem('metric');
    expect(service.getPrecipitationUnit()).toBe('mm');
  });

  it('should return in in imperial mode', () => {
    service.setUnitSystem('imperial');
    expect(service.getPrecipitationUnit()).toBe('in');
  });

  // ─── formatTime() ────────────────────────────────────────────────────────

  it('should format 14:30 UTC as "2:30 PM" in 12h mode', () => {
    expect(service.formatTime('2025-01-15T14:30:00Z')).toBe('2:30 PM');
  });

  it('should format 14:30 UTC as "14:30" in 24h mode', () => {
    service.setTimeFormat('24h');
    expect(service.formatTime('2025-01-15T14:30:00Z')).toBe('14:30');
  });

  it('should format 00:00 UTC as "12:00 AM" in 12h mode', () => {
    expect(service.formatTime('2025-01-15T00:00:00Z')).toBe('12:00 AM');
  });

  it('should format 00:00 UTC as "00:00" in 24h mode', () => {
    service.setTimeFormat('24h');
    expect(service.formatTime('2025-01-15T00:00:00Z')).toBe('00:00');
  });

  it('should format 12:00 UTC as "12:00 PM" in 12h mode', () => {
    expect(service.formatTime('2025-01-15T12:00:00Z')).toBe('12:00 PM');
  });

  it('should format 12:00 UTC as "12:00" in 24h mode', () => {
    service.setTimeFormat('24h');
    expect(service.formatTime('2025-01-15T12:00:00Z')).toBe('12:00');
  });

  it('should format 09:05 UTC as "9:05 AM" in 12h mode', () => {
    expect(service.formatTime('2025-06-01T09:05:00Z')).toBe('9:05 AM');
  });

  it('should format 09:05 UTC as "09:05" in 24h mode', () => {
    service.setTimeFormat('24h');
    expect(service.formatTime('2025-06-01T09:05:00Z')).toBe('09:05');
  });

  it('should format 23:59 UTC as "11:59 PM" in 12h mode', () => {
    expect(service.formatTime('2025-01-15T23:59:00Z')).toBe('11:59 PM');
  });

  it('should format 23:59 UTC as "23:59" in 24h mode', () => {
    service.setTimeFormat('24h');
    expect(service.formatTime('2025-01-15T23:59:00Z')).toBe('23:59');
  });

  // ─── localStorage persistence ────────────────────────────────────────────

  it('should load saved unitSystem from localStorage on init', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unitSystem: 'imperial', timeFormat: '12h' }));
    const fresh = freshService();
    expect(fresh.unitSystem()).toBe('imperial');
  });

  it('should load saved timeFormat from localStorage on init', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unitSystem: 'metric', timeFormat: '24h' }));
    const fresh = freshService();
    expect(fresh.timeFormat()).toBe('24h');
  });

  it('should persist both fields when either preference changes', () => {
    service.setUnitSystem('imperial');
    service.setTimeFormat('24h');
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({ unitSystem: 'imperial', timeFormat: '24h' });
  });

  it('should fall back to defaults when localStorage contains corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
    const fresh = freshService();
    expect(fresh.preferences()).toEqual({ unitSystem: 'imperial', timeFormat: '12h' });
  });

  it('should fall back to defaults when stored object is missing fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    const fresh = freshService();
    expect(fresh.preferences()).toEqual({ unitSystem: 'imperial', timeFormat: '12h' });
  });

  it('should fall back to defaults when stored unitSystem is invalid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unitSystem: 'furlongs', timeFormat: '12h' }));
    const fresh = freshService();
    expect(fresh.unitSystem()).toBe('imperial');
  });

  it('should fall back to defaults when stored timeFormat is invalid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unitSystem: 'metric', timeFormat: 'military' }));
    const fresh = freshService();
    expect(fresh.timeFormat()).toBe('12h');
  });

  it('should fall back to defaults when stored JSON is a non-object primitive', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('a-string-value'));
    const fresh = freshService();
    expect(fresh.preferences()).toEqual({ unitSystem: 'imperial', timeFormat: '12h' });
  });

  // ─── Storage error handling ───────────────────────────────────────────────

  it('should handle localStorage.getItem throwing on init gracefully', () => {
    spyOn(localStorage, 'getItem').and.throwError('SecurityError');
    expect(() => freshService()).not.toThrow();
  });

  it('should use defaults when localStorage.getItem throws', () => {
    spyOn(localStorage, 'getItem').and.throwError('SecurityError');
    const fresh = freshService();
    expect(fresh.preferences()).toEqual({ unitSystem: 'imperial', timeFormat: '12h' });
  });

  it('should not throw when localStorage.setItem throws on setUnitSystem', () => {
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    expect(() => service.setUnitSystem('imperial')).not.toThrow();
  });

  it('should still update the signal even when localStorage.setItem throws', () => {
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    service.setUnitSystem('imperial');
    expect(service.unitSystem()).toBe('imperial');
  });

  it('should not throw when localStorage.setItem throws on setTimeFormat', () => {
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    expect(() => service.setTimeFormat('24h')).not.toThrow();
  });
});
