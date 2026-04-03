# MoonBite Product Roadmap

## Overview

MoonBite gives anglers a single actionable daily "fishing score" based on solunar tables, moon phase, weather forecast, and barometric pressure. This roadmap prioritizes features by user value and MVP feasibility, with clear dependencies and complexity estimates.

## Strategic Goals

1. **MVP (Milestone 1):** Get anglers their daily fishing score in under 30 seconds — location → score
2. **Core Value (Milestone 2):** Show *why* the score is what it is through detailed breakdowns
3. **Engagement (Milestone 3):** Add persistence, location flexibility, and discovery
4. **Ecosystem (Milestone 4):** Location library, sharing, social proof, and premium features

---

## Milestone 1: MVP — Daily Fishing Score (Weeks 1-2)

**Goal:** A user opens the app, grants location permission, sees their daily fishing score, and understands it works.

### Feature 01 — Geolocation Permission & Display

**Description:** Users need to grant the app access to their device location (or manually enter it). Display the current location (city/state or coordinates) so they can verify the app is scoring the right place. This is the foundation for all scoring — without it, nothing works.

**Why it matters:** Every feature downstream depends on having a valid location. Users must trust they're seeing data for *their* area, not some default location.

**Data sources:**
- Browser Geolocation API (`navigator.geolocation`)
- Reverse geocoding: OpenStreetMap Nominatim (free tier, no key required) or Google Maps Geocoding API (requires key, $7 per 1000 requests but includes free tier)

**Component structure:**
- `LocationService` — wraps Geolocation API, handles errors, caches result
- `LocationPromptComponent` — friendly UX to request permission
- `LocationDisplayComponent` — shows current location with option to change

**Dependencies:** None

**Complexity:** M

**API Costs:** Free (Nominatim is open-source; Google Geocoding is ~$0.005/request at scale but includes free tier)

---

### Feature 02 — Moon Phase Data Service

**Description:** Query the current lunar phase (day in cycle, percentage illumination, next major event) for the user's location. Display as a simple icon + label (e.g., "Waxing Crescent, 30% illuminated").

**Why it matters:** Moon phase is one of the four core inputs to the fishing score. Peak feeding (full moon, new moon) translates to higher scores.

**Data sources:**
- Astronomy API: `ipgeolocation.io/api/astronomy` (free tier: 30k/month, ~$0.003/request over free tier)
- Alternative: `open-meteo.com` (free, no key required, includes moon phase)

**Component structure:**
- `MoonPhaseService` — fetches from API, transforms to readable format
- `MoonPhaseDisplayComponent` — icon + percentage + next event label

**Dependencies:** Feature 01 (needs location)

**Complexity:** S

**API Costs:** Free (Open-Meteo) or ~$0.003/request overages (ipgeolocation free tier covers MVP)

---

### Feature 03 — Solunar Table Data Service

**Description:** For the user's location and current date, fetch solunar peak times (major and minor periods). These are the times of day when fish are predicted to feed most actively. Display as a simple list (e.g., "Major: 7:30 AM–8:45 AM, Minor: 1:15 PM–2:00 PM").

**Why it matters:** Solunar timing is core to the score — peaks = higher fishing activity. Anglers check this every day.

**Data sources:**
- `solunar.org` API (no documented free API; may require scraping or partnership)
- `timeanddate.com/moon/solunar` (no public API; would require scraping with permission)
- `astronomy-api.com` (free tier: up to 50 requests/day; $0.01–0.05 per request beyond)
- Custom calculation using ephemeris library: `astronomy-engine` (npm package, JS implementation, free)

**Recommended approach:** Use astronomy-engine to calculate solunar tables locally. This avoids API calls and gives us full control.

**Component structure:**
- `SolunarService` — uses astronomy-engine to calculate peak times for a given location & date
- `SolunarDisplayComponent` — shows major/minor periods, with visual timeline

**Dependencies:** Feature 01 (needs location)

**Complexity:** M (moderate complexity in math; astronomy-engine abstracts most of it)

**API Costs:** Free (using open-source library)

---

