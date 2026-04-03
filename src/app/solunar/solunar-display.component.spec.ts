import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GeolocationService, GeolocationState } from '../geolocation/geolocation.service';
import { SolunarDisplayComponent } from './solunar-display.component';
import { SolunarData, SolunarService } from './solunar.service';

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_POSITION = {
  coords: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
  timestamp: Date.now(),
} as GeolocationPosition;

const MOCK_PERIOD_OVERHEAD = {
  type: 'major' as const,
  index: 1 as const,
  startUtc: '2024-01-15T11:00:00.000Z',
  endUtc: '2024-01-15T13:00:00.000Z',
  durationMinutes: 120 as const,
  rating: 4 as const,
  description: 'Moon Overhead' as const,
};

const MOCK_PERIOD_MOONRISE = {
  type: 'minor' as const,
  index: 2 as const,
  startUtc: '2024-01-15T14:30:00.000Z',
  endUtc: '2024-01-15T15:30:00.000Z',
  durationMinutes: 60 as const,
  rating: 4 as const,
  description: 'Moonrise' as const,
};

const MOCK_PERIOD_MOONSET = {
  type: 'minor' as const,
  index: 3 as const,
  startUtc: '2024-01-15T20:30:00.000Z',
  endUtc: '2024-01-15T21:30:00.000Z',
  durationMinutes: 60 as const,
  rating: 4 as const,
  description: 'Moonset' as const,
};

const MOCK_PERIOD_UNDERFOOT = {
  type: 'major' as const,
  index: 4 as const,
  startUtc: '2024-01-15T23:00:00.000Z',
  endUtc: '2024-01-16T01:00:00.000Z',
  durationMinutes: 120 as const,
  rating: 4 as const,
  description: 'Moon Underfoot' as const,
};

const MOCK_SOLUNAR_DATA: SolunarData = {
  periods: [MOCK_PERIOD_OVERHEAD, MOCK_PERIOD_MOONRISE, MOCK_PERIOD_MOONSET, MOCK_PERIOD_UNDERFOOT],
  moonUpperTransitUtc: '2024-01-15T12:00:00.000Z',
  moonLowerTransitUtc: '2024-01-16T00:00:00.000Z',
  moonriseUtc: '2024-01-15T15:00:00.000Z',
  moonsetUtc: '2024-01-15T21:00:00.000Z',
  rating: 4,
  fishingScoreContribution: 100,
  dateUtc: '2024-01-15',
  latitude: 40.7128,
  longitude: -74.006,
};

