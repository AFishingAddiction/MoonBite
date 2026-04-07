import { Injectable, computed, signal } from '@angular/core';
import { SavedLocation } from './saved-location.model';

@Injectable({ providedIn: 'root' })
export class SavedLocationsService {
  static readonly MAX_LOCATIONS = 10;
  private static readonly LOCATIONS_KEY = 'moonbite_saved_locations';
  private static readonly ACTIVE_KEY = 'moonbite_active_location_id';

  private readonly _locations = signal<SavedLocation[]>(this.loadLocations());
  private readonly _activeId = signal<string | null>(this.loadActiveId());

  readonly locations = this._locations.asReadonly();

  readonly activeLocation = computed(
    () => this._locations().find(l => l.id === this._activeId()) ?? null,
  );

  add(name: string, latitude: number, longitude: number): SavedLocation | null {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    if (this._locations().length >= SavedLocationsService.MAX_LOCATIONS) return null;

    const location: SavedLocation = {
      id: crypto.randomUUID(),
      name: trimmedName,
      latitude,
      longitude,
      createdAt: new Date().toISOString(),
    };

    const updated = [...this._locations(), location];
    this._locations.set(updated);
    this.persistLocations(updated);
    return location;
  }

  remove(id: string): void {
    const updated = this._locations().filter(l => l.id !== id);
    this._locations.set(updated);
    this.persistLocations(updated);

    if (this._activeId() === id) {
      this._activeId.set(null);
      this.persistActiveId(null);
    }
  }

  setActive(id: string | null): void {
    this._activeId.set(id);
    this.persistActiveId(id);
  }

  private loadLocations(): SavedLocation[] {
    try {
      const raw = localStorage.getItem(SavedLocationsService.LOCATIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private loadActiveId(): string | null {
    try {
      return localStorage.getItem(SavedLocationsService.ACTIVE_KEY);
    } catch {
      return null;
    }
  }

  private persistLocations(locations: SavedLocation[]): void {
    try {
      localStorage.setItem(SavedLocationsService.LOCATIONS_KEY, JSON.stringify(locations));
    } catch {
      // Storage unavailable — silently ignore
    }
  }

  private persistActiveId(id: string | null): void {
    try {
      if (id === null) {
        localStorage.removeItem(SavedLocationsService.ACTIVE_KEY);
      } else {
        localStorage.setItem(SavedLocationsService.ACTIVE_KEY, id);
      }
    } catch {
      // Storage unavailable — silently ignore
    }
  }
}
