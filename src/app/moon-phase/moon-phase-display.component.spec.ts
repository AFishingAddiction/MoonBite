import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MoonPhaseDisplayComponent } from './moon-phase-display.component';
import { MoonPhaseService, MoonPhaseData } from './moon-phase.service';

// ─────────────────────────────────────────────────────────────────────────────
// MoonPhaseDisplayComponent is a dev-utility card that calls
// MoonPhaseService.calculateForToday() on init and renders the result.
// These tests mock MoonPhaseService to supply controlled MoonPhaseData.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_FULL_MOON: MoonPhaseData = {
  phaseIndex: 4,
  phaseName: 'Full Moon',
  illuminationPercent: 98,
  moonAge: 14.8,
  phaseEmoji: '🌕',
  fishingScoreContribution: 92,
  dateUtc: '2024-03-25',
};

const MOCK_NEW_MOON: MoonPhaseData = {
  phaseIndex: 0,
  phaseName: 'New Moon',
  illuminationPercent: 2,
  moonAge: 0.3,
  phaseEmoji: '🌑',
  fishingScoreContribution: 88,
  dateUtc: '2024-03-10',
};

const MOCK_WAXING_GIBBOUS: MoonPhaseData = {
  phaseIndex: 3,
  phaseName: 'Waxing Gibbous',
  illuminationPercent: 72,
  moonAge: 9.2,
  phaseEmoji: '🌔',
  fishingScoreContribution: 68,
  dateUtc: '2024-03-21',
};

