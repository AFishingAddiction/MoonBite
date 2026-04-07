import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GeolocationService } from '../geolocation/geolocation.service';
import { SavedLocationsService } from './saved-locations.service';
import { LocationSearchService } from './location-search.service';
import { GeocodingResult } from './geocoding-result.model';

@Component({
  selector: 'app-saved-locations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './saved-locations.component.html',
  styleUrl: './saved-locations.component.scss',
})
export class SavedLocationsComponent {
  protected readonly savedLocations = inject(SavedLocationsService);
  protected readonly geoService = inject(GeolocationService);
  protected readonly locationSearch = inject(LocationSearchService);

  protected readonly maxLocations = SavedLocationsService.MAX_LOCATIONS;

  protected readonly geoStatus = computed(() => this.geoService.state().status);
  protected readonly geoPosition = computed(() => this.geoService.state().position);

  protected readonly atMaxLocations = computed(
    () => this.savedLocations.locations().length >= this.maxLocations,
  );

  protected readonly isAddingLocation = signal(false);
  protected readonly newLocationName = signal('');
  protected readonly addError = signal('');

  // ─── Search state ──────────────────────────────────────────────────────────

  protected readonly searchQuery = signal('');
  protected readonly selectedResult = signal<GeocodingResult | null>(null);
  protected readonly confirmName = signal('');
  protected readonly searchAddError = signal('');

  protected startAdding(): void {
    this.newLocationName.set('My Fishing Spot');
    this.addError.set('');
    this.isAddingLocation.set(true);
  }

  protected confirmAdd(): void {
    const name = this.newLocationName().trim();
    if (!name) {
      this.addError.set('Please enter a name for this location.');
      return;
    }
    const pos = this.geoPosition();
    if (!pos) return;

    const added = this.savedLocations.add(name, pos.coords.latitude, pos.coords.longitude);
    if (!added) {
      this.addError.set(
        `Maximum of ${this.maxLocations} locations reached. Delete one to add a new location.`,
      );
      return;
    }
    this.isAddingLocation.set(false);
    this.newLocationName.set('');
    this.addError.set('');
  }

  protected cancelAdd(): void {
    this.isAddingLocation.set(false);
    this.addError.set('');
  }

  protected updateName(event: Event): void {
    this.newLocationName.set((event.target as HTMLInputElement).value);
  }

  protected setActive(id: string): void {
    this.savedLocations.setActive(id);
  }

  protected clearActive(): void {
    this.savedLocations.setActive(null);
  }

  protected remove(id: string): void {
    if (this.savedLocations.activeLocation()?.id === id) {
      this.savedLocations.setActive(null);
    }
    this.savedLocations.remove(id);
  }

  protected isActive(id: string): boolean {
    return this.savedLocations.activeLocation()?.id === id;
  }

  protected formatLat(lat: number): string {
    return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  }

  protected formatLng(lng: number): string {
    return `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  }

  // ─── Search handlers ───────────────────────────────────────────────────────

  protected onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.locationSearch.search(query);
  }

  protected onClearSearch(): void {
    this.searchQuery.set('');
    this.locationSearch.clear();
    this.selectedResult.set(null);
    this.confirmName.set('');
    this.searchAddError.set('');
  }

  protected onSelectResult(result: GeocodingResult): void {
    this.selectedResult.set(result);
    this.confirmName.set(result.displayName);
    this.searchAddError.set('');
  }

  protected onCancelConfirm(): void {
    this.selectedResult.set(null);
    this.confirmName.set('');
    this.searchAddError.set('');
  }

  protected updateConfirmName(event: Event): void {
    this.confirmName.set((event.target as HTMLInputElement).value);
  }

  protected onConfirmAdd(): void {
    const result = this.selectedResult();
    if (!result) return;

    const name = this.confirmName().trim();
    if (!name) {
      this.searchAddError.set('Please enter a name for this location.');
      return;
    }

    const added = this.savedLocations.add(name, result.latitude, result.longitude);
    if (!added) {
      this.searchAddError.set(
        `Maximum of ${this.maxLocations} locations reached. Delete one to add a new location.`,
      );
      return;
    }

    this.selectedResult.set(null);
    this.confirmName.set('');
    this.searchAddError.set('');
    this.onClearSearch();
  }

  protected onRetrySearch(): void {
    this.locationSearch.retry();
  }
}
