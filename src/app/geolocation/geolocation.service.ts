import { Injectable, signal } from '@angular/core';
import { detectPlatform } from './platform-detector';

export interface GeolocationState {
  status:
    | 'idle'
    | 'checking-permission'
    | 'requesting'
    | 'granted'
    | 'denied'
    | 'denied-previously'
    | 'unavailable'
    | 'error';
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  permissionState?: PermissionState;
  platform?: 'android' | 'ios' | 'desktop';
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly _state = signal<GeolocationState>({
    status: 'idle',
    position: null,
    error: null,
  });

  readonly state = this._state.asReadonly();

  async requestLocation(): Promise<void> {
    if (!navigator.geolocation) {
      this._state.set({ status: 'unavailable', position: null, error: null });
      return;
    }

    const platform = detectPlatform();

    if (navigator.permissions) {
      this._state.set({ status: 'checking-permission', position: null, error: null, platform });

      const permStatus = await navigator.permissions.query({ name: 'geolocation' });

      if (permStatus.state === 'denied') {
        this._state.set({
          status: 'denied-previously',
          position: null,
          error: null,
          permissionState: permStatus.state,
          platform,
        });
        return;
      }
    }

    this._state.set({ status: 'requesting', position: null, error: null, platform });

    navigator.geolocation.getCurrentPosition(
      position => {
        this._state.set({ status: 'granted', position, error: null, platform });
      },
      error => {
        const status = error.code === 1 ? 'denied' : 'error';
        this._state.set({ status, position: null, error, platform });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  async retryLocation(): Promise<void> {
    return this.requestLocation();
  }

  reset(): void {
    this._state.set({ status: 'idle', position: null, error: null });
  }
}
