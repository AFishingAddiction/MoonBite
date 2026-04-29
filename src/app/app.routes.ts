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
  {
    path: 'score',
    loadComponent: () =>
      import('./scoring/score-breakdown.component').then(m => m.ScoreBreakdownComponent),
  },
  {
    path: 'locations',
    loadComponent: () =>
      import('./locations/saved-locations.component').then(m => m.SavedLocationsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history/score-history.component').then(m => m.ScoreHistoryComponent),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./notifications/notifications-screen.component').then(
        m => m.NotificationsScreenComponent,
      ),
  },
];
