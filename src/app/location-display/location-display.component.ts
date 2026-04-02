import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GeolocationService } from '../geolocation/geolocation.service';

@Component({
  selector: 'app-location-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-display.component.html',
  styleUrl: './location-display.component.scss',
})
export class LocationDisplayComponent {
  protected readonly geo = inject(GeolocationService);

  requestLocation(): void {
    this.geo.requestLocation();
  }

  retry(): void {
    this.geo.requestLocation();
  }

  formatCoord(value: number, posLabel: string, negLabel: string): string {
    const abs = Math.abs(value).toFixed(4);
    const label = value >= 0 ? posLabel : negLabel;
    return `${abs}° ${label}`;
  }
}
