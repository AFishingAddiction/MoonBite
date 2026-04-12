import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ScoreHistoryComponent } from './score-history.component';
import { ScoreHistoryService } from './score-history.service';
import { ActiveLocationService, ActiveCoords } from '../locations/active-location.service';
import { DailyScoreRecord, HistorySlice } from './score-history.model';

const EMPTY_SLICE: HistorySlice = {
  records: [],
  highScore: 0,
  lowScore: 0,
  highDate: '',
  lowDate: '',
  averageScore: 0,
};

function makeRecord(date: string, score: number): DailyScoreRecord {
  return {
    date,
    score,
    moonPhase: 'Full Moon',
    moonEmoji: '🌕',
    factors: { moon: score, solunar: score, weather: score },
  };
}

describe('ScoreHistoryComponent', () => {
  let component: ScoreHistoryComponent;
  let fixture: ComponentFixture<ScoreHistoryComponent>;
  let mockHistoryService: jasmine.SpyObj<ScoreHistoryService>;
  let coordsSignal: ReturnType<typeof signal<ActiveCoords | null>>;

  beforeEach(async () => {
    mockHistoryService = jasmine.createSpyObj('ScoreHistoryService', [
      'getHistory',
      'recordTodayScore',
      'clear',
    ]);
    mockHistoryService.getHistory.and.returnValue(EMPTY_SLICE);

    coordsSignal = signal<ActiveCoords | null>(null);

    await TestBed.configureTestingModule({
      imports: [ScoreHistoryComponent],
      providers: [
        { provide: ScoreHistoryService, useValue: mockHistoryService },
        {
          provide: ActiveLocationService,
          useValue: { coords: coordsSignal },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows Fishing History heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Fishing History');
  });

  it('shows empty state message when no coords available', () => {
    expect(fixture.nativeElement.textContent).toContain('Not enough history yet');
  });

  it('shows empty state when coords present but no records', () => {
    coordsSignal.set({ latitude: 37.3382, longitude: -121.8863, name: 'Test' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Not enough history yet');
  });

  it('renders day rows when history records exist', () => {
    coordsSignal.set({ latitude: 37.3382, longitude: -121.8863, name: 'Test' });
    const slice: HistorySlice = {
      records: [makeRecord('2026-04-11', 82), makeRecord('2026-04-10', 75)],
      highScore: 82,
      lowScore: 75,
      highDate: '2026-04-11',
      lowDate: '2026-04-10',
      averageScore: 79,
    };
    mockHistoryService.getHistory.and.returnValue(slice);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.history__day-row');
    expect(rows.length).toBe(2);
  });

  it('renders BEST badge on the highest-scoring row', () => {
    coordsSignal.set({ latitude: 37.3382, longitude: -121.8863, name: 'Test' });
    const slice: HistorySlice = {
      records: [makeRecord('2026-04-11', 82), makeRecord('2026-04-10', 91)],
      highScore: 91,
      lowScore: 82,
      highDate: '2026-04-10',
      lowDate: '2026-04-11',
      averageScore: 87,
    };
    mockHistoryService.getHistory.and.returnValue(slice);
    fixture.detectChanges();

    const badges = fixture.nativeElement.querySelectorAll('.history__best-badge');
    expect(badges.length).toBe(1);
  });

  it('renders SVG chart when records exist', () => {
    coordsSignal.set({ latitude: 37.3382, longitude: -121.8863, name: 'Test' });
    const slice: HistorySlice = {
      records: [makeRecord('2026-04-11', 82)],
      highScore: 82,
      lowScore: 82,
      highDate: '2026-04-11',
      lowDate: '2026-04-11',
      averageScore: 82,
    };
    mockHistoryService.getHistory.and.returnValue(slice);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('.history__chart svg');
    expect(svg).not.toBeNull();
  });

  it('does not render SVG chart in empty state', () => {
    const svg = fixture.nativeElement.querySelector('.history__chart svg');
    expect(svg).toBeNull();
  });

  it('7-day range is selected by default', () => {
    expect(component.selectedRange()).toBe(7);
  });

  it('setRange updates selectedRange signal', () => {
    component.setRange(14);
    expect(component.selectedRange()).toBe(14);
    component.setRange(30);
    expect(component.selectedRange()).toBe(30);
  });

  it('range buttons are present', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.history__range-btn');
    expect(buttons.length).toBe(3);
    const labels = Array.from(buttons as NodeListOf<Element>).map(b => b.textContent?.trim());
    expect(labels).toContain('7');
    expect(labels).toContain('14');
    expect(labels).toContain('30');
  });

  it('active range button has --active class', () => {
    const btn7 = Array.from(
      fixture.nativeElement.querySelectorAll('.history__range-btn') as NodeListOf<HTMLElement>,
    ).find(b => b.textContent?.trim() === '7');
    expect(btn7?.classList.contains('history__range-btn--active')).toBeTrue();
  });

  it('formatDate converts YYYY-MM-DD to human-readable form', () => {
    expect(component.formatDate('2026-04-11')).toBe('Apr 11');
  });

  it('dialog is not open on initial load', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog?.open).toBeFalse();
  });
});