### Feature 04 — Weather Data Service

**Description:** Fetch current and forecast weather for the user's location. Extract fishing-relevant factors: wind speed, precipitation chance, cloud cover, temperature, barometric pressure. Display as readable cards (e.g., "Wind: 12 mph NW, Chance of rain: 20%").

**Why it matters:** Weather heavily impacts fishing — calm conditions with high pressure = better fishing. Storms and falling pressure = worse conditions.

**Data sources:**
- OpenWeatherMap (free tier: 1000 calls/day, includes current + 5-day forecast)
- Open-Meteo (free, no key required, global coverage, excellent quality)
- National Weather Service (free, US only, highly reliable)

**Recommended:** Open-Meteo or OpenWeatherMap free tier. Open-Meteo preferred for simplicity (no key).

**Component structure:**
- `WeatherService` — fetches from API, transforms into angler-friendly format (wind direction, pressure trend)
- `WeatherDisplayComponent` — shows key metrics in cards or gauge displays

**Dependencies:** Feature 01 (needs location)

**Complexity:** M

**API Costs:** Free (Open-Meteo) or ~$0.0001 per call overages (OpenWeatherMap free tier covers MVP)

---

### Feature 05 — Fishing Score Calculation Engine

**Description:** Combine all four inputs (moon phase, solunar peaks, weather, pressure) into a single 0–100 daily fishing score. The score should:
- Peak near full/new moon (bonus ~+15 points)
- Boost during solunar peak hours (+20 points)
- Reward calm, high-pressure conditions (+25 points)
- Penalize storms and falling pressure (−30 points)

Display as a large, prominent number with a single-word summary ("Excellent", "Good", "Fair", "Poor").

**Why it matters:** This is the core value proposition. Anglers open the app and see one number — "Should I go fishing today?" The algorithm is the IP.

**Component structure:**
- `FishingScoreService` — algorithm that weights the four inputs and produces a 0–100 score + summary label
- `FishingScoreDisplayComponent` — large card with score, label, and simple explanation (e.g., "Moon phase is favorable, wind is calm")

**Dependencies:** Features 02, 03, 04

**Complexity:** M (straightforward weighting logic; the challenge is tuning the formula based on real-world angler feedback)

**Assumptions:** Initial weights are estimates; expect iteration based on user feedback and historical catch data.

---

### Feature 06 — App Shell & Home Screen

**Description:** Create a single-page layout with:
1. Location display at top (from Feature 01)
2. Large fishing score card in center (from Feature 05)
3. Quick summary of why (moon, solunar, weather, pressure — one-liners)
4. Simple nav to access details (refined in Milestone 2)

This is the "main screen" users see on app load.

**Why it matters:** Sets user expectations. MVP is simple and fast — one score, no overwhelming detail.

**Component structure:**
- `AppComponent` → root layout with header + main content area
- `DashboardComponent` → home screen orchestrating Features 01, 05, and summary views

**Dependencies:** Features 01–05

**Complexity:** S

---

### Feature 07 — Responsive Design & Mobile-First CSS

**Description:** Style the app for mobile (target: 360px–480px width), tablet (768px+), and desktop. Use SCSS for semantic naming, breakpoints, and a flexible grid.

**Why it matters:** Most anglers will check the app on their phone before heading to the water. Must be mobile-first.

**Component structure:**
- Root SCSS module with breakpoints and spacing variables
- Component-scoped SCSS with mobile-first media queries

**Dependencies:** Features 01–06 (style all of them)

**Complexity:** M

---

## Milestone 2: Core Value — Detailed Breakdowns (Weeks 3-4)

**Goal:** Users understand *why* the score is what it is. Show detailed views for each scoring factor, help them plan their fishing day.

### Feature 08 — Moon Phase Details Screen

**Description:** Detailed view showing:
- Current lunar phase name and percentage illuminated
- Lunar cycle timeline (current position in 29.5-day cycle)
- Next major events (next full moon date, new moon date, next best days)
- How moon phase affects the score (e.g., "Full moon in 3 days — conditions will improve")

