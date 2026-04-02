import { Injectable, signal } from '@angular/core';

export interface GeolocationState {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly _state = signal<GeolocationState>({
    status: 'idle',
    position: null,
    error: null,
  });

  readonly state = this._state.asReadonly();

  requestLocation(): void {
    if (!navigator.geolocation) {
      this._state.set({ status: 'unavailable', position: null, error: null });
      return;
    }

    this._state.set({ status: 'requesting', position: null, error: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this._state.set({ status: 'granted', position, error: null });
      },
      (error) => {
        const status = error.code === 1 ? 'denied' : 'error';
        this._state.set({ status, position: null, error });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  reset(): void {
    this._state.set({ status: 'idle', position: null, error: null });
  }
}
