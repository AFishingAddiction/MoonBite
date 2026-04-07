import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SavedLocationsComponent } from './saved-locations.component';
import { SavedLocationsService } from './saved-locations.service';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { SavedLocation } from './saved-location.model';

function makeLocation(overrides: Partial<SavedLocation> = {}): SavedLocation {
  return {
    id: 'loc-1',
    name: 'Lake Tahoe',
    latitude: 39.0968,
    longitude: -120.0324,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeGrantedState(): GeolocationState {
  return {
    status: 'granted',
    position: {
      coords: { latitude: 40.7128, longitude: -74.006 } as GeolocationCoordinates,
      timestamp: 0,
    } as GeolocationPosition,
    error: null,
  };
}

describe('SavedLocationsComponent', () => {
  let fixture: ComponentFixture<SavedLocationsComponent>;
  let component: SavedLocationsComponent;
  let savedLocationsService: jasmine.SpyObj<SavedLocationsService>;
  let geoState: ReturnType<typeof signal<GeolocationState>>;
  let locationsSignal: ReturnType<typeof signal<SavedLocation[]>>;
  let activeLocationSignal: ReturnType<typeof signal<SavedLocation | null>>;

  beforeEach(async () => {
    localStorage.clear();
    locationsSignal = signal<SavedLocation[]>([]);
    activeLocationSignal = signal<SavedLocation | null>(null);
    geoState = signal<GeolocationState>({ status: 'idle', position: null, error: null });

    savedLocationsService = jasmine.createSpyObj<SavedLocationsService>(
      'SavedLocationsService',
      ['add', 'remove', 'setActive'],
      {
        locations: locationsSignal.asReadonly(),
        activeLocation: activeLocationSignal.asReadonly(),
      },
    );
    savedLocationsService.add.and.callFake((name, lat, lng) => {
      const loc = makeLocation({ id: crypto.randomUUID(), name, latitude: lat, longitude: lng });
      locationsSignal.update(ls => [...ls, loc]);
      return loc;
    });
    savedLocationsService.remove.and.callFake((id: string) => {
      locationsSignal.update(ls => ls.filter(l => l.id !== id));
    });
    savedLocationsService.setActive.and.callFake((id: string | null) => {
      if (id === null) {
        activeLocationSignal.set(null);
      } else {
        const found = locationsSignal().find(l => l.id === id) ?? null;
        activeLocationSignal.set(found);
      }
    });

    await TestBed.configureTestingModule({
      imports: [SavedLocationsComponent],
      providers: [
        provideRouter([]),
        { provide: SavedLocationsService, useValue: savedLocationsService },
        { provide: GeolocationService, useValue: { state: geoState.asReadonly() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  // ─── Creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title', () => {
    const title = fixture.debugElement.query(By.css('.locations-page__title'));
    expect(title.nativeElement.textContent).toContain('Saved Locations');
  });

  it('should render a back link to "/"', () => {
    const link = fixture.debugElement.query(By.css('.locations-page__back'));
    expect(link).toBeTruthy();
  });

  // ─── Empty state ───────────────────────────────────────────────────────────

  it('should show empty state when there are no saved locations', () => {
    const empty = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
    expect(empty).toBeTruthy();
  });

  it('should not show the locations list when empty', () => {
    const list = fixture.debugElement.query(By.css('[data-testid="locations-list"]'));
    expect(list).toBeNull();
  });

  // ─── GPS save section ──────────────────────────────────────────────────────

  it('should not show the save GPS button when GPS is idle', () => {
    const btn = fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]'));
    expect(btn).toBeNull();
  });

  it('should show GPS hint when GPS status is requesting', () => {
    geoState.set({ status: 'requesting', position: null, error: null });
    fixture.detectChanges();
    const hint = fixture.debugElement.query(By.css('[data-testid="gps-hint"]'));
    expect(hint).toBeTruthy();
  });

  it('should show the save GPS button when GPS is granted', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]'));
    expect(btn).toBeTruthy();
  });

  it('should show the add form when the save GPS button is clicked', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]')).nativeElement.click();
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('[data-testid="add-location-form"]'));
    expect(form).toBeTruthy();
  });

  it('should hide add form and show list after confirming', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.debugElement.query(
      By.css('[data-testid="new-location-name-input"]'),
    ).nativeElement;
    input.value = 'My Spot';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="confirm-add-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('[data-testid="add-location-form"]'));
    expect(form).toBeNull();
    expect(savedLocationsService.add).toHaveBeenCalled();
  });

  it('should show max locations warning when at the limit', () => {
    const locs = Array.from({ length: SavedLocationsService.MAX_LOCATIONS }, (_, i) =>
      makeLocation({ id: `loc-${i}`, name: `Spot ${i}` }),
    );
    locationsSignal.set(locs);
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    const warning = fixture.debugElement.query(By.css('[data-testid="max-warning"]'));
    expect(warning).toBeTruthy();
  });

  it('should show error when confirming with an empty name', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.debugElement.query(
      By.css('[data-testid="new-location-name-input"]'),
    ).nativeElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="confirm-add-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('[data-testid="add-error"]'));
    expect(errorEl).toBeTruthy();
    expect(savedLocationsService.add).not.toHaveBeenCalled();
  });

  it('should show error when add() returns null (max reached at confirm time)', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.debugElement.query(
      By.css('[data-testid="new-location-name-input"]'),
    ).nativeElement;
    input.value = 'New Spot';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    savedLocationsService.add.and.returnValue(null);
    fixture.debugElement.query(By.css('[data-testid="confirm-add-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('[data-testid="add-error"]'));
    expect(errorEl).toBeTruthy();
  });

  it('should cancel the add form without saving', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="save-gps-btn"]')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="cancel-add-btn"]')).nativeElement.click();
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('[data-testid="add-location-form"]'));
    expect(form).toBeNull();
    expect(savedLocationsService.add).not.toHaveBeenCalled();
  });

  // ─── Locations list ────────────────────────────────────────────────────────

  it('should show the list when there are saved locations', () => {
    locationsSignal.set([makeLocation()]);
    fixture.detectChanges();
    const list = fixture.debugElement.query(By.css('[data-testid="locations-list"]'));
    expect(list).toBeTruthy();
  });

  it('should render one list item per saved location', () => {
    locationsSignal.set([
      makeLocation({ id: '1', name: 'Spot A' }),
      makeLocation({ id: '2', name: 'Spot B' }),
    ]);
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('[data-testid="location-item"]'));
    expect(items.length).toBe(2);
  });

  it('should show the location name in each list item', () => {
    locationsSignal.set([makeLocation({ name: 'Lake Tahoe' })]);
    fixture.detectChanges();
    const item = fixture.debugElement.query(By.css('[data-testid="location-item"]'));
    expect(item.nativeElement.textContent).toContain('Lake Tahoe');
  });

  it('should show an activate button for inactive locations', () => {
    locationsSignal.set([makeLocation()]);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('[data-testid="activate-btn"]'));
    expect(btn).toBeTruthy();
  });

  it('should call setActive when activate is clicked', () => {
    const loc = makeLocation({ id: 'loc-1' });
    locationsSignal.set([loc]);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="activate-btn"]')).nativeElement.click();
    expect(savedLocationsService.setActive).toHaveBeenCalledWith('loc-1');
  });

  it('should call remove when delete is clicked', () => {
    const loc = makeLocation({ id: 'loc-1' });
    locationsSignal.set([loc]);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="delete-btn"]')).nativeElement.click();
    expect(savedLocationsService.remove).toHaveBeenCalledWith('loc-1');
  });

  it('should clear active and remove when deleting the active location', () => {
    const loc = makeLocation({ id: 'loc-1' });
    locationsSignal.set([loc]);
    activeLocationSignal.set(loc);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('[data-testid="delete-btn"]')).nativeElement.click();
    expect(savedLocationsService.setActive).toHaveBeenCalledWith(null);
    expect(savedLocationsService.remove).toHaveBeenCalledWith('loc-1');
  });

  it('should display southern latitude with "S"', () => {
    locationsSignal.set([makeLocation({ latitude: -33.8688, longitude: 151.2093 })]);
    fixture.detectChanges();
    const item = fixture.debugElement.query(By.css('[data-testid="location-item"]'));
    expect(item.nativeElement.textContent).toContain('S');
  });

  it('should display eastern longitude with "E"', () => {
    locationsSignal.set([makeLocation({ latitude: -33.8688, longitude: 151.2093 })]);
    fixture.detectChanges();
    const item = fixture.debugElement.query(By.css('[data-testid="location-item"]'));
    expect(item.nativeElement.textContent).toContain('E');
  });

  it('should show "Enable GPS" hint in empty state when GPS is not granted', () => {
    // Default state is 'idle', locations are empty
    const hint = fixture.debugElement.query(By.css('.locations-page__empty-hint'));
    expect(hint.nativeElement.textContent).toContain('Enable GPS');
  });

  it('should show "Save GPS Location" hint in empty state when GPS is granted', () => {
    geoState.set(makeGrantedState());
    fixture.detectChanges();
    const hint = fixture.debugElement.query(By.css('.locations-page__empty-hint'));
    expect(hint.nativeElement.textContent).toContain('Save GPS Location');
  });

  // ─── Active location ───────────────────────────────────────────────────────

  it('should show active location banner when a location is active', () => {
    activeLocationSignal.set(makeLocation({ name: 'Lake Tahoe' }));
    fixture.detectChanges();
    const banner = fixture.debugElement.query(By.css('[data-testid="active-location-banner"]'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Lake Tahoe');
  });

  it('should show "Use GPS" instead of "Use" for the active location', () => {
    const loc = makeLocation({ id: 'loc-1' });
    locationsSignal.set([loc]);
    activeLocationSignal.set(loc);
    fixture.detectChanges();
    const useGpsBtns = fixture.debugElement.queryAll(By.css('[data-testid="use-gps-btn"]'));
    expect(useGpsBtns.length).toBeGreaterThan(0);
    const activateBtns = fixture.debugElement.queryAll(By.css('[data-testid="activate-btn"]'));
    expect(activateBtns.length).toBe(0);
  });

  it('should call setActive(null) when "Switch to GPS" is clicked in banner', () => {
    activeLocationSignal.set(makeLocation());
    fixture.detectChanges();
    fixture.debugElement
      .query(By.css('[data-testid="switch-to-gps-btn"]'))
      .nativeElement.click();
    expect(savedLocationsService.setActive).toHaveBeenCalledWith(null);
  });

  // ─── Active badge ─────────────────────────────────────────────────────────

  it('should show active badge on the active list item', () => {
    const loc = makeLocation({ id: 'loc-1' });
    locationsSignal.set([loc]);
    activeLocationSignal.set(loc);
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.locations-page__item-active-badge'));
    expect(badge).toBeTruthy();
  });
});
