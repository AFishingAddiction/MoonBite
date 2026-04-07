import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LocationDisplayComponent } from './location-display.component';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { SavedLocationsService } from '../locations/saved-locations.service';
import { SavedLocation } from '../locations/saved-location.model';

describe('LocationDisplayComponent', () => {
  let fixture: ComponentFixture<LocationDisplayComponent>;
  let mockService: jasmine.SpyObj<GeolocationService>;
  let stateSignal: ReturnType<typeof signal<GeolocationState>>;
  let activeLocationSignal: ReturnType<typeof signal<SavedLocation | null>>;
  let savedLocationsService: jasmine.SpyObj<SavedLocationsService>;

  function createState(partial: Partial<GeolocationState>): GeolocationState {
    return { status: 'idle', position: null, error: null, ...partial };
  }

  beforeEach(async () => {
    localStorage.clear();
    stateSignal = signal<GeolocationState>(createState({}));
    activeLocationSignal = signal<SavedLocation | null>(null);

    mockService = jasmine.createSpyObj('GeolocationService', ['requestLocation', 'reset'], {
      state: stateSignal,
    });

    savedLocationsService = jasmine.createSpyObj<SavedLocationsService>(
      'SavedLocationsService',
      ['add', 'setActive'],
      {
        activeLocation: activeLocationSignal.asReadonly(),
        locations: signal<SavedLocation[]>([]).asReadonly(),
      },
    );

    await TestBed.configureTestingModule({
      imports: [LocationDisplayComponent],
      providers: [
        provideRouter([]),
        { provide: GeolocationService, useValue: mockService },
        { provide: SavedLocationsService, useValue: savedLocationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationDisplayComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show "Use My Location" button in idle state', () => {
    const button = fixture.debugElement.query(By.css('[data-testid="request-location-btn"]'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain('Use My Location');
  });

  it('should call requestLocation when button is clicked', () => {
    const button = fixture.debugElement.query(By.css('[data-testid="request-location-btn"]'));
    button.nativeElement.click();
    expect(mockService.requestLocation).toHaveBeenCalled();
  });

  it('should show loading state when status is requesting', () => {
    stateSignal.set(createState({ status: 'requesting' }));
    fixture.detectChanges();
    const loader = fixture.debugElement.query(By.css('[data-testid="location-loading"]'));
    expect(loader).toBeTruthy();
  });

  it('should show coordinates when status is granted', () => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    stateSignal.set(createState({ status: 'granted', position: mockPosition }));
    fixture.detectChanges();
    const coords = fixture.debugElement.query(By.css('[data-testid="location-coords"]'));
    expect(coords).toBeTruthy();
    expect(coords.nativeElement.textContent).toContain('40.7128');
  });

  it('should show denied error message and retry button', () => {
    stateSignal.set(
      createState({ status: 'denied', error: { code: 1 } as GeolocationPositionError })
    );
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('[data-testid="location-error"]'));
    const retry = fixture.debugElement.query(By.css('[data-testid="retry-btn"]'));
    expect(error).toBeTruthy();
    expect(retry).toBeTruthy();
  });

  it('should call requestLocation when retry button is clicked', () => {
    stateSignal.set(
      createState({ status: 'denied', error: { code: 1 } as GeolocationPositionError })
    );
    fixture.detectChanges();
    const retry = fixture.debugElement.query(By.css('[data-testid="retry-btn"]'));
    retry.nativeElement.click();
    expect(mockService.requestLocation).toHaveBeenCalled();
  });

  it('should show unavailable message when geolocation not supported', () => {
    stateSignal.set(createState({ status: 'unavailable' }));
    fixture.detectChanges();
    const msg = fixture.debugElement.query(By.css('[data-testid="location-unavailable"]'));
    expect(msg).toBeTruthy();
  });

  it('should show a "Saved Locations" link', () => {
    const link = fixture.debugElement.query(By.css('.location-display__manage-link'));
    expect(link).toBeTruthy();
  });

  it('should show "Save Location" button when GPS is granted', () => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    stateSignal.set(createState({ status: 'granted', position: mockPosition }));
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('[data-testid="save-location-btn"]'));
    expect(btn).toBeTruthy();
  });

  it('should show save form when "Save Location" is clicked', () => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    stateSignal.set(createState({ status: 'granted', position: mockPosition }));
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-location-btn"]')).nativeElement.click();
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('[data-testid="save-location-form"]'));
    expect(form).toBeTruthy();
  });

  it('should call savedLocations.add when save is confirmed', () => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    stateSignal.set(createState({ status: 'granted', position: mockPosition }));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="save-location-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.debugElement.query(
      By.css('[data-testid="location-name-input"]'),
    ).nativeElement;
    input.value = 'Lake Tahoe';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="confirm-save-btn"]')).nativeElement.click();
    expect(savedLocationsService.add).toHaveBeenCalledWith('Lake Tahoe', 40.7128, -74.006);
  });

  it('should hide save form when cancel is clicked', () => {
    const mockPosition = {
      coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition;
    stateSignal.set(createState({ status: 'granted', position: mockPosition }));
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-location-btn"]')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="cancel-save-btn"]')).nativeElement.click();
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('[data-testid="save-location-form"]'));
    expect(form).toBeNull();
  });

  it('should show active saved location when one is active', () => {
    activeLocationSignal.set({
      id: 'test-id',
      name: 'Lake Tahoe',
      latitude: 39.0968,
      longitude: -120.0324,
      createdAt: '',
    });
    fixture.detectChanges();
    const active = fixture.debugElement.query(By.css('[data-testid="active-saved-location"]'));
    expect(active).toBeTruthy();
    expect(active.nativeElement.textContent).toContain('Lake Tahoe');
  });

  it('should show "Switch to GPS" button when a saved location is active', () => {
    activeLocationSignal.set({
      id: 'test-id',
      name: 'Lake Tahoe',
      latitude: 39.0968,
      longitude: -120.0324,
      createdAt: '',
    });
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('[data-testid="use-gps-btn"]'));
    expect(btn).toBeTruthy();
  });

  it('should call setActive(null) when "Switch to GPS" is clicked', () => {
    activeLocationSignal.set({
      id: 'test-id',
      name: 'Lake Tahoe',
      latitude: 39.0968,
      longitude: -120.0324,
      createdAt: '',
    });
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="use-gps-btn"]')).nativeElement.click();
    expect(savedLocationsService.setActive).toHaveBeenCalledWith(null);
  });
});