const MOCK_POLAR_DATA: SolunarData = {
  periods: [
    { ...MOCK_PERIOD_OVERHEAD, index: 1 },
    { ...MOCK_PERIOD_UNDERFOOT, index: 2 },
  ],
  moonUpperTransitUtc: '2024-06-21T10:00:00.000Z',
  moonLowerTransitUtc: '2024-06-21T22:00:00.000Z',
  moonriseUtc: null,
  moonsetUtc: null,
  rating: 1,
  fishingScoreContribution: 50,
  dateUtc: '2024-06-21',
  latitude: 70,
  longitude: 25,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: make a mock GeolocationService with a writable internal signal
// ─────────────────────────────────────────────────────────────────────────────
function makeMockGeoService(initialState: GeolocationState) {
  const _state = signal<GeolocationState>(initialState);
  return {
    state: _state.asReadonly(),
    _state,
    requestLocation: jasmine.createSpy('requestLocation'),
    reset: jasmine.createSpy('reset'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SolunarDisplayComponent', () => {
  let fixture: ComponentFixture<SolunarDisplayComponent>;
  let mockGeoService: ReturnType<typeof makeMockGeoService>;
  let mockSolunarService: jasmine.SpyObj<SolunarService>;

  function setup(geoState: GeolocationState) {
    mockGeoService = makeMockGeoService(geoState);
    mockSolunarService = jasmine.createSpyObj('SolunarService', [
      'calculateForToday',
      'calculateForDate',
      'calculateForDateString',
      'getSolunarRating',
      'calculateFishingScore',
    ]);
    mockSolunarService.calculateForToday.and.returnValue(MOCK_SOLUNAR_DATA);
  }

  async function createComponent(geoState: GeolocationState) {
    setup(geoState);
    await TestBed.configureTestingModule({
      imports: [SolunarDisplayComponent],
      providers: [
        { provide: GeolocationService, useValue: mockGeoService },
        { provide: SolunarService, useValue: mockSolunarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SolunarDisplayComponent);
    fixture.detectChanges();
  }

  // ── Component creation ────────────────────────────────────────────────────

  describe('component creation', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('calls GeolocationService.requestLocation() on initialization', () => {
      expect(mockGeoService.requestLocation).toHaveBeenCalledTimes(1);
    });
  });

  // ── Card landmark ─────────────────────────────────────────────────────────

  describe('outer section landmark', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('renders a <section> element as the card shell', () => {
      expect(fixture.debugElement.query(By.css('section'))).toBeTruthy();
    });

    it('the <section> has role="region"', () => {
      expect(fixture.debugElement.query(By.css('section[role="region"]'))).toBeTruthy();
    });

    it('the <section> aria-label contains "Solunar"', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const label: string = section.nativeElement.getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('solunar');
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    beforeEach(async () => {
      await createComponent({ status: 'requesting', position: null, error: null });
    });

    it('renders the loading skeleton', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__loading'))).toBeTruthy();
    });

    it('does not render period list while loading', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__periods'))).toBeNull();
    });

    it('aria-label indicates loading', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const label: string = section.nativeElement.getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('loading');
    });
  });

  // ── Error state ───────────────────────────────────────────────────────────

  describe('error state (location denied)', () => {
    beforeEach(async () => {
      await createComponent({
        status: 'denied',
        position: null,
        error: null as unknown as GeolocationPositionError,
      });
    });

    it('renders the error message', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Location unavailable');
    });

    it('does not render period list on error', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__periods'))).toBeNull();
    });
  });

  // ── Data state ────────────────────────────────────────────────────────────

  describe('data state (location granted)', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('renders the solunar header', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__header'))).toBeTruthy();
    });

    it('renders the title "Solunar Table"', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Solunar Table');
    });

    it('renders the date from solunar data', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain(MOCK_SOLUNAR_DATA.dateUtc);
    });

    it('renders the periods list', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__periods'))).toBeTruthy();
    });

    it('renders 4 period list items', () => {
      const items = fixture.debugElement.queryAll(By.css('[role="listitem"]'));
      expect(items.length).toBe(4);
    });

    it('renders period descriptions', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Moon Overhead');
      expect(el.textContent).toContain('Moonrise');
      expect(el.textContent).toContain('Moonset');
      expect(el.textContent).toContain('Moon Underfoot');
    });

    it('renders MAJOR label for major periods', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('MAJOR');
    });

    it('renders MINOR label for minor periods', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('MINOR');
    });

    it('renders formatted UTC times', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('11:00 UTC');
    });

    it('renders the fishing score badge', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain(String(MOCK_SOLUNAR_DATA.fishingScoreContribution));
    });

    it('renders a score meter with role="meter"', () => {
      expect(fixture.debugElement.query(By.css('[role="meter"]'))).toBeTruthy();
    });

    it('meter aria-valuenow matches fishing score', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      const valuenow = Number(meter.nativeElement.getAttribute('aria-valuenow'));
      expect(valuenow).toBe(MOCK_SOLUNAR_DATA.fishingScoreContribution);
    });

    it('meter has aria-valuemin="0" and aria-valuemax="100"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter.nativeElement.getAttribute('aria-valuemin')).toBe('0');
      expect(meter.nativeElement.getAttribute('aria-valuemax')).toBe('100');
    });

    it('does not show polar note for normal latitude', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__polar-note'))).toBeNull();
    });

    it('renders rating stars', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('★★★★');
    });
  });

  // ── Polar state ───────────────────────────────────────────────────────────

  describe('polar region (2 periods)', () => {
    beforeEach(async () => {
      setup({ status: 'granted', position: MOCK_POSITION, error: null });
      mockSolunarService.calculateForToday.and.returnValue(MOCK_POLAR_DATA);

      await TestBed.configureTestingModule({
        imports: [SolunarDisplayComponent],
        providers: [
          { provide: GeolocationService, useValue: mockGeoService },
          { provide: SolunarService, useValue: mockSolunarService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(SolunarDisplayComponent);
      fixture.detectChanges();
    });

    it('renders only 2 period list items', () => {
      const items = fixture.debugElement.queryAll(By.css('[role="listitem"]'));
      expect(items.length).toBe(2);
    });

    it('shows polar note', () => {
      const note = fixture.debugElement.query(By.css('.solunar-card__polar-note'));
      expect(note).toBeTruthy();
      expect((note.nativeElement as HTMLElement).textContent).toContain(
        'Minor periods unavailable'
      );
    });
  });

  // ── BEM class structure ───────────────────────────────────────────────────

  describe('BEM class structure', () => {
    beforeEach(async () => {
      await createComponent({ status: 'granted', position: MOCK_POSITION, error: null });
    });

    it('has .solunar-card on the outer section', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card'))).toBeTruthy();
    });

    it('has .solunar-card__header', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__header'))).toBeTruthy();
    });

    it('has .solunar-card__periods', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__periods'))).toBeTruthy();
    });

    it('has .solunar-card__score-section', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__score-section'))).toBeTruthy();
    });

    it('has .solunar-card__score-bar-track', () => {
      expect(fixture.debugElement.query(By.css('.solunar-card__score-bar-track'))).toBeTruthy();
    });

    it('major periods have .solunar-card__period--major modifier', () => {
      const majorItems = fixture.debugElement.queryAll(By.css('.solunar-card__period--major'));
      expect(majorItems.length).toBe(2);
    });
  });
});
