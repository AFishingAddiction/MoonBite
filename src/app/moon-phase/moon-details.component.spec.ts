import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MoonDetailsComponent } from './moon-details.component';
import { MoonPhaseService, MoonPhaseData, PhaseName } from './moon-phase.service';

function makeMoonData(overrides: Partial<MoonPhaseData> = {}): MoonPhaseData {
  return {
    phaseIndex: 3,
    phaseName: 'Waxing Gibbous',
    illuminationPercent: 72,
    moonAge: 9.5,
    phaseEmoji: '🌔',
    fishingScoreContribution: 74,
    dateUtc: new Date().toISOString().slice(0, 10),
    ...overrides,
  };
}

describe('MoonDetailsComponent', () => {
  let fixture: ComponentFixture<MoonDetailsComponent>;
  let component: MoonDetailsComponent;
  let mockMoonService: jasmine.SpyObj<MoonPhaseService>;

  const defaultMoon = makeMoonData();

  beforeEach(async () => {
    mockMoonService = jasmine.createSpyObj<MoonPhaseService>('MoonPhaseService', [
      'calculateForToday',
      'calculateForDate',
      'calculateForDateString',
    ]);
    mockMoonService.calculateForToday.and.returnValue(defaultMoon);
    mockMoonService.calculateForDate.and.callFake((date: Date) => {
      return makeMoonData({ dateUtc: date.toISOString().slice(0, 10) });
    });
    mockMoonService.calculateForDateString.and.callFake((dateStr: string) => {
      return makeMoonData({ dateUtc: dateStr });
    });

    await TestBed.configureTestingModule({
      imports: [MoonDetailsComponent],
      providers: [provideRouter([]), { provide: MoonPhaseService, useValue: mockMoonService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MoonDetailsComponent);
    component = fixture.componentInstance;
  });

  // ─── Group 1: Component creation ──────────────────────────────────────────

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call calculateForToday on init', () => {
      expect(mockMoonService.calculateForToday).toHaveBeenCalled();
    });
  });

  // ─── Group 2: daysToFullMoon ───────────────────────────────────────────────

  describe('daysToFullMoon computed', () => {
    it('returns ~15 at new moon (moonAge ≈ 0)', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 0 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.daysToFullMoon()).toBe(15);
    });

    it('returns ~7 at first quarter (moonAge ≈ 7.4)', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 7.4 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      // halfCycle - 7.4 = 14.765 - 7.4 = 7.365 → Math.round = 7
      expect(component.daysToFullMoon()).toBe(7);
    });

    it('wraps around at full moon (moonAge ≈ 14.765) returning ~29', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 14.765 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      // raw = 14.765 - 14.765 = 0 → not > 0 → raw + LUNAR_CYCLE ≈ 29.53 → 30
      expect(component.daysToFullMoon()).toBeGreaterThanOrEqual(29);
    });

    it('returns ~24 at waning gibbous (moonAge ≈ 20)', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 20 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      // raw = 14.765 - 20 = -5.235 → -5.235 + 29.530 ≈ 24.3 → Math.round = 24
      expect(component.daysToFullMoon()).toBe(24);
    });

    it('always returns a positive integer', () => {
      for (const age of [0, 3, 7.4, 14.765, 18, 22, 27, 29]) {
        mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: age }));
        fixture = TestBed.createComponent(MoonDetailsComponent);
        component = fixture.componentInstance;
        const val = component.daysToFullMoon();
        expect(val).toBeGreaterThan(0);
        expect(Number.isInteger(val)).toBeTrue();
      }
    });
  });

  // ─── Group 3: daysToNewMoon ────────────────────────────────────────────────

  describe('daysToNewMoon computed', () => {
    it('returns ~30 at new moon (moonAge ≈ 0)', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 0 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      // LUNAR_CYCLE - 0 = 29.53 → Math.round = 30
      expect(component.daysToNewMoon()).toBe(30);
    });

    it('returns ~15 at full moon (moonAge ≈ 14.765)', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 14.765 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      // 29.530 - 14.765 = 14.765 → Math.round = 15
      expect(component.daysToNewMoon()).toBe(15);
    });

    it('returns ~3 at waning crescent (moonAge ≈ 27)', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: 27 }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      // 29.530 - 27 = 2.53 → Math.round = 3
      expect(component.daysToNewMoon()).toBe(3);
    });

    it('always returns a positive integer', () => {
      for (const age of [0, 3, 7.4, 14.765, 18, 22, 27, 29]) {
        mockMoonService.calculateForToday.and.returnValue(makeMoonData({ moonAge: age }));
        fixture = TestBed.createComponent(MoonDetailsComponent);
        component = fixture.componentInstance;
        const val = component.daysToNewMoon();
        expect(val).toBeGreaterThan(0);
        expect(Number.isInteger(val)).toBeTrue();
      }
    });
  });

  // ─── Group 4: scorePercent ─────────────────────────────────────────────────

  describe('scorePercent computed', () => {
    it('returns the score as a percentage string', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 85 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scorePercent()).toBe('85%');
    });

    it('returns "0%" for a zero score', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 0 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scorePercent()).toBe('0%');
    });
  });

  // ─── Group 5: scoreTierClass ───────────────────────────────────────────────

  describe('scoreTierClass computed', () => {
    it('returns "good" when score >= 75', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 75 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scoreTierClass()).toBe('good');
    });

    it('returns "good" when score is 100', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 100 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scoreTierClass()).toBe('good');
    });

    it('returns "fair" when score is 60', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 60 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('returns "fair" when score is 50', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 50 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scoreTierClass()).toBe('fair');
    });

    it('returns "poor" when score is 30', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 30 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scoreTierClass()).toBe('poor');
    });

    it('returns "poor" when score is 0', () => {
      mockMoonService.calculateForToday.and.returnValue(
        makeMoonData({ fishingScoreContribution: 0 })
      );
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
      expect(component.scoreTierClass()).toBe('poor');
    });
  });

  // ─── Group 6: phaseAdvice ──────────────────────────────────────────────────

  describe('phaseAdvice computed', () => {
    const allPhases: PhaseName[] = [
      'New Moon',
      'Waxing Crescent',
      'First Quarter',
      'Waxing Gibbous',
      'Full Moon',
      'Waning Gibbous',
      'Last Quarter',
      'Waning Crescent',
    ];

    allPhases.forEach(phase => {
      it(`returns a non-empty string for phase "${phase}"`, () => {
        mockMoonService.calculateForToday.and.returnValue(makeMoonData({ phaseName: phase }));
        fixture = TestBed.createComponent(MoonDetailsComponent);
        component = fixture.componentInstance;
        const advice = component.phaseAdvice();
        expect(advice).toBeTruthy();
        expect(advice.length).toBeGreaterThan(10);
      });
    });

    it('returns different advice for New Moon vs Full Moon', () => {
      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ phaseName: 'New Moon' }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      const newMoonAdvice = fixture.componentInstance.phaseAdvice();

      mockMoonService.calculateForToday.and.returnValue(makeMoonData({ phaseName: 'Full Moon' }));
      fixture = TestBed.createComponent(MoonDetailsComponent);
      const fullMoonAdvice = fixture.componentInstance.phaseAdvice();

      expect(newMoonAdvice).not.toEqual(fullMoonAdvice);
    });
  });

  // ─── Group 7: forecastDays ─────────────────────────────────────────────────

  describe('forecastDays field', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(MoonDetailsComponent);
      component = fixture.componentInstance;
    });

    it('has exactly 7 items', () => {
      expect(component.forecastDays.length).toBe(7);
    });

    it('each item has required MoonPhaseData fields', () => {
      component.forecastDays.forEach((day: MoonPhaseData) => {
        expect(day.phaseEmoji).toBeTruthy();
        expect(day.phaseName).toBeTruthy();
        expect(day.illuminationPercent).toBeGreaterThanOrEqual(0);
        expect(day.fishingScoreContribution).toBeGreaterThanOrEqual(0);
        expect(day.dateUtc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('items are in chronological order', () => {
      const dates = component.forecastDays.map((d: MoonPhaseData) => d.dateUtc);
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBeTrue();
      }
    });

    it('first item date matches today', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(component.forecastDays[0].dateUtc).toBe(today);
    });

    it('seventh item date is 6 days after today', () => {
      const expectedDate = new Date();
      expectedDate.setUTCDate(expectedDate.getUTCDate() + 6);
      const expected = expectedDate.toISOString().slice(0, 10);
      expect(component.forecastDays[6].dateUtc).toBe(expected);
    });
  });

  // ─── Group 8: Template rendering ──────────────────────────────────────────

  describe('Template rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('renders back link with routerLink="/"', () => {
      const backLink = fixture.debugElement.query(By.css('a.moon-detail__back-link'));
      expect(backLink).toBeTruthy();
      expect(
        backLink.attributes['routerLink'] ?? backLink.attributes['ng-reflect-router-link']
      ).toBeTruthy();
    });

    it('renders the phase name in h1', () => {
      const h1 = fixture.debugElement.query(By.css('h1.moon-detail__phase-name'));
      expect(h1).toBeTruthy();
      expect(h1.nativeElement.textContent).toContain(defaultMoon.phaseName);
    });

    it('renders moon emoji with aria-hidden="true"', () => {
      const emoji = fixture.debugElement.query(By.css('.moon-detail__emoji'));
      expect(emoji).toBeTruthy();
      expect(emoji.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders score bar fill element', () => {
      const fill = fixture.debugElement.query(By.css('.score-bar__fill'));
      expect(fill).toBeTruthy();
    });

    it('renders forecast section with 7 list items', () => {
      const items = fixture.debugElement.queryAll(By.css('.moon-detail__forecast-list li'));
      expect(items.length).toBe(7);
    });

    it('renders first forecast card with aria-current="date"', () => {
      const firstCard = fixture.debugElement.query(
        By.css('.moon-detail__forecast-list li:first-child')
      );
      expect(firstCard).toBeTruthy();
      expect(firstCard.nativeElement.getAttribute('aria-current')).toBe('date');
    });

    it('renders stats section with 4 stat cells', () => {
      const stats = fixture.debugElement.queryAll(By.css('.moon-detail__stat'));
      expect(stats.length).toBe(4);
    });

    it('score bar track has role="meter" and correct ARIA attributes', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter).toBeTruthy();
      expect(meter.nativeElement.getAttribute('aria-valuemin')).toBe('0');
      expect(meter.nativeElement.getAttribute('aria-valuemax')).toBe('100');
      expect(meter.nativeElement.getAttribute('aria-valuenow')).toBe(
        String(defaultMoon.fishingScoreContribution)
      );
    });
  });
});
