import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'moon',
    loadComponent: () =>
      import('./moon-phase/moon-details.component').then(m => m.MoonDetailsComponent),
  },
  {
    path: 'solunar',
    loadComponent: () =>
      import('./solunar/solunar-details.component').then(m => m.SolunarDetailsComponent),
  },
  {
    path: 'weather',
    loadComponent: () =>
      import('./weather/weather-details.component').then(m => m.WeatherDetailsComponent),
  },
];
