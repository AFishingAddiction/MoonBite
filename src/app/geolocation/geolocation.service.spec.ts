import { TestBed } from '@angular/core/testing';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let mockGeolocation: jasmine.SpyObj<Geolocation>;
  let geolocationSpy: jasmine.Spy;

  beforeEach(() => {
    mockGeolocation = jasmine.createSpyObj('Geolocation', ['getCurrentPosition']);

    TestBed.configureTestingModule({
      providers: [GeolocationService],
    });

    service = TestBed.inject(GeolocationService);
    geolocationSpy = spyOnProperty(navigator, 'geolocation', 'get').and.returnValue(
      mockGeolocation
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start in idle state', () => {
    expect(service.state().status).toBe('idle');
    expect(service.state().position).toBeNull();
    expect(service.state().error).toBeNull();
  });

  it('should transition to requesting state when requestLocation is called', () => {
    mockGeolocation.getCurrentPosition.and.callFake(() => {
      // Don't call callbacks — leave in requesting state
    });

    service.requestLocation();
    expect(service.state().status).toBe('requesting');
  });

  it('should transition to granted state on successful position', done => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;

    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    service.requestLocation();

    setTimeout(() => {
      expect(service.state().status).toBe('granted');
      expect(service.state().position).toEqual(mockPosition);
      done();
    }, 0);
  });

  it('should transition to denied state when permission is denied', done => {
    const mockError = { code: 1, message: 'User denied Geolocation' } as GeolocationPositionError;

    mockGeolocation.getCurrentPosition.and.callFake(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error(mockError);
      }
    );

    service.requestLocation();

    setTimeout(() => {
      expect(service.state().status).toBe('denied');
      expect(service.state().error).toEqual(mockError);
      done();
    }, 0);
  });

  it('should transition to error state for non-permission errors', done => {
    const mockError = {
      code: 2,
      message: 'Position unavailable',
    } as GeolocationPositionError;

    mockGeolocation.getCurrentPosition.and.callFake(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error(mockError);
      }
    );

    service.requestLocation();

    setTimeout(() => {
      expect(service.state().status).toBe('error');
      done();
    }, 0);
  });

  it('should transition to unavailable state when geolocation is not supported', () => {
    geolocationSpy.and.returnValue(undefined as unknown as Geolocation);

    service.requestLocation();
    expect(service.state().status).toBe('unavailable');
  });

  it('should reset to idle state', () => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;

    mockGeolocation.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success(mockPosition);
    });

    service.requestLocation();
    service.reset();
    expect(service.state().status).toBe('idle');
    expect(service.state().position).toBeNull();
  });
});
