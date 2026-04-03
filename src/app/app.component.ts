import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocationDisplayComponent } from './location-display/location-display.component';
import { MoonPhaseDisplayComponent } from './moon-phase/moon-phase-display.component';
import { SolunarDisplayComponent } from './solunar/solunar-display.component';
import { WeatherDisplayComponent } from './weather/weather-display.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    LocationDisplayComponent,
    MoonPhaseDisplayComponent,
    SolunarDisplayComponent,
    WeatherDisplayComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