**Why it matters:** Experienced anglers know the moon matters; show them the data. Builds trust and enables planning.

**Component structure:**
- `MoonPhaseDetailComponent` — layout for detailed view
- `LunarTimelineComponent` — visual representation of lunar cycle

**Dependencies:** Feature 02

**Complexity:** M

---

### Feature 09 — Solunar Peak Times Details Screen

**Description:** Detailed view showing:
- Today's major and minor peak times with visual timeline
- Upcoming peaks (next 3–7 days)
- Peak duration and strength (qualitative: "Strong major period", "Weak minor period")
- Recommended fishing window (e.g., "Best time: 7:30 AM–8:45 AM")

**Why it matters:** Anglers plan their day around solunar peaks. Show them the exact windows.

**Component structure:**
- `SolunarDetailComponent` — full timeline view
- `SolunarTimelineComponent` — visual representation of peaks throughout the day

**Dependencies:** Feature 03

**Complexity:** M

---

### Feature 10 — Weather Details Screen

**Description:** Detailed view showing:
- Current conditions (temp, feels-like, humidity, wind direction + speed)
- Hourly forecast (next 24–48 hours) with precipitation chance and wind
- Pressure trend (rising/stable/falling) + barometric value
- "Angler's perspective" (e.g., "Falling pressure — fish may be less active")

**Why it matters:** Weather is a major factor in daily fishing success. Show them the full picture.

**Component structure:**
- `WeatherDetailComponent` — full weather view
- `HourlyForecastComponent` — timeline of weather changes
- `PressureTrendComponent` — visual pressure trend chart

**Dependencies:** Feature 04

**Complexity:** M

---

### Feature 11 — Score Breakdown Explanation

**Description:** A simple infographic showing how the daily score was calculated:
- Moon phase: +X points (e.g., "+10 — waxing, favorable")
- Solunar: +X points (e.g., "+15 — two strong peaks today")
- Weather: +X points (e.g., "+8 — calm wind, high pressure")
- Pressure: +X or −X points (e.g., "+5 — rising pressure")
- **Total: 38/100 (Fair)**

**Why it matters:** Transparency builds trust. Users who understand the score trust it and come back.

**Component structure:**
- `ScoreBreakdownComponent` — bar chart or table showing contributions

**Dependencies:** Feature 05

**Complexity:** S

---

### Feature 12 — Bottom Navigation / Routing

**Description:** Add bottom nav or top menu with routes:
- Home / Dashboard (current features)
- Details (links to Features 08–11)
- Settings / Location (Feature 01 expanded)

Use Angular routing for SPA navigation.

**Why it matters:** Apps with only one screen feel incomplete. Users expect nav.

**Component structure:**
- Update `app.routes.ts` with dashboard, details, settings routes
- Add bottom navigation bar component
- Lazy-load details routes (optional, for performance)

**Dependencies:** Features 01–11

**Complexity:** S

---

## Milestone 3: Engagement & Persistence (Weeks 5-6)

**Goal:** Users return daily. They can track multiple locations, save preferences, see patterns.

### Feature 13 — Location Bookmarks / Saved Locations

**Description:** Users can save favorite fishing spots (home, favorite lake, cabin location). Quick-switch between them to see different scores.

Persistence: localStorage or IndexedDB.

**Why it matters:** Anglers fish multiple spots. Bookmark feature increases engagement and daily usage.

**Data structure:**
```typescript
interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  addedAt: Date;
  isDefault: boolean;
}
```

**Component structure:**
- `SavedLocationsService` — CRUD for bookmarks, localStorage persistence
- `LocationPickerComponent` — UI for viewing, adding, deleting, switching locations
- Update `LocationService` to read from bookmarks

**Dependencies:** Feature 01

**Complexity:** M

---

### Feature 14 — User Settings & Preferences

**Description:** Allow users to customize:
- Temperature unit (F vs. C)
- Wind speed unit (mph, knots, km/h)
- Time format (12h vs. 24h)
- Notification preferences (alert when score changes dramatically)
- Dark mode toggle

**Why it matters:** Settings increase perceived polish and allow personalization.

