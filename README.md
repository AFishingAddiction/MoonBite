# MoonBite

MoonBite combines solunar tables, moon phase, weather forecast, and barometric pressure into a single daily "fishing score" for your location.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:4202](http://localhost:4202) in your browser. The app will automatically reload when you change source files.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at http://localhost:4202 |
| `npm run build` | Production build (output in `dist/`) |
| `npm test` | Run unit tests (Jasmine/Karma) |
| `npm run test:coverage` | Run unit tests and generate coverage report |
| `npm run lint` | Run ESLint on TypeScript and HTML files |
| `npm run e2e` | Run Playwright end-to-end tests |
| `npm run e2e:ui` | Open Playwright UI mode |
| `npm run e2e:report` | View the last Playwright HTML report |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check formatting without writing changes |


## Project Structure

```
src/
  app/
    app.component.ts       # Root component
    app.component.html     # Root template
    app.component.scss     # Root styles
    app.component.spec.ts  # Unit tests
    app.config.ts          # Application providers
    app.routes.ts          # Route definitions
  index.html               # App shell
  main.ts                  # Bootstrap entry point
  styles.scss              # Global styles
e2e/
  playwright.config.ts     # Playwright configuration
  tests/
    app.spec.ts            # E2E tests
    app.component.spec.ts  # Component-level tests
```

## Tech Stack

- [Angular 21](https://angular.dev) — Framework
- [TypeScript 5.9](https://www.typescriptlang.org/) — Language
- [RxJS 7](https://rxjs.dev) — Reactive programming



- [Jasmine](https://jasmine.github.io/) + [Karma](https://karma-runner.github.io/) — Unit testing
- [Playwright](https://playwright.dev) — End-to-end testing
- [ESLint](https://eslint.org/) + [angular-eslint](https://github.com/angular-eslint/angular-eslint) — Linting

- [Prettier](https://prettier.io) — Code formatting


## Development

### Adding a New Component

```bash
npx ng generate component features/my-feature
```

### Adding a New Service

```bash
npx ng generate service core/my-service
```

### Running Tests with Coverage

After running `npm run test:coverage`, open `coverage/moonbite/index.html` to view the full coverage report. The project enforces a minimum 85% coverage threshold.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Format code: `npm run format`
5. Submit a pull request
