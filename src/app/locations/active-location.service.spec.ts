import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActiveLocationService } from './active-location.service';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { SavedLocationsService } from './saved-locations.service';
import { SavedLocation } from './saved-location.model';

function makeGrantedGeoState(lat = 40.7128, lng = -74.006): GeolocationState {
  return {
    status: 'granted',
    position: {
      coords: { latitude: lat, longitude: lng } as GeolocationCoordinates,
      timestamp: 0,
    } as GeolocationPosition,
    error: null,
  };
}

describe('ActiveLocationService', () => {
  let service: ActiveLocationService;
  let geoState: ReturnType<typeof signal<GeolocationState>>;
  let activeLocationSignal: ReturnType<typeof signal<SavedLocation | null>>;

  beforeEach(() => {
    localStorage.clear();
    geoState = signal<GeolocationState>({ status: 'idle', position: null, error: null });
    activeLocationSignal = signal<SavedLocation | null>(null);

    TestBed.configureTestingModule({
      providers: [
        ActiveLocationService,
        {
          provide: GeolocationService,
          useValue: { state: geoState.asReadonly() },
        },
        {
          provide: SavedLocationsService,
          useValue: {
            activeLocation: activeLocationSignal.asReadonly(),
            locations: signal<SavedLocation[]>([]).asReadonly(),
          },
        },
      ],
    });

    service = TestBed.inject(ActiveLocationService);
  });

  afterEach(() => localStorage.clear());

  // ─── coords ────────────────────────────────────────────────────────────────

  it('should return null when GPS is idle and no saved location is active', () => {
    expect(service.coords()).toBeNull();
  });

  it('should return GPS coords when granted and no saved location is active', () => {
    geoState.set(makeGrantedGeoState(40.7128, -74.006));
    const c = service.coords();
    expect(c).not.toBeNull();
    expect(c!.latitude).toBe(40.7128);
    expect(c!.longitude).toBe(-74.006);
    expect(c!.name).toBeNull();
  });

  it('should return saved location coords when one is active', () => {
    activeLocationSignal.set({
      id: '1',
      name: 'Lake Tahoe',
      latitude: 39.0968,
      longitude: -120.0324,
      createdAt: '',
    });
    const c = service.coords();
    expect(c).not.toBeNull();
    expect(c!.latitude).toBe(39.0968);
    expect(c!.longitude).toBe(-120.0324);
    expect(c!.name).toBe('Lake Tahoe');
  });

  it('should prefer saved location over GPS when both are available', () => {
    geoState.set(makeGrantedGeoState(40.71, -74.01));
    activeLocationSignal.set({
      id: '1',
      name: 'Lake Tahoe',
      latitude: 39.0968,
      longitude: -120.0324,
      createdAt: '',
    });
    const c = service.coords();
    expect(c!.latitude).toBe(39.0968);
    expect(c!.name).toBe('Lake Tahoe');
  });

  // ─── status ────────────────────────────────────────────────────────────────

  it('should return GPS status when no saved location is active', () => {
    geoState.set({ status: 'requesting', position: null, error: null });
    expect(service.status()).toBe('requesting');
  });

  it('should return "granted" when a saved location is active regardless of GPS status', () => {
    // GPS is denied
    geoState.set({ status: 'denied', position: null, error: null });
    activeLocationSignal.set({ id: '1', name: 'Spot', latitude: 10, longitude: 20, createdAt: '' });
    expect(service.status()).toBe('granted');
  });

  // ─── isLocating ────────────────────────────────────────────────────────────

  it('should be true when GPS is idle and no saved location is active', () => {
    // 'idle' means no location permission granted yet — treated as "locating"
    geoState.set({ status: 'idle', position: null, error: null });
    expect(service.isLocating()).toBeTrue();
  });

  it('should be true when GPS status is requesting', () => {
    geoState.set({ status: 'requesting', position: null, error: null });
    expect(service.isLocating()).toBeTrue();
  });

  it('should be false when a saved location is active (even if GPS is requesting)', () => {
    geoState.set({ status: 'requesting', position: null, error: null });
    activeLocationSignal.set({ id: '1', name: 'Spot', latitude: 10, longitude: 20, createdAt: '' });
    expect(service.isLocating()).toBeFalse();
  });

  // ─── hasError ──────────────────────────────────────────────────────────────

  it('should be true when GPS is denied', () => {
    geoState.set({ status: 'denied', position: null, error: null });
    expect(service.hasError()).toBeTrue();
  });

  it('should be true when GPS is unavailable', () => {
    geoState.set({ status: 'unavailable', position: null, error: null });
    expect(service.hasError()).toBeTrue();
  });

  it('should be false when a saved location is active (even if GPS is denied)', () => {
    geoState.set({ status: 'denied', position: null, error: null });
    activeLocationSignal.set({ id: '1', name: 'Spot', latitude: 10, longitude: 20, createdAt: '' });
    expect(service.hasError()).toBeFalse();
  });

  it('should be false when GPS is granted', () => {
    geoState.set(makeGrantedGeoState());
    expect(service.hasError()).toBeFalse();
  });
});