describe('MoonPhaseDisplayComponent', () => {
  let fixture: ComponentFixture<MoonPhaseDisplayComponent>;
  let mockService: jasmine.SpyObj<MoonPhaseService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('MoonPhaseService', [
      'calculateForToday',
      'calculateForDate',
      'calculateForDateString',
      'calculateFishingScore',
    ]);
    mockService.calculateForToday.and.returnValue(MOCK_WAXING_GIBBOUS);

    await TestBed.configureTestingModule({
      imports: [MoonPhaseDisplayComponent],
      providers: [{ provide: MoonPhaseService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MoonPhaseDisplayComponent);
    fixture.detectChanges();
  });

  // ── Component creation ────────────────────────────────────────────────────

  describe('component creation', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('calls MoonPhaseService.calculateForToday() on initialization', () => {
      expect(mockService.calculateForToday).toHaveBeenCalledTimes(1);
    });
  });

  // ── Landmark and region ───────────────────────────────────────────────────

  describe('outer section landmark', () => {
    it('renders a <section> element as the card shell', () => {
      const section = fixture.debugElement.query(By.css('section'));
      expect(section).toBeTruthy();
    });

    it('the <section> has role="region"', () => {
      const section = fixture.debugElement.query(By.css('section[role="region"]'));
      expect(section).toBeTruthy();
    });

    it('the <section> has aria-label containing "Moon phase"', () => {
      const section = fixture.debugElement.query(By.css('section'));
      const label: string = section.nativeElement.getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('moon phase');
    });
  });

  // ── Moon emoji ────────────────────────────────────────────────────────────

  describe('moon emoji display', () => {
    it('renders the phase emoji in a <span>', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain(MOCK_WAXING_GIBBOUS.phaseEmoji);
    });

    it('the emoji <span> has aria-hidden="true"', () => {
      const emojiSpan = fixture.debugElement.query(By.css('span[aria-hidden="true"]'));
      expect(emojiSpan).toBeTruthy();
    });
  });

  // ── Phase name ────────────────────────────────────────────────────────────

  describe('phase name display', () => {
    it('renders the phase name text in the template', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain(MOCK_WAXING_GIBBOUS.phaseName);
    });

    it('updates phase name when service returns a different phase', async () => {
      mockService.calculateForToday.and.returnValue(MOCK_FULL_MOON);

      const newFixture = TestBed.createComponent(MoonPhaseDisplayComponent);
      newFixture.detectChanges();

      const compiled: HTMLElement = newFixture.nativeElement;
      expect(compiled.textContent).toContain('Full Moon');
    });
  });

  // ── Illumination percentage ───────────────────────────────────────────────

  describe('illumination percentage display', () => {
    it('renders the illumination percentage value in the template', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('72');
    });

    it('renders illumination with a "%" character', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toMatch(/72\s*%/);
    });
  });

  // ── Moon age ─────────────────────────────────────────────────────────────

  describe('moon age display', () => {
    it('renders the moon age in "Day N" format', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      // moonAge is 9.2 — displayed as integer "Day 9" per spec
      expect(compiled.textContent).toMatch(/Day\s+9/i);
    });

    it('renders "Day 0" for a new moon with moonAge < 1', async () => {
      mockService.calculateForToday.and.returnValue(MOCK_NEW_MOON);

      const newFixture = TestBed.createComponent(MoonPhaseDisplayComponent);
      newFixture.detectChanges();

      const compiled: HTMLElement = newFixture.nativeElement;
      expect(compiled.textContent).toMatch(/Day\s+0/i);
    });

    it('renders "Day 14" for a full moon with moonAge ~14.8', async () => {
      mockService.calculateForToday.and.returnValue(MOCK_FULL_MOON);

      const newFixture = TestBed.createComponent(MoonPhaseDisplayComponent);
      newFixture.detectChanges();

      const compiled: HTMLElement = newFixture.nativeElement;
      expect(compiled.textContent).toMatch(/Day\s+14/i);
    });
  });

  // ── Score bar / meter ─────────────────────────────────────────────────────

  describe('score bar (role="meter")', () => {
    it('renders an element with role="meter"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter).toBeTruthy();
    });

    it('the meter element has aria-valuenow set to the fishingScoreContribution', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      const valuenow = meter.nativeElement.getAttribute('aria-valuenow');
      expect(Number(valuenow)).toBe(MOCK_WAXING_GIBBOUS.fishingScoreContribution);
    });

    it('the meter element has aria-valuemin="0"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter.nativeElement.getAttribute('aria-valuemin')).toBe('0');
    });

    it('the meter element has aria-valuemax="100"', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      expect(meter.nativeElement.getAttribute('aria-valuemax')).toBe('100');
    });

    it('the meter element has an aria-label describing the fishing score', () => {
      const meter = fixture.debugElement.query(By.css('[role="meter"]'));
      const label: string = meter.nativeElement.getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('fishing');
    });

    it('aria-valuenow updates when a different score is provided', async () => {
      mockService.calculateForToday.and.returnValue(MOCK_FULL_MOON);

      const newFixture = TestBed.createComponent(MoonPhaseDisplayComponent);
      newFixture.detectChanges();

      const meter = newFixture.debugElement.query(By.css('[role="meter"]'));
      const valuenow = Number(meter.nativeElement.getAttribute('aria-valuenow'));
      expect(valuenow).toBe(MOCK_FULL_MOON.fishingScoreContribution);
    });
  });

  // ── Score value display ───────────────────────────────────────────────────

  describe('fishing score value display', () => {
    it('renders the integer fishingScoreContribution value in the template', () => {
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain(String(MOCK_WAXING_GIBBOUS.fishingScoreContribution));
    });
  });

  // ── BEM class structure ───────────────────────────────────────────────────

  describe('BEM class structure', () => {
    it('the outer section has the class "moon-phase-card"', () => {
      const card = fixture.debugElement.query(By.css('.moon-phase-card'));
      expect(card).toBeTruthy();
    });

    it('renders a hero region with class "moon-phase-card__hero"', () => {
      const hero = fixture.debugElement.query(By.css('.moon-phase-card__hero'));
      expect(hero).toBeTruthy();
    });

    it('renders a stats region with class "moon-phase-card__stats"', () => {
      const stats = fixture.debugElement.query(By.css('.moon-phase-card__stats'));
      expect(stats).toBeTruthy();
    });

    it('renders a score section with class "moon-phase-card__score-section"', () => {
      const scoreSection = fixture.debugElement.query(By.css('.moon-phase-card__score-section'));
      expect(scoreSection).toBeTruthy();
    });

    it('renders a score bar track with class "moon-phase-card__score-bar-track"', () => {
      const track = fixture.debugElement.query(By.css('.moon-phase-card__score-bar-track'));
      expect(track).toBeTruthy();
    });
  });

  // ── Stat blocks accessibility ─────────────────────────────────────────────

  describe('stat blocks accessibility', () => {
    it('illumination stat block has an aria-label containing the illumination value', () => {
      const statBlocks = fixture.debugElement.queryAll(By.css('[aria-label]'));
      const illuminationStat = statBlocks.find(el =>
        (el.nativeElement.getAttribute('aria-label') ?? '').toLowerCase().includes('illuminat')
      );
      expect(illuminationStat).toBeTruthy();
    });

    it('moon age stat block has an aria-label containing "lunar cycle" or "day"', () => {
      const statBlocks = fixture.debugElement.queryAll(By.css('[aria-label]'));
      const ageStat = statBlocks.find(el => {
        const label = (el.nativeElement.getAttribute('aria-label') ?? '').toLowerCase();
        return label.includes('lunar') || label.includes('day');
      });
      expect(ageStat).toBeTruthy();
    });
  });
});
