import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

interface NavTab {
  readonly icon: string;
  readonly label: string;
  readonly route: string;
}

// Routes that belong to the Home tab (treated as Home children)
const HOME_CHILD_ROUTES = new Set(['/score']);

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly tabs: readonly NavTab[] = [
    { icon: '🏠', label: 'Home',    route: '/'        },
    { icon: '🌙', label: 'Moon',    route: '/moon'    },
    { icon: '☀️',  label: 'Solunar', route: '/solunar' },
    { icon: '☁️',  label: 'Weather', route: '/weather' },
  ];

  protected readonly activeRoute = computed(() => {
    const url = this.currentUrl();
    if (HOME_CHILD_ROUTES.has(url)) return '/';
    return url;
  });

  isTabActive(route: string): boolean {
    return this.activeRoute() === route;
  }
}
