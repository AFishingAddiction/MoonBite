import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SavedLocation } from '../locations/saved-location.model';
import { SavedLocationsService } from '../locations/saved-locations.service';
import { TimeFormat, UnitSystem } from '../preferences/preferences.model';
import { PreferencesService } from '../preferences/preferences.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly prefsService = inject(PreferencesService);
  private readonly locationsService = inject(SavedLocationsService);

  readonly unitSystem = this.prefsService.unitSystem;
  readonly timeFormat = this.prefsService.timeFormat;
  readonly locations = this.locationsService.locations;

  readonly editingId = signal<string | null>(null);
  readonly editingName = signal<string>('');

  setUnitSystem(system: UnitSystem): void {
    this.prefsService.setUnitSystem(system);
  }

  setTimeFormat(format: TimeFormat): void {
    this.prefsService.setTimeFormat(format);
  }

  startRename(location: SavedLocation): void {
    this.editingId.set(location.id);
    this.editingName.set(location.name);
  }

  confirmRename(): void {
    const id = this.editingId();
    const name = this.editingName();
    if (id !== null && name.trim().length > 0) {
      this.locationsService.rename(id, name);
    }
    this.editingId.set(null);
    this.editingName.set('');
  }

  cancelRename(): void {
    this.editingId.set(null);
    this.editingName.set('');
  }
}
