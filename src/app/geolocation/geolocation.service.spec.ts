import { TestBed } from '@angular/core/testing';
import { GeolocationService } from './geolocation.service';
import { detectPlatform } from './platform-detector';
import { getRecoveryInstructions } from './recovery-instructions';

function makePermissionStatus(state: PermissionState): PermissionStatus {
  return { state, addEventListener: () => {}, removeEventListener: () => {} } as unknown as PermissionStatus;
}

describe('GeolocationService', () => {
  let service: GeolocationService;
  let mockGeolocation: jasmine.SpyObj<Geolocation>;
  let geolocationSpy: jasmine.Spy;
  let mockPermissions: jasmine.SpyObj<Permissions>;
  let permissionsSpy: jasmine.Spy;

  beforeEach(() => {
    mockGeolocation = jasmine.createSpyObj('Geolocation', ['getCurrentPosition']);
    mockPermissions = jasmine.createSpyObj('Permissions', ['query']);

    TestBed.configureTestingModule({ providers: [GeolocationService] });
    service = TestBed.inject(GeolocationService);

    geolocationSpy = spyOnProperty(navigator, 'geolocation', 'get').and.returnValue(mockGeolocation);
    permissionsSpy = spyOnProperty(navigator, 'permissions', 'get').and.returnValue(mockPermissions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start in idle state', () => {
    expect(service.state().status).toBe('idle');
    expect(service.state().position).toBeNull();
    expect(service.state().error).toBeNull();
  });

  it('should reset to idle state', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('granted')));
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });
    await service.requestLocation();
    service.reset();
    expect(service.state().status).toBe('idle');
    expect(service.state().position).toBeNull();
  });

  // Feature 24: checking-permission status
  it('should set status to checking-permission while awaiting permissions query', async () => {
    let resolveQuery!: (v: PermissionStatus) => void;
    mockPermissions.query.and.returnValue(
      new Promise<PermissionStatus>(res => {
        resolveQuery = res;
      })
    );

    const promise = service.requestLocation();
    expect(service.state().status).toBe('checking-permission');

    resolveQuery(makePermissionStatus('prompt'));
    mockGeolocation.getCurrentPosition.and.callFake(() => {});
    await promise;
  });

  // Feature 24: denied-previously
  it('should set status to denied-previously when Permissions API returns denied', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));

    await service.requestLocation();

    expect(service.state().status).toBe('denied-previously');
    expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('should store permissionState in state when denied-previously', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));

    await service.requestLocation();

    expect(service.state().permissionState).toBe('denied');
  });

  it('should store platform in state when denied-previously', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));

    await service.requestLocation();

    expect(['android', 'ios', 'desktop']).toContain(service.state().platform!);
  });

  // Feature 24: prompt -> getCurrentPosition
  it('should call getCurrentPosition when permission is prompt', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('prompt')));
    mockGeolocation.getCurrentPosition.and.callFake(() => {});

    await service.requestLocation();

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('should transition to requesting state before calling getCurrentPosition on prompt', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('prompt')));

    let capturedStatus: string | undefined;
    mockGeolocation.getCurrentPosition.and.callFake(() => {
      capturedStatus = service.state().status;
    });

    await service.requestLocation();

    expect(capturedStatus).toBe('requesting');
  });

  it('should transition to granted state on successful position (permission prompt)', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('prompt')));
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    await service.requestLocation();

    expect(service.state().status).toBe('granted');
    expect(service.state().position).toEqual(mockPosition);
  });

  it('should transition to denied when getCurrentPosition errors with code 1 (prompt flow)', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('prompt')));
    const mockError = { code: 1, message: 'User denied Geolocation' } as GeolocationPositionError;
    mockGeolocation.getCurrentPosition.and.callFake(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error(mockError);
      }
    );

    await service.requestLocation();

    expect(service.state().status).toBe('denied');
    expect(service.state().error).toEqual(mockError);
  });

  it('should transition to error for non-permission errors', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('prompt')));
    const mockError = {
      code: 2,
      message: 'Position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;
    mockGeolocation.getCurrentPosition.and.callFake(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error(mockError);
      }
    );

    await service.requestLocation();

    expect(service.state().status).toBe('error');
  });

  // Feature 24: granted -> getCurrentPosition
  it('should call getCurrentPosition when permission is already granted', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('granted')));
    mockGeolocation.getCurrentPosition.and.callFake(() => {});

    await service.requestLocation();

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('should transition to granted on successful position (pre-granted)', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('granted')));
    const mockPosition = {
      coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 5 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    await service.requestLocation();

    expect(service.state().status).toBe('granted');
    expect(service.state().position).toEqual(mockPosition);
  });

  // Feature 24: Permissions API unavailable fallback
  it('should fall back to getCurrentPosition when navigator.permissions is unavailable', async () => {
    permissionsSpy.and.returnValue(undefined as unknown as Permissions);
    mockGeolocation.getCurrentPosition.and.callFake(() => {});

    await service.requestLocation();

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('should NOT set checking-permission when Permissions API is unavailable', async () => {
    permissionsSpy.and.returnValue(undefined as unknown as Permissions);

    const statuses: string[] = [];
    mockGeolocation.getCurrentPosition.and.callFake(() => {
      statuses.push(service.state().status);
    });

    await service.requestLocation();

    expect(statuses).not.toContain('checking-permission');
  });

  it('should transition to granted when fallback succeeds (no Permissions API)', async () => {
    permissionsSpy.and.returnValue(undefined as unknown as Permissions);
    const mockPosition = {
      coords: { latitude: 35.6762, longitude: 139.6503, accuracy: 20 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    await service.requestLocation();

    expect(service.state().status).toBe('granted');
  });

  it('should set unavailable when geolocation API is not supported', async () => {
    geolocationSpy.and.returnValue(undefined as unknown as Geolocation);

    await service.requestLocation();

    expect(service.state().status).toBe('unavailable');
  });

  // Feature 24: platform in state
  it('should store platform in state after a successful grant', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('granted')));
    const mockPosition = {
      coords: { latitude: 0, longitude: 0, accuracy: 1 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    await service.requestLocation();

    expect(['android', 'ios', 'desktop']).toContain(service.state().platform!);
  });

  // Feature 24: retryLocation()
  it('should expose a retryLocation() method', () => {
    expect(typeof (service as unknown as { retryLocation: unknown }).retryLocation).toBe('function');
  });

  it('retryLocation should call getCurrentPosition when permission is now granted', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));
    await service.requestLocation();
    expect(service.state().status).toBe('denied-previously');

    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('granted')));
    mockGeolocation.getCurrentPosition.and.callFake(() => {});

    await (service as unknown as { retryLocation(): Promise<void> }).retryLocation();

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('retryLocation should stay denied-previously if still denied', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));
    await service.requestLocation();

    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));
    await (service as unknown as { retryLocation(): Promise<void> }).retryLocation();

    expect(service.state().status).toBe('denied-previously');
    expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('retryLocation should transition to granted when permission becomes allowed', async () => {
    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('denied')));
    await service.requestLocation();

    mockPermissions.query.and.returnValue(Promise.resolve(makePermissionStatus('granted')));
    const mockPosition = {
      coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 8 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    await (service as unknown as { retryLocation(): Promise<void> }).retryLocation();

    expect(service.state().status).toBe('granted');
    expect(service.state().position).toEqual(mockPosition);
  });
});

