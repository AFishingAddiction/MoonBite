import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { SavedLocationsService } from '../locations/saved-locations.service';

@Component({
  selector: 'app-location-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './location-display.component.html',
  styleUrl: './location-display.component.scss',
})
export class LocationDisplayComponent {
  protected readonly geo = inject(GeolocationService);
  protected readonly savedLocations = inject(SavedLocationsService);

  protected readonly isSavingLocation = signal(false);
  protected readonly pendingLocationName = signal('');

  requestLocation(): void {
    this.geo.requestLocation();
  }

  retry(): void {
    this.geo.requestLocation();
  }

  startSaving(): void {
    this.pendingLocationName.set('My Fishing Spot');
    this.isSavingLocation.set(true);
  }

  confirmSave(): void {
    const name = this.pendingLocationName().trim();
    if (!name) return;
    const pos = this.geo.state().position;
    if (!pos) return;
    this.savedLocations.add(name, pos.coords.latitude, pos.coords.longitude);
    this.isSavingLocation.set(false);
    this.pendingLocationName.set('');
  }

  cancelSave(): void {
    this.isSavingLocation.set(false);
    this.pendingLocationName.set('');
  }

  updatePendingName(event: Event): void {
    this.pendingLocationName.set((event.target as HTMLInputElement).value);
  }

  clearActiveLocation(): void {
    this.savedLocations.setActive(null);
  }

  formatCoord(value: number, posLabel: string, negLabel: string): string {
    const abs = Math.abs(value).toFixed(4);
    const label = value >= 0 ? posLabel : negLabel;
    return `${abs}° ${label}`;
  }
}
