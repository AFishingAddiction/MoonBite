import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FishingScoreDisplayComponent } from '../scoring/fishing-score-display.component';
import { LocationDisplayComponent } from '../location-display/location-display.component';
import { MoonPhaseDisplayComponent } from '../moon-phase/moon-phase-display.component';
import { SolunarDisplayComponent } from '../solunar/solunar-display.component';
import { WeatherDisplayComponent } from '../weather/weather-display.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FishingScoreDisplayComponent,
    LocationDisplayComponent,
    MoonPhaseDisplayComponent,
    SolunarDisplayComponent,
    WeatherDisplayComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