// ---------------------------------------------------------------------------
// detectPlatform()
// ---------------------------------------------------------------------------

describe('detectPlatform', () => {
  let uaSpy: jasmine.Spy;

  beforeEach(() => {
    uaSpy = spyOnProperty(navigator, 'userAgent', 'get');
  });

  it('should return android for an Android Chrome UA string', () => {
    uaSpy.and.returnValue(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36'
    );
    expect(detectPlatform()).toBe('android');
  });

  it('should return ios for an iPhone UA string', () => {
    uaSpy.and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 Version/16.4 Mobile/15E148 Safari/604.1'
    );
    expect(detectPlatform()).toBe('ios');
  });

  it('should return ios for an iPad UA string', () => {
    uaSpy.and.returnValue(
      'Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X) AppleWebKit/605.1.15 Version/16.4 Mobile/15E148 Safari/604.1'
    );
    expect(detectPlatform()).toBe('ios');
  });

  it('should return desktop for a macOS Safari UA string', () => {
    uaSpy.and.returnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 Version/16.4 Safari/605.1.15'
    );
    expect(detectPlatform()).toBe('desktop');
  });

  it('should return desktop for a Windows Chrome UA string', () => {
    uaSpy.and.returnValue(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/112.0.0.0 Safari/537.36'
    );
    expect(detectPlatform()).toBe('desktop');
  });

  it('should return desktop for an unknown UA string', () => {
    uaSpy.and.returnValue('SomeObscureBrowser/1.0');
    expect(detectPlatform()).toBe('desktop');
  });
});

// ---------------------------------------------------------------------------
// getRecoveryInstructions()
// ---------------------------------------------------------------------------

describe('getRecoveryInstructions', () => {
  it('should return a non-empty title and steps for android', () => {
    const result = getRecoveryInstructions('android');
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('should mention settings or permissions in android instructions', () => {
    const result = getRecoveryInstructions('android');
    const allText = [result.title, ...result.steps].join(' ');
    expect(allText).toMatch(/settings|location|permission/i);
  });

  it('should return a non-empty title and steps for ios', () => {
    const result = getRecoveryInstructions('ios');
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('should mention settings or privacy in ios instructions', () => {
    const result = getRecoveryInstructions('ios');
    const allText = [result.title, ...result.steps].join(' ');
    expect(allText).toMatch(/settings|safari|location|privacy/i);
  });

  it('should return different steps for ios vs android', () => {
    expect(getRecoveryInstructions('android').steps).not.toEqual(
      getRecoveryInstructions('ios').steps
    );
  });

  it('should return a non-empty title and steps for desktop', () => {
    const result = getRecoveryInstructions('desktop');
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('should mention address bar or browser in desktop instructions', () => {
    const result = getRecoveryInstructions('desktop');
    const allText = [result.title, ...result.steps].join(' ');
    expect(allText).toMatch(/browser|address bar|lock|settings|location|permission/i);
  });

  it('should handle an unknown platform gracefully', () => {
    const result = getRecoveryInstructions('unknown-platform');
    expect(result).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(Array.isArray(result.steps)).toBeTrue();
  });
});
