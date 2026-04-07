import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FishingScore, FishingScoreService } from './fishing-score.service';
import { FishingScoreDisplayComponent } from './fishing-score-display.component';
import { ActiveLocationService, ActiveCoords } from '../locations/active-location.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeScore(score: number, weatherAvailable = true): FishingScore {
  return {
    score,
    breakdown: {
      moonPhaseScore: 80,
      solunarScore: 90,
      weatherScore: weatherAvailable ? 70 : 0,
      moonPhaseWeighted: 24,
      solunarWeighted: 32,
      weatherWeighted: weatherAvailable ? 25 : 0,
      weatherAvailable,
    },
    weights: { moonPhase: 0.3, solunar: 0.35, weather: 0.35 },
    dateUtc: '2024-06-01',
    latitude: 40.7128,
    longitude: -74.006,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FishingScoreDisplayComponent', () => {
  let component: FishingScoreDisplayComponent;
  let fixture: ComponentFixture<FishingScoreDisplayComponent>;
  let fishingScoreService: jasmine.SpyObj<FishingScoreService>;
  let coordsSignal: ReturnType<typeof signal<ActiveCoords | null>>;

  function makeActiveLocationService(
    coords: ActiveCoords | null = { latitude: 40.7128, longitude: -74.006, name: null },
  ) {
    coordsSignal = signal<ActiveCoords | null>(coords);
    return {
      coords: coordsSignal.asReadonly(),
      status: computed(() => (coordsSignal() ? ('granted' as const) : ('idle' as const))),
      isLocating: computed(() => false),
      hasError: computed(() => false),
    };
  }

  beforeEach(async () => {
    localStorage.clear();
    fishingScoreService = jasmine.createSpyObj<FishingScoreService>('FishingScoreService', [
      'getScore',
    ]);
    fishingScoreService.getScore.and.returnValue(of(makeScore(78)));

    await TestBed.configureTestingModule({
      imports: [FishingScoreDisplayComponent],
      providers: [
        provideRouter([]),
        { provide: FishingScoreService, useValue: fishingScoreService },
        { provide: ActiveLocationService, useValue: makeActiveLocationService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FishingScoreDisplayComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('displays the composite score', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('78');
  });

  it('displays the section heading', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/fishing score/i);
  });

  it('shows moon phase factor label', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/moon phase/i);
  });

  it('shows solunar factor label', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/solunar/i);
  });

  it('shows weather factor label', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/weather/i);
  });

  it('shows weather unavailable note when weatherAvailable is false', () => {
    fishingScoreService.getScore.and.returnValue(of(makeScore(71, false)));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/weather.*unavailable/i);
  });

  it('shows loading indicator before data arrives', () => {
    fishingScoreService.getScore.and.returnValue(NEVER);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/calculating|loading/i);
  });

  it('shows error message when score is null', () => {
    fishingScoreService.getScore.and.returnValue(of(null));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toMatch(/unavailable|error/i);
  });
});