**Data structure:**
```typescript
interface UserPreferences {
  tempUnit: 'F' | 'C';
  windUnit: 'mph' | 'knots' | 'kmh';
  timeFormat: '12h' | '24h';
  darkMode: boolean;
  notificationsEnabled: boolean;
}
```

**Component structure:**
- `PreferencesService` — reads/writes to localStorage
- `SettingsComponent` — form for updating preferences
- Global effect to apply preferences (e.g., dark mode CSS class on root)

**Dependencies:** None (can be independent)

**Complexity:** S

---

### Feature 15 — Daily Score History & Trends

**Description:** Track daily scores over time (7–30 days). Show a simple chart:
- Line graph: score trend over time
- Bar chart: average score by day of week
- Stat cards: "Best day: 78 (full moon)", "Worst day: 22 (storm)"

**Why it matters:** Patterns emerge. Users see that full moons really do correlate with higher scores. Builds confidence in the system.

**Data structure:**
```typescript
interface DailyScoreRecord {
  date: Date;
  score: number;
  moonPhase: string;
  weatherCondition: string;
  location: string;
}
```

**Component structure:**
- `ScoreHistoryService` — stores daily records in IndexedDB (more efficient than localStorage)
- `HistoryComponent` — chart views and trend analysis
- `StatsComponent` — summary cards for patterns

**Dependencies:** Features 01, 05

**Complexity:** M

---

### Feature 16 — Splash Screen & App Branding

**Description:** Create a polished splash screen (loading state) with MoonBite logo and tagline. Use consistent branding (fonts, colors, icons) throughout the app.

**Why it matters:** First impressions. A branded, polished app is more trustworthy and shareable.

**Component structure:**
- `SplashScreenComponent` — shown while initial geolocation + data load
- Global SCSS variables for brand colors, fonts, spacing
- App icon and logo assets

**Dependencies:** None (cosmetic, can be added anytime)

**Complexity:** S

---

## Milestone 4: Ecosystem & Growth (Weeks 7–8+)

**Goal:** Scale the user base through sharing, social proof, and premium features.

### Feature 17 — Share Score / Daily Report

**Description:** Users can share their daily fishing score as a social media card or via text:
- Image: their score, location, moon phase, best peak time
- Caption: "🎣 MoonBite says today is a 73 — good fishing on the lake! Check it out."
- Link to app (deep link or app store)

**Why it matters:** Word-of-mouth is the cheapest acquisition channel. Viral coefficient increases with sharing.

**Component structure:**
- `ShareService` — generates share images (html2canvas or server-side)
- `ShareButtonComponent` — Twitter, Facebook, WhatsApp, SMS, copy link

**Dependencies:** Features 01, 05

**Complexity:** M

---

### Feature 18 — Location Search & Library

**Description:** Add a searchable library of popular fishing locations (lakes, rivers, coastal areas). Pre-populate with:
- Famous U.S. fishing spots (Amazon Lake, Largemouth Bass hotspots, etc.)
- User crowdsourced additions (later phase)

Users can search and bookmark spots without needing exact coordinates.

**Why it matters:** Users discover new fishing destinations and see if conditions are better elsewhere. Increases engagement.

**Data sources:**
- Static JSON seed data (100–500 popular spots)
- User-submitted locations (future phase)

**Component structure:**
- `LocationLibraryService` — search, filter, seed data
- `LocationSearchComponent` — autocomplete + map view
- Update `SavedLocationsService` to support library locations

**Dependencies:** Feature 13

**Complexity:** M

---

### Feature 19 — Smart Notifications & Alerts

**Description:** Users opt in to notifications:
- "Score jumped from 45 to 72 — great day ahead!"
- "Full moon in 3 days — expect better fishing"
- "Pressure is falling rapidly — fish may be sluggish"
- "Your favorite spot now has a score of 68"

**Why it matters:** Notifications drive daily engagement and reduce the need for users to manually check.

**Requires:**
- Web Push Notifications API (for PWA)
- Service Worker registration
- Backend for scheduling (future; for MVP, use client-side timers)

