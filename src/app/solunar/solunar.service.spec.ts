import { TestBed } from '@angular/core/testing';
import { SolunarData, SolunarService } from './solunar.service';

// ─────────────────────────────────────────────────────────────────────────────
// Solunar calculations use a simplified algorithm (±30 min transit accuracy)
// suitable for fishing predictions. Reference dates chosen to fall solidly
// within phase bands, not on transition boundaries.
// ─────────────────────────────────────────────────────────────────────────────

describe('SolunarService', () => {
  let service: SolunarService;

  // Test location: New York City
  const LAT_NY = 40.7128;
  const LNG_NY = -74.006;

  // Test location: London
  const LAT_LDN = 51.5074;
  const LNG_LDN = -0.1278;

  // Polar test location: Tromsø, Norway
  const LAT_POLAR = 70.0;
  const LNG_POLAR = 25.0;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SolunarService] });
    service = TestBed.inject(SolunarService);
  });

  // ── Instantiation ─────────────────────────────────────────────────────────

  describe('instantiation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ── getSolunarRating() ────────────────────────────────────────────────────

  describe('getSolunarRating()', () => {
    it('returns 4 for new moon phase (moonAge 1)', () => {
      expect(service.getSolunarRating(1)).toBe(4);
    });

    it('returns 4 for near-zero moon age', () => {
      expect(service.getSolunarRating(0.5)).toBe(4);
    });

    it('returns 3 for first quarter (moonAge 7.4)', () => {
      expect(service.getSolunarRating(7.4)).toBe(3);
    });

    it('returns 4 for full moon (moonAge 14.8)', () => {
      expect(service.getSolunarRating(14.8)).toBe(4);
    });

    it('returns 3 for last quarter (moonAge 22.1)', () => {
      expect(service.getSolunarRating(22.1)).toBe(3);
    });

    it('returns 1 for waxing gibbous (moonAge 10)', () => {
      expect(service.getSolunarRating(10)).toBe(1);
    });

    it('returns 1 for waning gibbous (moonAge 20)', () => {
      expect(service.getSolunarRating(20)).toBe(1);
    });

    it('returns 1 for waxing crescent (moonAge 4.5)', () => {
      expect(service.getSolunarRating(4.5)).toBe(1);
    });

    it('returns a value in the set {1, 2, 3, 4} for any moon age', () => {
      for (let age = 0; age < 29.53; age += 0.5) {
        const r = service.getSolunarRating(age);
        expect([1, 2, 3, 4]).toContain(r);
      }
    });
  });

  // ── calculateForDate() ────────────────────────────────────────────────────

  describe('calculateForDate()', () => {
    // 2024-01-11 was a new moon (NASA/USNO almanac)
    describe('new moon — 2024-01-11, New York', () => {
      let result: SolunarData;

      beforeEach(() => {
        result = service.calculateForDate(new Date('2024-01-11T00:00:00Z'), LAT_NY, LNG_NY);
      });

      it('returns exactly 4 periods for non-polar latitude', () => {
        expect(result.periods.length).toBe(4);
      });

      it('returns 2 major periods', () => {
        expect(result.periods.filter(p => p.type === 'major').length).toBe(2);
      });

      it('returns 2 minor periods', () => {
        expect(result.periods.filter(p => p.type === 'minor').length).toBe(2);
      });

      it('moonUpperTransitUtc is a valid ISO datetime string', () => {
        expect(() => new Date(result.moonUpperTransitUtc)).not.toThrow();
        expect(new Date(result.moonUpperTransitUtc).getTime()).not.toBeNaN();
      });

      it('moonLowerTransitUtc is exactly 12 hours after moonUpperTransitUtc', () => {
        const upper = new Date(result.moonUpperTransitUtc).getTime();
        const lower = new Date(result.moonLowerTransitUtc).getTime();
        expect(lower - upper).toBe(12 * 60 * 60 * 1000);
      });

      it('moonriseUtc is a valid ISO string (not null) at non-polar latitude', () => {
        expect(result.moonriseUtc).not.toBeNull();
        expect(new Date(result.moonriseUtc!).getTime()).not.toBeNaN();
      });

      it('moonsetUtc is a valid ISO string (not null) at non-polar latitude', () => {
        expect(result.moonsetUtc).not.toBeNull();
        expect(new Date(result.moonsetUtc!).getTime()).not.toBeNaN();
      });

      it('returns rating 4 for new moon', () => {
        expect(result.rating).toBe(4);
      });

      it('returns high fishing score (80–100) for new moon', () => {
        expect(result.fishingScoreContribution).toBeGreaterThanOrEqual(80);
        expect(result.fishingScoreContribution).toBeLessThanOrEqual(100);
      });

      it('returns correct dateUtc', () => {
        expect(result.dateUtc).toBe('2024-01-11');
      });

      it('stores latitude on result', () => {
        expect(result.latitude).toBe(LAT_NY);
      });

      it('stores longitude on result', () => {
        expect(result.longitude).toBe(LNG_NY);
      });
    });

    // 2024-01-25 was a full moon
    describe('full moon — 2024-01-25, London', () => {
      let result: SolunarData;

      beforeEach(() => {
        result = service.calculateForDate(new Date('2024-01-25T00:00:00Z'), LAT_LDN, LNG_LDN);
      });

      it('returns rating 4 for full moon', () => {
        expect(result.rating).toBe(4);
      });

      it('returns high fishing score (80–100) for full moon', () => {
        expect(result.fishingScoreContribution).toBeGreaterThanOrEqual(80);
        expect(result.fishingScoreContribution).toBeLessThanOrEqual(100);
      });
    });

    // 2024-01-18 was near first quarter
    describe('first quarter — 2024-01-18', () => {
      it('returns rating 3 for first quarter', () => {
        const result = service.calculateForDate(new Date('2024-01-18T00:00:00Z'), LAT_NY, LNG_NY);
        expect(result.rating).toBe(3);
      });
    });
  });

  // ── Period ordering ───────────────────────────────────────────────────────

  describe('period ordering', () => {
    it('all periods are in chronological order by startUtc', () => {
      const result = service.calculateForDate(new Date('2024-01-15T00:00:00Z'), LAT_NY, LNG_NY);
      for (let i = 1; i < result.periods.length; i++) {
        const prev = new Date(result.periods[i - 1].startUtc).getTime();
        const curr = new Date(result.periods[i].startUtc).getTime();
        expect(curr).toBeGreaterThan(prev);
      }
    });

    it('period index values are 1–4 in sequence', () => {
      const result = service.calculateForDate(new Date('2024-01-15T00:00:00Z'), LAT_NY, LNG_NY);
      result.periods.forEach((p, i) => {
        expect(p.index as number).toBe(i + 1);
      });
    });
  });

  // ── Period durations ──────────────────────────────────────────────────────

  describe('period durations', () => {
    it('major periods have durationMinutes === 120', () => {
      const result = service.calculateForDate(new Date('2024-01-15T00:00:00Z'), LAT_NY, LNG_NY);
      result.periods
        .filter(p => p.type === 'major')
        .forEach(p => {
          expect(p.durationMinutes).toBe(120);
          const start = new Date(p.startUtc).getTime();
          const end = new Date(p.endUtc).getTime();
          expect(end - start).toBe(120 * 60 * 1000);
        });
    });

    it('minor periods have durationMinutes === 60', () => {
      const result = service.calculateForDate(new Date('2024-01-15T00:00:00Z'), LAT_NY, LNG_NY);
      result.periods
        .filter(p => p.type === 'minor')
        .forEach(p => {
          expect(p.durationMinutes).toBe(60);
          const start = new Date(p.startUtc).getTime();
          const end = new Date(p.endUtc).getTime();
          expect(end - start).toBe(60 * 60 * 1000);
        });
    });
  });

  // ── Period windows are symmetric ──────────────────────────────────────────

  describe('period windows are symmetric around transit/rise/set', () => {
    let result: SolunarData;

    beforeEach(() => {
      result = service.calculateForDate(new Date('2024-01-15T00:00:00Z'), LAT_NY, LNG_NY);
    });

    it('upper transit is the midpoint of the Moon Overhead period', () => {
      const period = result.periods.find(p => p.description === 'Moon Overhead')!;
      const start = new Date(period.startUtc).getTime();
      const end = new Date(period.endUtc).getTime();
      const transit = new Date(result.moonUpperTransitUtc).getTime();
      expect(transit - start).toBe(60 * 60 * 1000);
      expect(end - transit).toBe(60 * 60 * 1000);
    });

    it('lower transit is the midpoint of the Moon Underfoot period', () => {
      const period = result.periods.find(p => p.description === 'Moon Underfoot')!;
      const start = new Date(period.startUtc).getTime();
      const end = new Date(period.endUtc).getTime();
      const transit = new Date(result.moonLowerTransitUtc).getTime();
      expect(transit - start).toBe(60 * 60 * 1000);
      expect(end - transit).toBe(60 * 60 * 1000);
    });

    it('moonriseUtc is the midpoint of the Moonrise period', () => {
      const period = result.periods.find(p => p.description === 'Moonrise')!;
      const start = new Date(period.startUtc).getTime();
      const end = new Date(period.endUtc).getTime();
      const moonrise = new Date(result.moonriseUtc!).getTime();
      expect(moonrise - start).toBe(30 * 60 * 1000);
      expect(end - moonrise).toBe(30 * 60 * 1000);
    });

    it('moonsetUtc is the midpoint of the Moonset period', () => {
      const period = result.periods.find(p => p.description === 'Moonset')!;
      const start = new Date(period.startUtc).getTime();
      const end = new Date(period.endUtc).getTime();
      const moonset = new Date(result.moonsetUtc!).getTime();
      expect(moonset - start).toBe(30 * 60 * 1000);
      expect(end - moonset).toBe(30 * 60 * 1000);
    });
  });

  // ── Polar region ──────────────────────────────────────────────────────────

  describe('polar region (|lat| > 66.5°)', () => {
    let polarResult: SolunarData;

    beforeEach(() => {
      // 2024-06-21 is near summer solstice; above Arctic circle
      polarResult = service.calculateForDate(
        new Date('2024-06-21T00:00:00Z'),
        LAT_POLAR,
        LNG_POLAR
      );
    });

    it('returns exactly 2 periods', () => {
      expect(polarResult.periods.length).toBe(2);
    });

    it('all periods are major type', () => {
      expect(polarResult.periods.every(p => p.type === 'major')).toBeTrue();
    });

    it('moonriseUtc is null', () => {
      expect(polarResult.moonriseUtc).toBeNull();
    });

    it('moonsetUtc is null', () => {
      expect(polarResult.moonsetUtc).toBeNull();
    });

    it('fishingScoreContribution is in a reduced range (≤ 80)', () => {
      expect(polarResult.fishingScoreContribution).toBeLessThanOrEqual(80);
    });

    it('still returns valid transit times', () => {
      expect(new Date(polarResult.moonUpperTransitUtc).getTime()).not.toBeNaN();
      expect(new Date(polarResult.moonLowerTransitUtc).getTime()).not.toBeNaN();
    });

    it('returns 2 periods for southern polar latitude as well', () => {
      const southPolar = service.calculateForDate(new Date('2024-12-21T00:00:00Z'), -70.0, -25.0);
      expect(southPolar.periods.length).toBe(2);
      expect(southPolar.moonriseUtc).toBeNull();
    });
  });

  // ── Longitude UTC offset ──────────────────────────────────────────────────

  describe('longitude UTC offset', () => {
    it('eastern longitude transits earlier in UTC than western', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const eastern = service.calculateForDate(date, 40, 30); // Istanbul
      const western = service.calculateForDate(date, 40, -74); // New York
      const eastTransit = new Date(eastern.moonUpperTransitUtc).getTime();
      const westTransit = new Date(western.moonUpperTransitUtc).getTime();
      expect(eastTransit).toBeLessThan(westTransit);
    });

    it('transit UTC difference matches longitude difference divided by 15', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const east = service.calculateForDate(date, 40, 30);
      const west = service.calculateForDate(date, 40, -30);
      const diffMs =
        new Date(west.moonUpperTransitUtc).getTime() - new Date(east.moonUpperTransitUtc).getTime();
      const expectedDiffMs = ((30 - -30) / 15) * 3600000; // 4 hours
      expect(diffMs).toBe(expectedDiffMs);
    });
  });

  // ── Determinism ───────────────────────────────────────────────────────────

  describe('determinism', () => {
    it('produces identical results for the same date and location', () => {
      const date = new Date('2024-03-20T00:00:00Z');
      const r1 = service.calculateForDate(date, LAT_NY, LNG_NY);
      const r2 = service.calculateForDate(date, LAT_NY, LNG_NY);
      expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
    });
  });

  // ── calculateForToday() ───────────────────────────────────────────────────

  describe('calculateForToday()', () => {
    it("returns today's UTC date string", () => {
      const result = service.calculateForToday(LAT_NY, LNG_NY);
      const today = new Date().toISOString().slice(0, 10);
      expect(result.dateUtc).toBe(today);
    });

    it('returns 4 periods for non-polar location', () => {
      expect(service.calculateForToday(LAT_NY, LNG_NY).periods.length).toBe(4);
    });
  });

  // ── calculateForDateString() ──────────────────────────────────────────────

  describe('calculateForDateString()', () => {
    it('produces the same result as calculateForDate() with matching UTC midnight', () => {
      const r1 = service.calculateForDateString('2024-03-20', LAT_NY, LNG_NY);
      const r2 = service.calculateForDate(new Date('2024-03-20T00:00:00Z'), LAT_NY, LNG_NY);
      expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
    });
  });

  // ── calculateFishingScore() ───────────────────────────────────────────────

  describe('calculateFishingScore()', () => {
    it('returns 80–100 for new moon with 4 periods', () => {
      // 2024-01-11 was new moon
      const result = service.calculateForDate(new Date('2024-01-11T00:00:00Z'), LAT_NY, LNG_NY);
      expect(result.fishingScoreContribution).toBeGreaterThanOrEqual(80);
      expect(result.fishingScoreContribution).toBeLessThanOrEqual(100);
    });

    it('returns 80–100 for full moon with 4 periods', () => {
      // 2024-01-25 was full moon
      const result = service.calculateForDate(new Date('2024-01-25T00:00:00Z'), LAT_NY, LNG_NY);
      expect(result.fishingScoreContribution).toBeGreaterThanOrEqual(80);
      expect(result.fishingScoreContribution).toBeLessThanOrEqual(100);
    });

    it('returns 40–80 for polar region (reduced period count)', () => {
      const result = service.calculateForDate(
        new Date('2024-06-21T00:00:00Z'),
        LAT_POLAR,
        LNG_POLAR
      );
      expect(result.fishingScoreContribution).toBeGreaterThanOrEqual(40);
      expect(result.fishingScoreContribution).toBeLessThanOrEqual(80);
    });

    it('score is clamped to [0, 100]', () => {
      // Run across many dates and locations to check clamping
      const dates = ['2024-01-01', '2024-06-21', '2024-12-25'];
      const lats = [0, 45, 66, -45];
      const lngs = [-74, 0, 139];
      for (const d of dates) {
        for (const lat of lats) {
          for (const lng of lngs) {
            const r = service.calculateForDateString(d, lat, lng);
            expect(r.fishingScoreContribution).toBeGreaterThanOrEqual(0);
            expect(r.fishingScoreContribution).toBeLessThanOrEqual(100);
          }
        }
      }
    });
  });

  // ── Period descriptions ───────────────────────────────────────────────────

  describe('period descriptions', () => {
    it('all 4 descriptions are present for non-polar result', () => {
      const result = service.calculateForDate(new Date('2024-01-15T00:00:00Z'), LAT_NY, LNG_NY);
      const descriptions = result.periods.map(p => p.description);
      expect(descriptions).toContain('Moon Overhead');
      expect(descriptions).toContain('Moon Underfoot');
      expect(descriptions).toContain('Moonrise');
      expect(descriptions).toContain('Moonset');
    });

    it('polar result only has Moon Overhead and Moon Underfoot', () => {
      const result = service.calculateForDate(
        new Date('2024-06-21T00:00:00Z'),
        LAT_POLAR,
        LNG_POLAR
      );
      const descriptions = result.periods.map(p => p.description);
      expect(descriptions).toContain('Moon Overhead');
      expect(descriptions).toContain('Moon Underfoot');
      expect(descriptions).not.toContain('Moonrise');
      expect(descriptions).not.toContain('Moonset');
    });
  });
});
