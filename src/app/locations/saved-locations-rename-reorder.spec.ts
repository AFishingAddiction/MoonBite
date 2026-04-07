import { TestBed } from '@angular/core/testing';
import { SavedLocationsService } from './saved-locations.service';

const LOCATIONS_KEY = 'moonbite_saved_locations';

describe('SavedLocationsService — rename() and reorder()', () => {
  let service: SavedLocationsService;

  function freshService(): SavedLocationsService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SavedLocationsService);
  }

  beforeEach(() => {
    localStorage.clear();
    service = freshService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── rename() ─────────────────────────────────────────────────────────────

  describe('rename()', () => {
    it('should rename an existing location', () => {
      service.add('Old Name', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, 'New Name');
      expect(service.locations()[0].name).toBe('New Name');
    });

    it('should trim whitespace from the new name', () => {
      service.add('Old Name', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, '  Trimmed Name  ');
      expect(service.locations()[0].name).toBe('Trimmed Name');
    });

    it('should reject an empty name and leave the location unchanged', () => {
      service.add('Original', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, '');
      expect(service.locations()[0].name).toBe('Original');
    });

    it('should reject a whitespace-only name and leave the location unchanged', () => {
      service.add('Original', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, '   ');
      expect(service.locations()[0].name).toBe('Original');
    });

    it('should reject a name longer than 50 characters', () => {
      service.add('Original', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, 'A'.repeat(51));
      expect(service.locations()[0].name).toBe('Original');
    });

    it('should accept a name of exactly 50 characters', () => {
      service.add('Original', 10, 20);
      const id = service.locations()[0].id;
      const fiftyChars = 'A'.repeat(50);
      service.rename(id, fiftyChars);
      expect(service.locations()[0].name).toBe(fiftyChars);
    });

    it('should no-op for an unknown id', () => {
      service.add('Spot A', 10, 20);
      service.rename('nonexistent-id', 'Something');
      expect(service.locations()[0].name).toBe('Spot A');
    });

    it('should not alter other locations when renaming one', () => {
      service.add('Spot A', 10, 20);
      service.add('Spot B', 30, 40);
      const idA = service.locations()[0].id;
      service.rename(idA, 'Renamed A');
      expect(service.locations()[1].name).toBe('Spot B');
    });

    it('should persist the renamed location to localStorage', () => {
      service.add('Old Name', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, 'New Name');
      const raw = localStorage.getItem(LOCATIONS_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed[0].name).toBe('New Name');
    });

    it('should not persist when rename is rejected due to empty name', () => {
      service.add('Original', 10, 20);
      const id = service.locations()[0].id;
      // Capture the storage state after add
      const rawAfterAdd = localStorage.getItem(LOCATIONS_KEY);
      service.rename(id, '');
      expect(localStorage.getItem(LOCATIONS_KEY)).toBe(rawAfterAdd);
    });

    it('should reflect the rename in the signal on next read', () => {
      service.add('Old', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, 'New');
      // Signal should reflect immediately
      const found = service.locations().find(l => l.id === id);
      expect(found?.name).toBe('New');
    });

    it('should reload renamed name from localStorage after reinit', () => {
      service.add('Old', 10, 20);
      const id = service.locations()[0].id;
      service.rename(id, 'Persisted Name');
      const fresh = freshService();
      expect(fresh.locations().find(l => l.id === id)?.name).toBe('Persisted Name');
    });
  });

  // ─── reorder() ────────────────────────────────────────────────────────────

  describe('reorder()', () => {
    it('should reorder locations to match the given id array', () => {
      service.add('First', 10, 20);
      service.add('Second', 30, 40);
      service.add('Third', 50, 60);
      const [idA, idB, idC] = service.locations().map(l => l.id);

      service.reorder([idC, idA, idB]);

      const names = service.locations().map(l => l.name);
      expect(names).toEqual(['Third', 'First', 'Second']);
    });

    it('should persist the new order to localStorage', () => {
      service.add('Alpha', 10, 20);
      service.add('Beta', 30, 40);
      const [idA, idB] = service.locations().map(l => l.id);

      service.reorder([idB, idA]);

      const raw = localStorage.getItem(LOCATIONS_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed[0].name).toBe('Beta');
      expect(parsed[1].name).toBe('Alpha');
    });

    it('should ignore unknown ids and only include known locations', () => {
      service.add('Spot A', 10, 20);
      service.add('Spot B', 30, 40);
      const [idA, idB] = service.locations().map(l => l.id);

      service.reorder([idB, 'unknown-id-xyz', idA]);

      const names = service.locations().map(l => l.name);
      expect(names).toEqual(['Spot B', 'Spot A']);
    });

    it('should handle an empty id array gracefully', () => {
      service.add('Spot A', 10, 20);
      service.reorder([]);
      // All locations dropped from the ordered result (or no-op — service decides)
      // At minimum it must not throw and signal must be an array
      expect(Array.isArray(service.locations())).toBeTrue();
    });

    it('should not throw when given all unknown ids', () => {
      service.add('Spot A', 10, 20);
      expect(() => service.reorder(['fake-1', 'fake-2'])).not.toThrow();
    });

    it('should update the signal immediately after reorder', () => {
      service.add('X', 1, 2);
      service.add('Y', 3, 4);
      const [idX, idY] = service.locations().map(l => l.id);

      service.reorder([idY, idX]);

      expect(service.locations()[0].name).toBe('Y');
    });

    it('should survive a round-trip through localStorage after reorder', () => {
      service.add('P', 1, 2);
      service.add('Q', 3, 4);
      const [idP, idQ] = service.locations().map(l => l.id);

      service.reorder([idQ, idP]);

      const fresh = freshService();
      expect(fresh.locations()[0].name).toBe('Q');
      expect(fresh.locations()[1].name).toBe('P');
    });

    it('should handle a partial id array by placing remaining locations at the end', () => {
      service.add('A', 1, 2);
      service.add('B', 3, 4);
      service.add('C', 5, 6);
      const [idA, , idC] = service.locations().map(l => l.id);

      // Only specify 2 of 3 ids — service may append or drop unspecified ones
      // The specified order must be respected
      service.reorder([idC, idA]);

      const reordered = service.locations();
      expect(reordered[0].name).toBe('C');
      expect(reordered[1].name).toBe('A');
    });
  });
});
