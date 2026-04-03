import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { LocationDisplayComponent } from './location-display.component';
import { GeolocationService } from '../geolocation/geolocation.service';
import { GeolocationState } from '../geolocation/geolocation.service';

describe('LocationDisplayComponent', () => {
  let fixture: ComponentFixture<LocationDisplayComponent>;
  let mockService: jasmine.SpyObj<GeolocationService>;
  let stateSignal: ReturnType<typeof signal<GeolocationState>>;

  function createState(partial: Partial<GeolocationState>): GeolocationState {
    return { status: 'idle', position: null, error: null, ...partial };
  }

  beforeEach(async () => {
    stateSignal = signal<GeolocationState>(createState({}));
    mockService = jasmine.createSpyObj('GeolocationService', ['requestLocation', 'reset'], {
      state: stateSignal,
    });

    await TestBed.configureTestingModule({
      imports: [LocationDisplayComponent],
      providers: [{ provide: GeolocationService, useValue: mockService }],
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
});
