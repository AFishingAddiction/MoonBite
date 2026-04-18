import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ShareService } from './share.service';
import { SharePayload } from './share.model';

const TEST_PAYLOAD: SharePayload = {
  score: 73,
  locationName: 'Lake Tahoe',
  latitude: 39.0968,
  longitude: -120.0324,
  phaseName: 'Waxing Gibbous',
  phaseEmoji: '🌔',
  illuminationPercent: 87,
  bestPeakTime: '7:45 AM – 9:15 AM',
};

describe('ShareService', () => {
  let service: ShareService;
  let mockClipboard: { writeText: jasmine.Spy };
  let mockNavigator: Partial<Navigator> & { share?: jasmine.Spy };
  let mockDocument: Partial<Document>;

  beforeEach(() => {
    mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
    };
    mockNavigator = {
      clipboard: mockClipboard as unknown as Clipboard,
    };
    mockDocument = {
      defaultView: { navigator: mockNavigator } as unknown as Window & typeof globalThis,
    };

    TestBed.configureTestingModule({
      providers: [ShareService, { provide: DOCUMENT, useValue: mockDocument }],
    });
    service = TestBed.inject(ShareService);
  });

  // ─── scoreDescription ───────────────────────────────────────────────────────

  describe('scoreDescription()', () => {
    it('returns "poor fishing" for scores below 30', () => {
      expect(service.scoreDescription(0)).toBe('poor fishing');
      expect(service.scoreDescription(29)).toBe('poor fishing');
    });

    it('returns "fair fishing" for scores 30–49', () => {
      expect(service.scoreDescription(30)).toBe('fair fishing');
      expect(service.scoreDescription(49)).toBe('fair fishing');
    });

    it('returns "good fishing" for scores 50–69', () => {
      expect(service.scoreDescription(50)).toBe('good fishing');
      expect(service.scoreDescription(69)).toBe('good fishing');
    });

    it('returns "excellent fishing" for scores 70 and above', () => {
      expect(service.scoreDescription(70)).toBe('excellent fishing');
      expect(service.scoreDescription(100)).toBe('excellent fishing');
    });
  });

  // ─── buildShareUrl ──────────────────────────────────────────────────────────

  describe('buildShareUrl()', () => {
    it('returns a URL containing lat and lng params', () => {
      const url = service.buildShareUrl(TEST_PAYLOAD);
      expect(url).toContain('lat=');
      expect(url).toContain('lng=');
    });

    it('includes the /home path', () => {
      const url = service.buildShareUrl(TEST_PAYLOAD);
      expect(url).toContain('/home');
    });

    it('encodes latitude and longitude to 4 decimal places', () => {
      const url = service.buildShareUrl(TEST_PAYLOAD);
      expect(url).toContain('lat=39.0968');
      expect(url).toContain('lng=-120.0324');
    });
  });

  // ─── buildShareText ─────────────────────────────────────────────────────────

  describe('buildShareText()', () => {
    it('starts with the fishing emoji', () => {
      expect(service.buildShareText(TEST_PAYLOAD)).toMatch(/^🎣/);
    });

    it('includes the score value', () => {
      expect(service.buildShareText(TEST_PAYLOAD)).toContain('73');
    });

    it('includes the location name when provided', () => {
      expect(service.buildShareText(TEST_PAYLOAD)).toContain('Lake Tahoe');
    });

    it('uses coordinates when locationName is null', () => {
      const text = service.buildShareText({ ...TEST_PAYLOAD, locationName: null });
      expect(text).not.toContain('Lake Tahoe');
      expect(text).toContain('39');
    });

    it('includes moon phase name and illumination', () => {
      const text = service.buildShareText(TEST_PAYLOAD);
      expect(text).toContain('Waxing Gibbous');
      expect(text).toContain('87%');
    });

    it('includes best peak time when provided', () => {
      expect(service.buildShareText(TEST_PAYLOAD)).toContain('7:45 AM – 9:15 AM');
    });

    it('omits "Best time" line when bestPeakTime is null', () => {
      const text = service.buildShareText({ ...TEST_PAYLOAD, bestPeakTime: null });
      expect(text).not.toContain('Best time');
    });
  });

  // ─── canUseWebShare ─────────────────────────────────────────────────────────

  describe('canUseWebShare()', () => {
    it('returns false when navigator.share is absent', () => {
      expect(service.canUseWebShare()).toBeFalse();
    });

    it('returns true when navigator.share is a function', () => {
      mockNavigator.share = jasmine.createSpy('share');
      expect(service.canUseWebShare()).toBeTrue();
    });
  });

  // ─── share ──────────────────────────────────────────────────────────────────

  describe('share()', () => {
    it('calls navigator.share with correct title and returns shared status', async () => {
      mockNavigator.share = jasmine
        .createSpy('share')
        .and.returnValue(Promise.resolve());

      const result = await service.share(TEST_PAYLOAD);

      expect(mockNavigator.share).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'MoonBite Daily Report' }),
      );
      expect(result.status).toBe('shared');
    });

    it('returns cancelled status when user aborts Web Share', async () => {
      const abortErr = Object.assign(new Error('Abort'), { name: 'AbortError' });
      mockNavigator.share = jasmine.createSpy('share').and.rejectWith(abortErr);

      const result = await service.share(TEST_PAYLOAD);
      expect(result.status).toBe('cancelled');
    });

    it('returns error status on unexpected Web Share failure', async () => {
      mockNavigator.share = jasmine.createSpy('share').and.rejectWith(new Error('NotAllowed'));

      const result = await service.share(TEST_PAYLOAD);
      expect(result.status).toBe('error');
    });

    it('falls back to clipboard when Web Share is unavailable', async () => {
      // mockNavigator has no .share — canUseWebShare() returns false
      const result = await service.share(TEST_PAYLOAD);
      expect(result.status).toBe('copied');
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  // ─── copyToClipboard ────────────────────────────────────────────────────────

  describe('copyToClipboard()', () => {
    it('copies text and returns copied status', async () => {
      const result = await service.copyToClipboard('hello world');
      expect(result.status).toBe('copied');
      expect(mockClipboard.writeText).toHaveBeenCalledWith('hello world');
    });

    it('returns error status when Clipboard API throws', async () => {
      mockClipboard.writeText.and.rejectWith(new Error('Permission denied'));
      const result = await service.copyToClipboard('hello');
      expect(result.status).toBe('error');
    });
  });
});
