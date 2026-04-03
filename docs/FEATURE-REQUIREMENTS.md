# MoonBite — Feature Requirements

## Feature Index

### Milestone 1: MVP — Daily Fishing Score

| # | File | Feature | Status |
|---|---|---|---|
| 01 | `feature-requirements/feature-01-geolocation.md` | Geolocation Permission & Display | Complete |
| 02 | `feature-requirements/feature-02-moon-phase.md` | Moon Phase Data Service | Complete |
| 03 | `feature-requirements/feature-03-solunar.md` | Solunar Table Data Service | Complete |
| 04 | `feature-requirements/feature-04-weather.md` | Weather Data Service | Complete |
| 05 | `feature-requirements/feature-05-scoring.md` | Fishing Score Calculation Engine | Backlog |
| 06 | `feature-requirements/feature-06-home-screen.md` | App Shell & Home Screen | Backlog |
| 07 | `feature-requirements/feature-07-responsive-design.md` | Responsive Design & Mobile-First CSS | Backlog |

### Milestone 2: Core Value — Detailed Breakdowns

| # | File | Feature | Status |
|---|---|---|---|
| 08 | `feature-requirements/feature-08-moon-details.md` | Moon Phase Details Screen | Backlog |
| 09 | `feature-requirements/feature-09-solunar-details.md` | Solunar Peak Times Details Screen | Backlog |
| 10 | `feature-requirements/feature-10-weather-details.md` | Weather Details Screen | Backlog |
| 11 | `feature-requirements/feature-11-score-breakdown.md` | Score Breakdown Explanation | Backlog |
| 12 | `feature-requirements/feature-12-navigation.md` | Bottom Navigation / Routing | Backlog |
| 13 | `feature-requirements/feature-13-saved-locations.md` | Location Bookmarks / Saved Locations | Backlog |
| 14 | `feature-requirements/feature-14-preferences.md` | User Settings & Preferences | Backlog |
| 15 | `feature-requirements/feature-15-history.md` | Daily Score History & Trends | Backlog |
| 16 | `feature-requirements/feature-16-branding.md` | Splash Screen & App Branding | Backlog |

### Milestone 3: Engagement & Persistence

| # | File | Feature | Status |
|---|---|---|---|
| 17 | `feature-requirements/feature-17-sharing.md` | Share Score / Daily Report | Backlog |
| 18 | `feature-requirements/feature-18-location-library.md` | Location Search & Library | Backlog |
| 19 | `feature-requirements/feature-19-notifications.md` | Smart Notifications & Alerts | Backlog |
| 20 | `feature-requirements/feature-20-catch-logging.md` | Catch Logging & Fishing Journal | Backlog |
| 21 | `feature-requirements/feature-21-analytics.md` | Analytics Dashboard for Power Users | Backlog |
| 22 | `feature-requirements/feature-22-premium.md` | Premium / Paid Features | Backlog |

---

## How to use this document

Each feature has its own file in `feature-requirements/`. Add new features by:

1. Creating `feature-requirements/feature-NN-<slug>.md`
2. Adding a row to the index table above
3. Updating `CLAUDE.md` with a link to the new file

---

## Feature Briefs & Status

### Feature 02 — Moon Phase Data Service

**File:** `feature-requirements/feature-02-moon-phase.md`

Pure TypeScript calculation service providing moon phase data (phase name, illumination, moon age, fishing score contribution) for any date. No external dependencies or HTTP calls. Consumed by Feature 05 (Fishing Score Engine) and Feature 08 (Moon Details Screen). Includes optional dev-only display component.

### Feature 03 — Solunar Table Data Service

**File:** `feature-requirements/feature-03-solunar.md`

Pure TypeScript calculation service providing four daily solunar periods (major transits + minor rise/set windows) for any location and date based on moon position and John Alden Knight's theory. Returns period times, ratings, and fishing score contribution (0–100). Location-dependent; requires latitude/longitude. Handles polar edge cases gracefully. No external dependencies. Consumed by Feature 05 (Fishing Score Engine) and Feature 09 (Solunar Details Screen). Includes optional dev-only display component.

### Feature 04 — Weather Data Service

**File:** `feature-requirements/feature-04-weather.md`

Angular HTTP-based service that fetches current-day weather data from the free Open-Meteo API for any location. Returns structured weather data (temperature, wind, cloud cover, barometric pressure) with a calculated fishing score contribution (0–100) based on atmospheric conditions. Implements 5-minute cache with graceful error handling. Consumed by Feature 05 (Fishing Score Engine) for weather weighting and Feature 10 (Weather Details Screen) for rich weather breakdowns. Includes optional dev-only display component.
