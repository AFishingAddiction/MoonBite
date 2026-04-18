import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { ShareButtonComponent } from './share-button.component';
import { ShareService } from './share.service';
import { ActiveCoords, ActiveLocationService } from '../locations/active-location.service';
import { FishingScoreService } from '../scoring/fishing-score.service';
import { MoonPhaseService } from '../moon-phase/moon-phase.service';
import { SolunarService } from '../solunar/solunar.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockActiveLocationService(name: string | null = 'Lake Tahoe') {
  const coords = signal<ActiveCoords | null>({ latitude: 39.0968, longitude: -120.0324, name });
  return {
    coords,
    status: computed(() => 'granted' as const),
    isLocating: computed(() => false),
    hasError: computed(() => false),
  };
}

function makeMockFishingScoreService() {
  return {
    getScore: jasmine
      .createSpy('getScore')
      .and.returnValue(
        of({ score: 73, breakdown: {}, weights: {}, dateUtc: '2026-04-18', latitude: 39, longitude: -120 }),
      ),
  };
}

function makeMockMoonPhaseService() {
  return {
    calculateForDateString: jasmine.createSpy('calculateForDateString').and.returnValue({
      phaseName: 'Waxing Gibbous',
      phaseEmoji: '🌔',
      illuminationPercent: 87,
      fishingScoreContribution: 60,
      phaseIndex: 3,
      moonAge: 10,
      dateUtc: '2026-04-18',
    }),
  };
}

function makeMockSolunarService() {
  return {
    calculateForDateString: jasmine.createSpy('calculateForDateString').and.returnValue({
      periods: [
        {
          type: 'major' as const,
          index: 1 as const,
          startUtc: '2026-04-18T14:00:00Z',
          endUtc: '2026-04-18T16:00:00Z',
          durationMinutes: 120 as const,
          rating: 3 as const,
          description: 'Moon Overhead' as const,
        },
      ],
      moonUpperTransitUtc: '2026-04-18T15:00:00Z',
      moonLowerTransitUtc: '2026-04-18T03:00:00Z',
      moonriseUtc: '2026-04-18T09:00:00Z',
      moonsetUtc: '2026-04-18T21:00:00Z',
      rating: 3 as const,
      fishingScoreContribution: 70,
      dateUtc: '2026-04-18',
      latitude: 39.0968,
      longitude: -120.0324,
    }),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ShareButtonComponent', () => {
  let fixture: ComponentFixture<ShareButtonComponent>;
  let component: ShareButtonComponent;
  let shareServiceSpy: jasmine.SpyObj<ShareService>;

  async function setup(overrides: Partial<ReturnType<typeof makeMockActiveLocationService>> = {}) {
    shareServiceSpy = jasmine.createSpyObj<ShareService>('ShareService', [
      'canUseWebShare',
      'share',
      'copyToClipboard',
      'buildShareText',
      'buildShareUrl',
      'scoreDescription',
    ]);
    shareServiceSpy.canUseWebShare.and.returnValue(true);
    shareServiceSpy.share.and.returnValue(Promise.resolve({ status: 'shared', message: 'ok' }));
    shareServiceSpy.copyToClipboard.and.returnValue(
      Promise.resolve({ status: 'copied', message: 'Copied!' }),
    );
    shareServiceSpy.buildShareText.and.returnValue('🎣 MoonBite says today is a 73 — good fishing at Lake Tahoe!');
    shareServiceSpy.buildShareUrl.and.returnValue('https://moonbite.app/home?lat=39&lng=-120');

    const mockActiveLocation = { ...makeMockActiveLocationService(), ...overrides };

    await TestBed.configureTestingModule({
      imports: [ShareButtonComponent],
      providers: [
        { provide: ShareService, useValue: shareServiceSpy },
        { provide: ActiveLocationService, useValue: mockActiveLocation },
        { provide: FishingScoreService, useValue: makeMockFishingScoreService() },
        { provide: MoonPhaseService, useValue: makeMockMoonPhaseService() },
        { provide: SolunarService, useValue: makeMockSolunarService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('creates the component', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('renders the share trigger button', async () => {
    await setup();
    const btn = fixture.nativeElement.querySelector('.share-button__trigger');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Share');
  });

  it('enables the button when a score payload is available', async () => {
    await setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.share-button__trigger');
    expect(btn.disabled).toBeFalse();
  });

  it('calls shareService.share() when Web Share is available and button is clicked', async () => {
    await setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.share-button__trigger');
    btn.click();
    await fixture.whenStable();
    expect(shareServiceSpy.share).toHaveBeenCalled();
  });

  it('opens the fallback modal when Web Share is unavailable', async () => {
    await setup();
    shareServiceSpy.canUseWebShare.and.returnValue(false);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.share-button__trigger');
    btn.click();
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(modal).toBeTruthy();
  });

  it('closes the fallback modal when the close button is clicked', async () => {
    await setup();
    shareServiceSpy.canUseWebShare.and.returnValue(false);
    fixture.nativeElement.querySelector('.share-button__trigger').click();
    fixture.detectChanges();

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.share-button__close-btn',
    );
    closeBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('displays share preview text in the modal', async () => {
    await setup();
    shareServiceSpy.canUseWebShare.and.returnValue(false);
    fixture.nativeElement.querySelector('.share-button__trigger').click();
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector('.share-button__modal-preview');
    expect(preview).toBeTruthy();
    expect(preview.textContent).toContain('MoonBite');
  });

  it('calls copyToClipboard when Copy button is clicked in modal', async () => {
    await setup();
    shareServiceSpy.canUseWebShare.and.returnValue(false);
    fixture.nativeElement.querySelector('.share-button__trigger').click();
    fixture.detectChanges();

    const copyBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.share-button__copy-btn',
    );
    copyBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(shareServiceSpy.copyToClipboard).toHaveBeenCalled();
  });

  it('toast element has aria-live="polite" when visible', async () => {
    await setup();
    // Directly set the signal to avoid async timing issues with OnPush
    (component as unknown as { toastVisible: { set: (v: boolean) => void } }).toastVisible.set(
      true,
    );
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Copied!');
  });

  it('disables the button when no location is available', async () => {
    const noCoords = signal<ActiveCoords | null>(null);
    await setup({ coords: noCoords });
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.share-button__trigger');
    expect(btn.disabled).toBeTrue();
  });
});