**Component structure:**
- `NotificationService` — wrapper around Notification API
- `NotificationSettingsComponent` — user preferences for which alerts
- Service Worker to handle background notifications (future)

**Dependencies:** Features 01, 05, 14

**Complexity:** M

---

### Feature 20 — Catch Logging & Fishing Journal

**Description:** Users log their fishing trips:
- Date, location, start/end time
- Weather conditions (auto-filled from API)
- Number of fish caught, species, weight/size
- Notes / photos
- Link to that day's MoonBite score

Over time, build a personal fishing journal and correlate catches with scores.

**Why it matters:** Personal data is powerful. Users see: "I caught the most fish on days when the score was 70+" → builds trust and loyalty.

**Data structure:**
```typescript
interface FishingTrip {
  id: string;
  date: Date;
  location: string;
  startTime: Date;
  endTime: Date;
  catchCount: number;
  species: string[];
  notes: string;
  photos: File[];
  moonBiteScore: number;
  weather: WeatherSnapshot;
}
```

**Component structure:**
- `FishingJournalService` — CRUD for trips, IndexedDB persistence
- `TripFormComponent` — add/edit trip with date/location picker, photo upload
- `JournalComponent` — list of past trips, analytics on catch success

**Dependencies:** Features 01, 04, 05

**Complexity:** L (involves file uploads, trip management, analytics)

---

### Feature 21 — Analytics Dashboard for Power Users

**Description:** Advanced users can view:
- "When do I catch the most fish?" (correlate catch logs with score, moon phase, season)
- "Best times to fish" (historical analysis of their catches)
- "Seasonal patterns" (e.g., "Spring peaks are 3x higher than summer")
- Export data as CSV

**Why it matters:** Power users love data. Provides retention and a moat (their personal fishing data is locked in).

**Component structure:**
- `AnalyticsService` — cross-correlate catch logs with historical scores
- `AnalyticsComponent` — charts, tables, export button

**Dependencies:** Feature 20

**Complexity:** L

---

### Feature 22 — Premium / Paid Features (Future)

**Description:** Introduce a freemium model:
- **Free tier:** Daily score, basic history (7 days), 1 saved location
- **Premium tier (~$2.99/month):**
  - Unlimited saved locations
  - 90-day history
  - Catch logging (Feature 20)
  - Advanced analytics (Feature 21)
  - Ad-free experience
  - Priority support

**Why it matters:** Monetization and sustainability. Not all users will pay, but 5–10% conversion rates are realistic for fishing apps.

**Implementation:**
- Paywall component (show on premium features if not subscribed)
- Feature flags per feature (gated behind `isPremium` signal)
- Backend API to validate subscription (future phase)

**Component structure:**
- `SubscriptionService` — tracks subscription status
- Feature guards using `canActivate` route guards or component-level signals

**Dependencies:** All

**Complexity:** M (straightforward gating; backend integration is future work)

---

## Feature Prioritization Summary

### MVP (Milestone 1) — Strict Scope
1. Feature 01 — Geolocation
2. Feature 02 — Moon Phase
3. Feature 03 — Solunar Tables
4. Feature 04 — Weather
5. Feature 05 — Scoring Algorithm
6. Feature 06 — Home Screen
7. Feature 07 — Responsive Design

**Target:** Week 2, all 7 features shipped. Users see their score in <30 seconds.

### Engagement (Milestone 2) — Detailed Value
8. Feature 08 — Moon Phase Details
9. Feature 09 — Solunar Details
10. Feature 10 — Weather Details
11. Feature 11 — Score Breakdown
12. Feature 12 — Navigation
13. Feature 13 — Saved Locations
14. Feature 14 — Preferences
15. Feature 15 — History
16. Feature 16 — Branding

**Target:** Week 4, all features shipped. Users understand the score and return daily.

### Growth (Milestone 3) — Sharing & Ecosystem
17. Feature 17 — Sharing
18. Feature 18 — Location Library
19. Feature 19 — Notifications
20. Feature 20 — Catch Logging
21. Feature 21 — Analytics
22. Feature 22 — Premium Monetization

