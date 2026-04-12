# MoonBite

MoonBite combines solunar tables, moon phase, weather forecast, and barometric pressure into a single daily "fishing score" for your location.

## Agent Workflows

See [`docs/AGENTS.md`](docs/AGENTS.md) for the recommended agent workflow guide — which agents are relevant to this project and how to compose them for common tasks.

## Feature Requirements

Individual feature requirement files live in [`docs/feature-requirements/`](docs/feature-requirements/). Each file is named `feature-NN-<slug>.md` where `NN` is the feature number. The consolidated source document is [`docs/FEATURE-REQUIREMENTS.md`](docs/FEATURE-REQUIREMENTS.md).

| File | Feature | Status |
|---|---|---|
| `feature-01-geolocation.md` | Geolocation Permission & Display | Complete |
| `feature-02-moon-phase.md` | Moon Phase Data Service | Complete |
| `feature-03-solunar.md` | Solunar Table Data Service | Complete |
| `feature-04-weather.md` | Weather Data Service | Complete |
| `feature-05-scoring.md` | Fishing Score Calculation Engine | Complete |
| `feature-06-home-screen.md` | App Shell & Home Screen | Complete |
| `feature-07-responsive-design.md` | Responsive Design & Mobile-First CSS | Complete |
| `feature-08-moon-details.md` | Moon Phase Details Screen | Complete |
| `feature-09-solunar-details.md` | Solunar Peak Times Details Screen | Complete |
| `feature-10-weather-details.md` | Weather Details Screen | Complete |
| `feature-11-score-breakdown.md` | Score Breakdown Explanation | Complete |
| `feature-12-navigation.md` | Bottom Navigation / Routing | Complete |
| `feature-13-saved-locations.md` | Location Bookmarks / Saved Locations | Complete |
| `feature-14-preferences.md` | User Settings & Preferences | Complete |
| `feature-15-daily-history.md` | Daily Score History & Trends | Complete |
| `feature-18-location-library.md` | Location Search & Library | Complete |
| `feature-23-solunar-local-time.md` | Solunar Peak Times in Local Time | Complete |

## Project overview

- **Framework:** Angular 21 (standalone components)
- **Language:** TypeScript 5.9+
- **Styling:** SCSS
- **State management:** Angular Signals (built-in)
- **Component library:** None
- **Unit tests:** Jasmine + Karma (coverage threshold: 85%)
- **Acceptance tests:** Playwright
- **Linting:** ESLint + angular-eslint + Prettier

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at http://localhost:4202 |
| `npm test` | Run unit tests (Jasmine/Karma) |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run e2e` | Run Playwright E2E tests (requires running server) |
| `npm run e2e:ui` | Run Playwright in UI mode |
| `npm run build` | Production build |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |


## Architecture

- `src/app/` - Application source
- `src/app/app.component.ts` - Root component
- `src/app/app.config.ts` - Application providers/config
- `src/app/app.routes.ts` - Route definitions
- `e2e/` - Playwright acceptance tests
- `e2e/tests/*.spec.ts` - E2E and component tests

## Angular conventions

- Use standalone components (no NgModules)
- Use `inject()` over constructor injection
- Use Angular's new control flow syntax (`@if`, `@for`, `@switch`)
- Use signals for reactive state (`signal()`, `computed()`, `effect()`)
- Component files: `name.component.ts`, `.html`, `.scss`, `.spec.ts`
- Services: `name.service.ts` with `providedIn: 'root'`
- Use `OnPush` change detection for performance-critical components




## Testing conventions

- Unit tests: co-located with source files (`*.spec.ts`)
- Coverage threshold: 85% (statements, branches, functions, lines)
- E2E tests: `e2e/tests/`
- Use `TestBed.configureTestingModule` for component tests
- Prefer `fixture.debugElement` queries over direct DOM access
- Mock HTTP with `provideHttpClientTesting()`
- Use `page.getByRole()` and `page.getByText()` in Playwright for accessible selectors
- Always capture test output with `tee` to grep later: `npm run test:ci 2>&1 | tee /tmp/test-results.txt`

## Code style

- Strict TypeScript: no `any`, no `!` non-null assertions without justification
- Avoid barrel files (`index.ts` re-exports) unless the module is large
- Keep components small and focused; extract logic into services
- Prefer `readonly` for injected dependencies and computed values

- Code formatted with Prettier (run `npm run format` or enable format-on-save)
- Prettier config: single quotes, trailing commas (ES5), 100-char line width

