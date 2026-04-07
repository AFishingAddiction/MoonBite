import { TestBed } from '@angular/core/testing';
import { SavedLocationsService } from './saved-locations.service';

const LOCATIONS_KEY = 'moonbite_saved_locations';
const ACTIVE_KEY = 'moonbite_active_location_id';

describe('SavedLocationsService', () => {
  let service: SavedLocationsService;

  function freshService(): SavedLocationsService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SavedLocationsService);
  }

  beforeEach(() => {
    localStorage.clear();
    service = freshService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── Creation ──────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty locations', () => {
    expect(service.locations()).toEqual([]);
  });

  it('should start with no active location', () => {
    expect(service.activeLocation()).toBeNull();
  });

  // ─── add() ─────────────────────────────────────────────────────────────────

  it('should add a location and return it', () => {
    const result = service.add('Lake Tahoe', 39.0968, -120.0324);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Lake Tahoe');
    expect(result!.latitude).toBe(39.0968);
    expect(result!.longitude).toBe(-120.0324);
    expect(result!.id).toBeTruthy();
    expect(result!.createdAt).toBeTruthy();
  });

  it('should reflect added location in the locations signal', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    expect(service.locations().length).toBe(1);
    expect(service.locations()[0].name).toBe('Lake Tahoe');
  });

  it('should trim the location name', () => {
    service.add('  Lake Tahoe  ', 39.0968, -120.0324);
    expect(service.locations()[0].name).toBe('Lake Tahoe');
  });

  it('should return null for an empty name', () => {
    const result = service.add('', 39.0, -120.0);
    expect(result).toBeNull();
    expect(service.locations()).toEqual([]);
  });

  it('should return null for a whitespace-only name', () => {
    const result = service.add('   ', 39.0, -120.0);
    expect(result).toBeNull();
    expect(service.locations()).toEqual([]);
  });

  it('should enforce the maximum locations limit', () => {
    for (let i = 0; i < SavedLocationsService.MAX_LOCATIONS; i++) {
      service.add(`Location ${i}`, i, i);
    }
    const overflow = service.add('One Too Many', 99, 99);
    expect(overflow).toBeNull();
    expect(service.locations().length).toBe(SavedLocationsService.MAX_LOCATIONS);
  });

  it('should assign unique IDs to each location', () => {
    service.add('Spot A', 10, 20);
    service.add('Spot B', 30, 40);
    const ids = service.locations().map(l => l.id);
    expect(new Set(ids).size).toBe(2);
  });

  // ─── remove() ──────────────────────────────────────────────────────────────

  it('should remove a location by id', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.remove(id);
    expect(service.locations()).toEqual([]);
  });

  it('should not affect other locations when one is removed', () => {
    service.add('Spot A', 10, 20);
    service.add('Spot B', 30, 40);
    const idA = service.locations()[0].id;
    service.remove(idA);
    expect(service.locations().length).toBe(1);
    expect(service.locations()[0].name).toBe('Spot B');
  });

  it('should clear active location when the active one is removed', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.setActive(id);
    service.remove(id);
    expect(service.activeLocation()).toBeNull();
  });

  it('should not clear active when a different location is removed', () => {
    service.add('Spot A', 10, 20);
    service.add('Spot B', 30, 40);
    const idA = service.locations()[0].id;
    const idB = service.locations()[1].id;
    service.setActive(idA);
    service.remove(idB);
    expect(service.activeLocation()?.id).toBe(idA);
  });

  // ─── setActive() ───────────────────────────────────────────────────────────

  it('should set the active location', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.setActive(id);
    expect(service.activeLocation()).not.toBeNull();
    expect(service.activeLocation()!.name).toBe('Lake Tahoe');
    expect(service.activeLocation()!.id).toBe(id);
  });

  it('should clear the active location when setActive(null) is called', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.setActive(id);
    service.setActive(null);
    expect(service.activeLocation()).toBeNull();
  });

  it('should switch the active location', () => {
    service.add('Spot A', 10, 20);
    service.add('Spot B', 30, 40);
    const idA = service.locations()[0].id;
    const idB = service.locations()[1].id;
    service.setActive(idA);
    service.setActive(idB);
    expect(service.activeLocation()!.name).toBe('Spot B');
  });

  // ─── localStorage persistence ───────────────────────────────────────────────

  it('should persist locations to localStorage on add', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const raw = localStorage.getItem(LOCATIONS_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBeTrue();
    expect(parsed[0].name).toBe('Lake Tahoe');
  });

  it('should persist active id to localStorage on setActive', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.setActive(id);
    expect(localStorage.getItem(ACTIVE_KEY)).toBe(id);
  });

  it('should remove active key from localStorage on setActive(null)', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.setActive(id);
    service.setActive(null);
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
  });

  it('should load locations from localStorage on initialisation', () => {
    const stored = [
      { id: 'abc', name: 'Cached Spot', latitude: 40, longitude: -80, createdAt: '2025-01-01T00:00:00.000Z' },
    ];
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(stored));

    const fresh = freshService();
    expect(fresh.locations().length).toBe(1);
    expect(fresh.locations()[0].name).toBe('Cached Spot');
  });

  it('should restore active location from localStorage on initialisation', () => {
    const stored = [
      { id: 'abc', name: 'Cached Spot', latitude: 40, longitude: -80, createdAt: '2025-01-01T00:00:00.000Z' },
    ];
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(stored));
    localStorage.setItem(ACTIVE_KEY, 'abc');

    const fresh = freshService();
    expect(fresh.activeLocation()?.name).toBe('Cached Spot');
  });

  it('should handle corrupt localStorage data gracefully', () => {
    localStorage.setItem(LOCATIONS_KEY, 'not-valid-json');
    const fresh = freshService();
    expect(fresh.locations()).toEqual([]);
    expect(fresh.activeLocation()).toBeNull();
  });

  it('should remove location from localStorage on remove()', () => {
    service.add('Lake Tahoe', 39.0968, -120.0324);
    const id = service.locations()[0].id;
    service.remove(id);
    const raw = localStorage.getItem(LOCATIONS_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual([]);
  });

  it('should return empty array when stored locations data is not an array', () => {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify({ not: 'an array' }));
    const fresh = freshService();
    expect(fresh.locations()).toEqual([]);
  });

  // ─── Storage error handling ────────────────────────────────────────────────

  it('should handle localStorage.getItem throwing on init gracefully', () => {
    spyOn(localStorage, 'getItem').and.throwError('SecurityError');
    const fresh = freshService();
    expect(fresh.locations()).toEqual([]);
    expect(fresh.activeLocation()).toBeNull();
  });

  it('should handle localStorage.setItem throwing in persistLocations gracefully', () => {
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    expect(() => service.add('Spot', 10, 20)).not.toThrow();
  });

  it('should handle localStorage.setItem throwing in persistActiveId gracefully', () => {
    service.add('Spot', 10, 20);
    const id = service.locations()[0].id;
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    expect(() => service.setActive(id)).not.toThrow();
  });

  it('should handle localStorage.removeItem throwing in persistActiveId gracefully', () => {
    spyOn(localStorage, 'removeItem').and.throwError('SecurityError');
    expect(() => service.setActive(null)).not.toThrow();
  });
});