**Target:** Week 8+, phased rollout. Acquisition through sharing, retention through personalization.

---

## Data Dependencies & External APIs

### Free APIs Required for MVP

| API | Purpose | Free Tier | Link |
|-----|---------|-----------|------|
| Geolocation API | User location | Browser native | N/A |
| Open-Meteo | Weather + moon phase | 10k req/day | https://open-meteo.com |
| Nominatim (OSM) | Reverse geocoding | Unlimited (fair use) | https://nominatim.openstreetmap.org |
| Astronomy-Engine | Solunar calculation | npm package (free) | https://github.com/cosinekitty/astronomy |

### Optional / Recommended for Scale

| API | Purpose | Cost | Notes |
|-----|---------|------|-------|
| OpenWeatherMap | Weather alternative | Free tier: 1k/day | More detailed; alternative to Open-Meteo |
| Google Maps | Geocoding alternative | $7 per 1k requests | More accurate; use only if Nominatim isn't sufficient |

### Local-Only (No API Cost)

- Astronomy-Engine (npm, local calculation) — preferred for solunar
- localStorage / IndexedDB — user preferences, saved locations, score history

---

## Technical Decisions & Assumptions

### 1. Solunar Calculation: Local vs. API

**Decision:** Use `astronomy-engine` npm package for local calculation.

**Rationale:**
- Free and open-source
- No API calls = no latency, no rate limits
- Deterministic and auditable
- Offline-capable (eventually)

**Alternative:** Use a solunar API (e.g., astronomy-api.com). Rejected due to cost and latency at scale.

### 2. Weather Provider: Open-Meteo vs. OpenWeatherMap

**Decision:** Start with Open-Meteo (free, no key).

**Rationale:**
- Free unlimited tier for MVP
- No API key management needed
- Global coverage
- Includes moon phase data (reducing API dependencies)

**Alternative:** OpenWeatherMap for greater feature depth. Can migrate later if needed.

### 3. Persistence: localStorage vs. IndexedDB

**Decision:** localStorage for MVP (preferences, bookmarks); IndexedDB for history (Feature 15).

**Rationale:**
- localStorage: simple, no async, good for small datasets (<5MB)
- IndexedDB: better for larger datasets (history, catch logs)

### 4. Scoring Algorithm: Weights & Transparency

**Decision:** Simple weighted average, not ML; show the breakdown.

**Rationale:**
- MVP: algorithm is transparent and explainable
- Users understand why they see a score
- Iterate based on feedback, not black-box ML
- *(Potential future: use catch log data to improve weights via user feedback)*

### 5. Geolocation Strategy: Browser API + Manual Entry

**Decision:** Request browser permission first; allow manual entry as fallback.

**Rationale:**
- Better UX: users don't have to type
- Fallback for privacy-conscious users or when permission denied
- Can support entering city name (reverse-geocode) or coordinates

---

## Success Metrics

### MVP (Week 2)

- [ ] App loads in <2 seconds
- [ ] Score displays within 5 seconds of location grant
- [ ] All four inputs present and calculating
- [ ] Mobile responsive (360px min)
- [ ] Unit test coverage ≥85%
- [ ] No console errors

### Engagement (Week 4)

- [ ] Users can view detailed breakdowns
- [ ] >70% of users interact with a details page
- [ ] DAU (daily active users) ≥50% of installs
- [ ] >80% user satisfaction survey

### Growth (Week 8)

- [ ] >20% of scores shared per day
- [ ] >10 saved locations per power user
- [ ] >30% of users log at least one catch
- [ ] 5-10% premium conversion rate (if paywalled)

---

## Risk Mitigation

### Risk 1: Solunar Calculation Accuracy
**Mitigation:** Validate astronomy-engine output against known solunar tables (e.g., solunar.org). Test with historical dates.

### Risk 2: Weather API Downtime
**Mitigation:** Cache last known weather for 2 hours. Show cached data with "last updated" timestamp if API fails.

