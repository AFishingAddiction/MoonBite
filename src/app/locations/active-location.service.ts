import { Injectable, computed, inject } from '@angular/core';
import { GeolocationService } from '../geolocation/geolocation.service';
import { SavedLocationsService } from './saved-locations.service';

export interface ActiveCoords {
  readonly latitude: number;
  readonly longitude: number;
  /** null when sourced from GPS (no user-assigned name). */
  readonly name: string | null;
}

/**
 * Unified location source for all display components.
 *
 * Priority: active saved location > live GPS.
 * When a saved location is active, GPS state is ignored for
 * `isLocating` and `hasError` so components render normally.
 */
@Injectable({ providedIn: 'root' })
export class ActiveLocationService {
  private readonly geoService = inject(GeolocationService);
  private readonly savedLocationsService = inject(SavedLocationsService);

  /** Active coordinates, or null when no location is available. */
  readonly coords = computed<ActiveCoords | null>(() => {
    const saved = this.savedLocationsService.activeLocation();
    if (saved) {
      return { latitude: saved.latitude, longitude: saved.longitude, name: saved.name };
    }
    const state = this.geoService.state();
    if (state.status === 'granted' && state.position) {
      return {
        latitude: state.position.coords.latitude,
        longitude: state.position.coords.longitude,
        name: null,
      };
    }
    return null;
  });

  /** Mirrors `GeolocationState.status`; returns 'granted' when a saved location is active. */
  readonly status = computed(() => {
    if (this.savedLocationsService.activeLocation()) return 'granted' as const;
    return this.geoService.state().status;
  });

  /** True only when waiting for GPS and no saved location is active. */
  readonly isLocating = computed(() => {
    if (this.savedLocationsService.activeLocation()) return false;
    const s = this.geoService.state().status;
    return s === 'idle' || s === 'requesting';
  });

  /** True only when GPS failed and no saved location is active. */
  readonly hasError = computed(() => {
    if (this.savedLocationsService.activeLocation()) return false;
    const s = this.geoService.state().status;
    return s === 'denied' || s === 'unavailable' || s === 'error';
  });
}