### Risk 3: Geolocation Permission Denial
**Mitigation:** Provide a fallback manual location entry (city name or lat/lon). Allow app to work with any location.

### Risk 4: Algorithm Doesn't Match Real Fishing
**Mitigation:** Collect catch logs (Feature 20) early. Iterate weights based on user data. Start with conservative estimates.

### Risk 5: Difficulty Calculating Solunar
**Mitigation:** astronomy-engine is battle-tested. If calculation is wrong, it's a library bug (unlikely). Have a fallback: disable solunar contribution if library throws error.

---

## Dependencies Between Features

```
Feature 01 (Geolocation)
├── Feature 02 (Moon Phase)
│   └── Feature 08 (Moon Details)
│       └── Feature 11 (Score Breakdown)
├── Feature 03 (Solunar)
│   └── Feature 09 (Solunar Details)
│       └── Feature 11 (Score Breakdown)
├── Feature 04 (Weather)
│   └── Feature 10 (Weather Details)
│       └── Feature 11 (Score Breakdown)
└── Feature 13 (Saved Locations)
    └── Feature 18 (Location Library)

Feature 05 (Scoring)
├── Feature 11 (Score Breakdown)
├── Feature 17 (Share Score)
└── Feature 15 (History)

Feature 06 (Home Screen)
└── Feature 12 (Navigation)

Feature 14 (Preferences)
└── Feature 19 (Notifications)

Feature 15 (History)
└── Feature 21 (Analytics)

Feature 20 (Catch Logging)
└── Feature 21 (Analytics)

Feature 22 (Premium)
└── Wraps Features 13, 15, 20, 21
```

---

## Next Steps

1. **Approve Roadmap:** Product team validates features and milestone scope
2. **Create Feature Docs:** For each feature (01–22), create `docs/feature-requirements/feature-NN-<slug>.md` with acceptance criteria
3. **Start Milestone 1:** Assign Feature 01 to a developer; use TDD workflow (write tests first)
4. **Iterate:** Every 2 weeks, review completion, gather user feedback, adjust roadmap

---

## Appendix: External API Research

### Recommended Free APIs for MVP

#### 1. Open-Meteo (Weather + Moon Phase)
- **Cost:** Free, unlimited (fair use)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current=temperature_2m,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,moon_phase,pressure_msl_max`
- **Response time:** <200ms
- **Coverage:** Global
- **Auth:** None (no key required)

#### 2. Nominatim / OpenStreetMap (Reverse Geocoding)
- **Cost:** Free, but with fair-use limits (~1 req/sec)
- **Endpoint:** `https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json`
- **Response time:** <500ms
- **Coverage:** Global
- **Auth:** None; requires user-agent header

#### 3. Astronomy-Engine (npm package)
- **Cost:** Free (MIT license)
- **Install:** `npm install astronomy-engine`
- **Usage:** Calculate lunar phase, solunar tables locally
- **Documentation:** https://github.com/cosinekitty/astronomy
- **No network calls:** All calculations are local (ideal for MVP)

### Alternative APIs (If Scaling)

#### Weather Alternatives
- **OpenWeatherMap:** Free tier 1k/day; $0.0001/call after. Good detail.
- **WeatherAPI:** Free tier 1M/month; $0.005/call after. Includes fishing forecasts.
- **Weatherbit:** Free tier 500/day; $0.008/call after.

#### Solunar Alternatives
- **astronomy-api.com:** Free tier 50/day; $0.01–0.05 per request after.
- **Timeanddate:** No public API; would require scraping (not recommended).

---

## Questions for Product Team

1. **Monetization:** Should we start with ads, freemium, or completely free (MVP)?
2. **Platform:** Web-only (PWA), native iOS/Android apps, or both eventually?
3. **Scope:** Does the 22-feature roadmap feel right, or should we cut non-essential features earlier?
4. **User Base:** Target anglers in a specific region (e.g., US only), or global from day one?
5. **Data:** Do we want to collect anonymized catch data to improve the algorithm, or respect privacy first?

---

**Document created:** April 1, 2026  
**Version:** 1.0  
**Status:** Ready for approval
