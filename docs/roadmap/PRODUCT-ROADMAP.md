# MoonBite — Product Development Roadmap

**Document Version:** 1.0  
**Date:** April 1, 2026  
**Status:** Ready for Development  
**Audience:** Product, Engineering, Design

---

## Executive Summary

MoonBite is a mobile-first web app that delivers a single, actionable daily "fishing score" (0–100) synthesizing solunar tables, moon phase, weather, and barometric pressure. The roadmap is organized into four 2-week milestones, starting with a lean MVP (Week 1–2) and expanding into engagement and monetization features.

**MVP Goal:** Users open the app, grant location permission, and see their daily fishing score within 30 seconds.

**Success Metric:** >90% geolocation permission grant rate; >80% of users see the score on first load; <2s app load time.

---

## Strategic Goals

| Milestone | Focus | Duration | Key Outcome |
|-----------|-------|----------|------------|
| **M1: MVP** | Daily fishing score | Weeks 1–2 | Single score + location → quick decision making |
| **M2: Core Value** | Score transparency | Weeks 3–4 | Users understand *why* and plan better |
| **M3: Engagement** | Location flexibility + history | Weeks 5–6 | Multi-location support + daily return patterns |
| **M4: Ecosystem** | Sharing + monetization | Weeks 7–8+ | Viral growth + premium conversion |

---

## Milestone 1: MVP — Daily Fishing Score (Weeks 1–2)

**Goal:** A user opens the app, grants location permission, and sees their daily fishing score. The score combines four inputs (moon phase, solunar peaks, weather, pressure) into a single 0–100 decision tool.

### Feature 01 — Geolocation Permission & Display

**Description:**  
Request the user's device location using the browser Geolocation API. Display the current location (city/state or coordinates) so users can verify they're seeing data for the right area. Provide a fallback for users who deny permission or prefer to enter location manually.

**Why it matters:**  
Every downstream feature depends on a valid location. Users must trust they're seeing data for their area, not a default location. MVP success requires >90% permission grant.

**Data sources / APIs:**
- Browser Geolocation API (`navigator.geolocation`) — free, native
- OpenStreetMap Nominatim (reverse geocoding) — free, no key required
- Alternative: Google Maps Geocoding API (~$0.005 per request, but includes free tier)

**Component structure:**
- `LocationService` — wraps Geolocation API, handles permission states, caches result in localStorage
- `LocationPermissionComponent` — friendly UX to request permission with clear CTA
- `LocationDisplayComponent` — shows current location (city/state) with option to change manually
- Support manual entry: allow city name or lat/lon coordinates as fallback

**Dependencies:** None

**Acceptance Criteria:**
- [ ] Geolocation permission requested on app load
- [ ] Display user's city/state or coordinates within 5 seconds
- [ ] Manual location entry fallback works (city name or coordinates)
- [ ] Reverse geocoding (lat/lon → city name) functional and tested
- [ ] Location cached in localStorage; persists across sessions
- [ ] Error handling for permission denied / timeout
- [ ] Unit test coverage ≥85%
- [ ] Mobile responsive (360px+ width)

**Complexity:** M

**Effort Estimate:** 3–4 days (including testing, error handling, fallback UX)

---

### Feature 02 — Moon Phase Data Service

**Description:**  
Fetch the current lunar phase for the user's location. Display:
- Current phase name (e.g., "Waxing Crescent", "Full Moon")
- Percentage illumination (0–100%)
- Days until next major event (full moon, new moon)
- Phase icon (visual representation)

**Why it matters:**  
Moon phase is one of four core inputs to the fishing score. Full and new moons correlate with higher fishing activity. Transparent display builds user trust.

**Data sources / APIs:**
- Open-Meteo (free, no key, includes moon phase in daily forecast) — **recommended**
- Alternative: ipgeolocation.io astronomy endpoint (~$0.003/request over free tier)

**Component structure:**
- `MoonPhaseService` — fetches from Open-Meteo, transforms to readable format
- `MoonPhaseDisplayComponent` — icon + percentage + next event label
- Caching: store moon phase for 24 hours in localStorage to reduce API calls

**Dependencies:** Feature 01 (needs location)

**Acceptance Criteria:**
- [ ] Moon phase data fetched from Open-Meteo API
- [ ] Display phase name, percentage, and next major event
- [ ] Visual phase icon rendered correctly
- [ ] API response cached for 24 hours (reduce redundant calls)
- [ ] Fallback if API fails (show "data unavailable")
- [ ] Unit tests for API integration and caching logic
- [ ] Coverage ≥85%

**Complexity:** S

**Effort Estimate:** 2–3 days

---

### Feature 03 — Solunar Table Data Service

**Description:**  
For the user's location and current date, calculate solunar peak times (major and minor periods). Display as:
- Major period: time window (e.g., "7:30 AM–8:45 AM")
- Minor period: time window (e.g., "1:15 PM–2:00 PM")
- Simple label for strength (e.g., "Strong major period")

Solunar peaks are the times when fish are predicted to feed most actively.

**Why it matters:**  
Solunar timing is core to the score and to daily fishing decisions. Anglers plan their trip around these windows.

**Data sources / APIs:**
- **Recommended:** `astronomy-engine` (npm package) — free, open-source, local calculation
- Alternatives: astronomy-api.com (free tier: 50/day; $0.01–0.05/request after)

**Component structure:**
- `SolunarService` — uses astronomy-engine to calculate peak times for location + date
- `SolunarDisplayComponent` — visual timeline of peaks throughout the day
- Calculation should be local (no API calls) to avoid rate limits

**Dependencies:** Feature 01 (needs location)

**Acceptance Criteria:**
- [ ] Solunar peaks calculated locally using astronomy-engine
- [ ] Major and minor periods displayed with time windows
- [ ] Calculation works for any location and date (validate against solunar.org)
- [ ] Fallback if calculation fails gracefully
- [ ] Unit tests for calculation logic; validate against known tables
- [ ] Coverage ≥85%
- [ ] Performance: calculation completes in <500ms

**Complexity:** M

**Effort Estimate:** 3–5 days (math validation is time-consuming; use TDD)

---

### Feature 04 — Weather Data Service

**Description:**  
Fetch current and forecast weather for the user's location. Extract angler-relevant metrics:
- Wind speed + direction
- Precipitation chance
- Cloud cover
- Temperature
- Barometric pressure
- Pressure trend (rising / stable / falling)

Display in readable card format with brief explanation (e.g., "Wind: 12 mph NW", "Pressure: Rising").

**Why it matters:**  
Weather heavily impacts fishing conditions. Calm, high-pressure conditions = better fishing. Storms and falling pressure = worse. Weather data feeds directly into the score calculation.

**Data sources / APIs:**
- **Recommended:** Open-Meteo (free, no key, global coverage, excellent quality) — `https://api.open-meteo.com/v1/forecast`
- Alternative: OpenWeatherMap free tier (1000 calls/day; $0.0001/call after)

**Endpoints needed:**
- Current weather (temperature, wind, pressure)
- Hourly forecast (next 24–48 hours for hourly breakdown)
- Daily forecast (7–14 days for trends)

**Component structure:**
- `WeatherService` — fetches from Open-Meteo, transforms into angler-friendly format
- `WeatherDisplayComponent` — shows current conditions in cards
- `PressureTrendComponent` — visual indicator of pressure direction
- Caching: store weather for 1 hour (API data is fresh, but don't hammer it)

**Dependencies:** Feature 01 (needs location)

**Acceptance Criteria:**
- [ ] Weather data fetched from Open-Meteo API
- [ ] Display current: wind, precipitation, pressure, temperature
- [ ] Show pressure trend (rising / stable / falling)
- [ ] Cache weather for 1 hour
- [ ] Fallback if API fails (show "data unavailable")
- [ ] Unit tests for API integration and data transformation
- [ ] Coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 05 — Fishing Score Calculation Engine

**Description:**  
Synthesize all four inputs (moon phase, solunar peaks, weather, pressure) into a single 0–100 daily fishing score. Apply weighted algorithm:

| Factor | Points | Notes |
|--------|--------|-------|
| Moon phase | 0–20 | Full/new moon = +15–20; waning = lower |
| Solunar peaks | 0–25 | Major peak today = +20; minor = +10; none = 0 |
| Weather | 0–25 | Calm + high pressure = +20–25; wind/rain = lower |
| Pressure trend | −30 to +30 | Rising = +20–30; stable = 0; falling = −20 to −30 |
| **Total** | **0–100** | |

Display the score prominently with a label: "Excellent" (75–100), "Good" (50–74), "Fair" (25–49), "Poor" (0–24).

**Why it matters:**  
This is the core value proposition. One number answers "Should I go fishing today?" The algorithm is the IP; transparency builds trust.

**Component structure:**
- `FishingScoreService` — orchestrates the four inputs and applies weighting formula
- `ScoreCalculationService` — pure function for weight calculation (easier to test)
- `FishingScoreDisplayComponent` — large, prominent card with score, label, and brief explanation

**Logic:**
```
score = moon_phase_points + solunar_points + weather_points + pressure_points
label = "Excellent" if score >= 75
        "Good" if score >= 50
        "Fair" if score >= 25
        "Poor" if score < 25
```

**Dependencies:** Features 02, 03, 04 (needs all four inputs)

**Acceptance Criteria:**
- [ ] Algorithm combines all four inputs correctly
- [ ] Score range: 0–100
- [ ] Labels ("Excellent", "Good", "Fair", "Poor") map to score ranges
- [ ] Example calculations validated by hand (e.g., full moon + calm weather = high score)
- [ ] Weights are tunable (easy to adjust based on feedback)
- [ ] Unit tests for calculation logic; coverage ≥85%
- [ ] Score updates when any input changes (reactive)

**Complexity:** M

**Effort Estimate:** 2–3 days

**Assumptions:**
- Initial weights are estimates; expect iteration based on user feedback and catch logs (Feature 20)
- Algorithm is deterministic (not ML); transparency is a feature

---

### Feature 06 — App Shell & Home Screen

**Description:**  
Create the main screen users see on app load. Layout:
1. **Header:** Location display (Feature 01)
2. **Score Card:** Large, prominent fishing score (Feature 05)
3. **Summary:** Quick one-liners explaining the score (moon, solunar, weather, pressure)
4. **Footer:** Simple nav to details (refined in Milestone 2)

The MVP home screen is intentionally simple — one score, no overwhelming detail. Speed is critical.

**Why it matters:**  
Sets user expectations. MVP is fast and actionable. Anything slower than 30 seconds from app open to score display = feature failure.

**Component structure:**
- `AppComponent` (root) — layout with header + main content area + footer
- `DashboardComponent` (home screen) — orchestrates Features 01–05, displays summary
- Responsive grid for mobile-first design (detailed in Feature 07)

**Acceptance Criteria:**
- [ ] Home screen layout: location > score > summary
- [ ] Score loads within 5 seconds of location grant
- [ ] All four input sources displayed (moon, solunar, weather, pressure)
- [ ] Click on any summary item shows more detail (nav prepared for M2)
- [ ] Mobile responsive (360px+ width)
- [ ] No console errors
- [ ] Unit test coverage ≥85%

**Complexity:** S

**Effort Estimate:** 2–3 days (depends on Feature 01–05 completion)

---

### Feature 07 — Responsive Design & Mobile-First CSS

**Description:**  
Style the app for mobile (360px–480px), tablet (768px+), and desktop (1200px+). Use SCSS with:
- Mobile-first breakpoints
- Semantic variable naming (colors, spacing, typography)
- Component-scoped styles
- Accessible contrast ratios (WCAG AA min)

**Why it matters:**  
Most users check the app on their phone before heading out. Mobile-first is non-negotiable.

**Component structure:**
- Global SCSS module: `src/app/styles/` with breakpoints, variables, utilities
- Component-scoped SCSS using BEM naming (`block__element--modifier`)
- CSS Grid / Flexbox for layouts

**Breakpoints:**
```scss
$breakpoint-small: 360px;   // Mobile
$breakpoint-medium: 768px;  // Tablet
$breakpoint-large: 1200px;  // Desktop
```

**Typography & Spacing:**
- Base font size: 16px
- Line height: 1.5
- Spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px

**Dependencies:** Features 01–06 (style all of them)

**Acceptance Criteria:**
- [ ] App renders correctly on mobile (360px), tablet (768px), desktop (1200px)
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Text readable without zoom (16px min)
- [ ] Color contrast ≥4.5:1 for body text (WCAG AA)
- [ ] No horizontal scrolling on mobile
- [ ] Performance: CSS load + paint <1s
- [ ] CSS validated; no linter warnings

**Complexity:** M

**Effort Estimate:** 2–3 days

---

## Milestone 2: Core Value — Score Transparency (Weeks 3–4)

**Goal:** Users understand *why* the score is what it is. Detailed views for each scoring factor, trend visibility, and preference customization.

### Feature 08 — Moon Phase Details Screen

**Description:**  
Dedicated screen showing comprehensive moon data:
- Current phase name, percentage illuminated
- Visual lunar cycle timeline (29.5-day cycle)
- Next major events (full moon, new moon, specific dates)
- How moon phase contributes to today's score (e.g., "+12 points — approaching full moon")
- Next 30 days forecast (moon phase calendar)

**Why it matters:**  
Experienced anglers know the moon matters. Show them the data. Builds trust and enables planning beyond today.

**Component structure:**
- `MoonPhaseDetailComponent` — layout for detailed view
- `LunarTimelineComponent` — 29.5-day cycle visualization
- `MoonPhaseCalendarComponent` — next 30 days of moon phases

**Dependencies:** Feature 02, 05 (needs moon data and score service)

**Acceptance Criteria:**
- [ ] Display current phase, illumination, and next events
- [ ] Show lunar cycle timeline with current position
- [ ] List next full/new moon dates
- [ ] Show contribution to today's score (from Feature 05)
- [ ] 30-day moon phase calendar
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 09 — Solunar Peak Times Details Screen

**Description:**  
Dedicated screen showing solunar data:
- Today's major and minor peak times with duration
- Visual timeline of peaks throughout the day
- Upcoming peaks (next 7 days)
- Peak strength (qualitative: "Strong", "Moderate", "Weak")
- Recommended fishing windows
- Contribution to today's score

**Why it matters:**  
Anglers plan their day around solunar peaks. Show them the exact windows and upcoming patterns.

**Component structure:**
- `SolunarDetailComponent` — layout for detailed view
- `SolunarTimelineComponent` — visual timeline of peaks
- `SolunarForecastComponent` — next 7 days of peak times

**Dependencies:** Feature 03, 05

**Acceptance Criteria:**
- [ ] Display today's major and minor peaks with times and duration
- [ ] Visual timeline of peaks throughout the day
- [ ] Show next 7 days of peaks in calendar format
- [ ] Qualitative strength indicator (Strong/Moderate/Weak)
- [ ] Show contribution to today's score
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 10 — Weather Details Screen

**Description:**  
Dedicated screen showing detailed weather:
- Current conditions (temperature, feels-like, humidity, wind speed + direction)
- Hourly forecast (next 24 hours) with precipitation chance, wind, temperature
- Barometric pressure: current value + trend (rising / stable / falling)
- Angler's perspective: brief explanation of how weather affects fishing
- Contribution to today's score

**Why it matters:**  
Weather is a major scoring factor. Show anglers the full picture and explain what it means.

**Component structure:**
- `WeatherDetailComponent` — main layout
- `HourlyForecastComponent` — timeline of weather changes
- `PressureTrendComponent` — visual pressure chart (24–48 hours)

**Dependencies:** Feature 04, 05

**Acceptance Criteria:**
- [ ] Display current weather: temperature, wind (speed + direction), humidity, pressure
- [ ] Hourly forecast: temperature, wind, precipitation chance
- [ ] Barometric pressure: current value + 24-hour trend
- [ ] Angler perspective: brief explanation of fishing implications
- [ ] Show contribution to today's score
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 11 — Score Breakdown Explanation

**Description:**  
Simple, transparent infographic showing how the daily score was calculated:

```
Moon Phase:     +12 points (waxing, approaching full moon)
Solunar Peaks:  +18 points (strong major period at 7:30 AM)
Weather:        +15 points (calm winds, high pressure)
Pressure Trend: +8 points (pressure rising)
─────────────────────────────────
Total Score:    53 / 100 (Good)
```

Each contribution is clickable/tappable to jump to the detailed view for that factor.

**Why it matters:**  
Transparency builds trust. Users who understand the score trust it and come back.

**Component structure:**
- `ScoreBreakdownComponent` — bar chart or table visualization
- Interactive links to detail screens for each factor

**Dependencies:** Feature 05 (needs score service and breakdown data)

**Acceptance Criteria:**
- [ ] Display all four factors with point contributions
- [ ] Show total score and label
- [ ] Each factor clickable → detail screen
- [ ] Contributions add up to total score
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** S

**Effort Estimate:** 2–3 days

---

### Feature 12 — Bottom Navigation / Routing

**Description:**  
Add navigation to switch between screens. Implement:
- **Home:** Dashboard with score and summary
- **Details:** Links to moon, solunar, weather detail screens
- **Settings:** Location and preferences (Feature 14)

Use Angular routing (SPA navigation). Bottom nav bar for mobile, top nav for desktop.

**Why it matters:**  
Apps with one screen feel incomplete. Users expect to navigate and explore.

**Component structure:**
- Update `app.routes.ts` with routes for dashboard, details, settings
- `BottomNavBarComponent` — mobile nav
- `HeaderNavComponent` — desktop nav (optional for M2)
- Route guards (optional, for future auth)

**Routes:**
```
/                → dashboard (home screen)
/details/moon    → moon phase details
/details/solunar → solunar details
/details/weather → weather details
/details/breakdown → score breakdown
/settings        → preferences
```

**Dependencies:** Features 01–11

**Acceptance Criteria:**
- [ ] All routes working and navigation functional
- [ ] Bottom nav visible and responsive on mobile
- [ ] Active route highlighted in nav
- [ ] Browser back button works
- [ ] Deep links work (e.g., `/details/moon` is bookmarkable)
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** S

**Effort Estimate:** 2–3 days

---

### Feature 13 — Saved Locations / Bookmarks

**Description:**  
Allow users to save favorite fishing spots and quick-switch between them:
- Save current location with custom name (e.g., "Smith Lake", "Home")
- Quick-switch button to view score for different saved locations
- Edit / delete saved locations
- Set a default location for app load
- Persist in localStorage

**Why it matters:**  
Anglers fish multiple spots. Bookmark feature increases daily engagement (users check multiple locations).

**Data structure:**
```typescript
interface SavedLocation {
  id: string;           // UUID
  name: string;         // "Smith Lake", "Home", etc.
  latitude: number;
  longitude: number;
  createdAt: Date;
  isDefault: boolean;
}
```

**Component structure:**
- `SavedLocationsService` — CRUD for bookmarks, localStorage persistence
- `LocationPickerComponent` — UI for viewing, adding, deleting, switching
- Update `LocationService` to support switching between saved locations

**Storage:**
```typescript
// In localStorage: "moonbite_saved_locations"
[
  { id: "loc-1", name: "Smith Lake", latitude: 42.3601, longitude: -71.0589, isDefault: true },
  { id: "loc-2", name: "Home", latitude: 42.3200, longitude: -71.0800, isDefault: false }
]
```

**Dependencies:** Feature 01 (builds on location service)

**Acceptance Criteria:**
- [ ] Users can save current location with custom name
- [ ] List of saved locations accessible from settings
- [ ] Quick-switch to saved location updates score
- [ ] Edit location name
- [ ] Delete location with confirmation
- [ ] Set default location
- [ ] Persist to localStorage
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 14 — User Settings & Preferences

**Description:**  
Settings screen allowing customization:
- **Temperature unit:** Fahrenheit (°F) or Celsius (°C)
- **Wind speed:** mph, knots, or km/h
- **Time format:** 12-hour or 24-hour
- **Dark mode:** Toggle light / dark theme
- **Notifications (future):** Opt-in to alerts

Persist to localStorage; apply preferences app-wide in real-time.

**Why it matters:**  
Preferences increase perceived polish and user personalization. Dark mode is essential for evening use.

**Data structure:**
```typescript
interface UserPreferences {
  tempUnit: 'F' | 'C';
  windUnit: 'mph' | 'knots' | 'kmh';
  timeFormat: '12h' | '24h';
  darkMode: boolean;
  notificationsEnabled: boolean; // M3
}
```

**Component structure:**
- `PreferencesService` — reads/writes to localStorage as a signal
- `SettingsComponent` — form for updating preferences (toggles, select dropdowns)
- Global effect to apply preferences (e.g., dark mode CSS class on root element)

**Storage:**
```typescript
// In localStorage: "moonbite_preferences"
{
  tempUnit: "F",
  windUnit: "mph",
  timeFormat: "12h",
  darkMode: false,
  notificationsEnabled: true
}
```

**Dependencies:** None (independent feature)

**Acceptance Criteria:**
- [ ] Settings screen with preference toggles and dropdowns
- [ ] Dark mode applied to entire app (CSS class on root)
- [ ] Temperature and wind units converted app-wide
- [ ] Time format (12h/24h) applied to time displays
- [ ] Preferences persist in localStorage
- [ ] Preferences apply on app reload
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** S

**Effort Estimate:** 2–3 days

---

### Feature 15 — Daily Score History & Trends

**Description:**  
Track and display daily fishing scores over time:
- **Line chart:** Score trend over 7–30 days
- **Bar chart:** Average score by day of week (e.g., Mondays are better)
- **Stat cards:** "Best day: 78 (full moon)", "Worst day: 22 (storm)"
- **Data table:** List of past scores with date, score, weather summary

Store scores in IndexedDB (more efficient than localStorage for larger datasets).

**Why it matters:**  
Patterns emerge. Users see that full moons correlate with higher scores. Builds confidence and encourages daily returns.

**Data structure:**
```typescript
interface DailyScoreRecord {
  id: string;           // UUID
  date: Date;
  score: number;        // 0–100
  moonPhase: string;    // e.g., "Waxing Crescent"
  weatherSummary: string; // e.g., "Calm, high pressure"
  location: string;     // e.g., "Smith Lake"
}
```

**Component structure:**
- `ScoreHistoryService` — IndexedDB CRUD, queries for trends
- `HistoryComponent` — main layout for history view
- `ScoreTrendChartComponent` — line chart using a charting library (e.g., Chart.js, ngx-charts)
- `StatCardsComponent` — "best day", "worst day", averages

**Storage:**
- IndexedDB database: "moonbite_db"
- Object store: "daily_scores"
- Index: "date" (for fast querying)

**Dependencies:** Features 01, 05 (needs location and score service)

**Acceptance Criteria:**
- [ ] Daily scores stored in IndexedDB
- [ ] Line chart: score trend over time (7–30 days)
- [ ] Bar chart: average score by day of week
- [ ] Stat cards: best day, worst day, median
- [ ] Data table: sortable list of past scores
- [ ] Time range selector (last 7 days, 30 days, all time)
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 4–5 days (charting library integration takes time)

---

### Feature 16 — Splash Screen & App Branding

**Description:**  
Create a polished loading/splash screen and establish consistent visual branding:
- **Splash screen:** MoonBite logo + tagline, shown while loading geolocation + initial data
- **Brand colors:** Define primary, secondary, accent colors in SCSS
- **Typography:** Consistent fonts (e.g., Inter or Open Sans for body, Poppins for headers)
- **Icons:** Use a consistent icon library (e.g., Material Icons or custom SVGs)
- **App icon:** 192x192 and 512x512 PNG for web app manifest

**Why it matters:**  
First impressions matter. A polished, branded app is more trustworthy and shareable.

**Component structure:**
- `SplashScreenComponent` — shown on app init, hidden after data loads
- Global SCSS variables: `src/app/styles/variables.scss`
- App manifest: `src/manifest.json` (for PWA)

**Branding:**
```scss
// Primary: Moon blue
$color-primary: #2c3e50;
$color-primary-light: #34495e;

// Accent: Fishing orange
$color-accent: #e67e22;

// Functional: Success green, warning red
$color-success: #27ae60;
$color-warning: #e74c3c;

// Backgrounds
$color-bg-light: #ecf0f1;
$color-bg-dark: #1a1a1a;

// Typography
$font-body: 'Inter', sans-serif;
$font-header: 'Poppins', sans-serif;
```

**Dependencies:** None (cosmetic, can be added anytime)

**Acceptance Criteria:**
- [ ] Splash screen shown during app load
- [ ] Logo and tagline visible on splash screen
- [ ] Splash screen hides after location + initial data loads
- [ ] Brand colors applied throughout app
- [ ] Typography consistent (headers, body, labels)
- [ ] Icons render correctly (test on mobile)
- [ ] App icon renders in manifest/web app shortcut
- [ ] No visual inconsistencies between screens
- [ ] Dark mode supports alternative branding

**Complexity:** S

**Effort Estimate:** 2–3 days

---

## Milestone 3: Engagement & Monetization (Weeks 5–8+)

**Goal:** Drive daily engagement through sharing, location flexibility, and catch logging. Introduce premium features.

### Feature 17 — Share Score / Daily Report

**Description:**  
Users can share their daily fishing score as a social card or via messaging:
- Generate an image: score, location, moon phase, best solunar peak time
- Social captions: Twitter, Facebook, WhatsApp, SMS, copy-to-clipboard
- Deep link to app (or app store if not installed)
- Pre-filled text (e.g., "🎣 MoonBite says today is a 73 — good fishing! Check it out.")

**Why it matters:**  
Word-of-mouth is the cheapest acquisition channel. Users share with friends → viral growth.

**Component structure:**
- `ShareService` — generates share images (using html2canvas or server-side image gen)
- `ShareModalComponent` — social platform buttons (Twitter, Facebook, WhatsApp, SMS, copy)
- Share button on home screen and score detail

**Share data:**
```typescript
interface ShareData {
  score: number;
  location: string;
  moonPhase: string;
  solunarPeak: string;
  imageUrl: string; // Generated
  text: string;     // Pre-filled
  deepLink: string; // App deep link
}
```

**Dependencies:** Features 01, 05

**Acceptance Criteria:**
- [ ] Share button on home screen
- [ ] Generate share image with score, location, moon phase, peak time
- [ ] Share via Twitter (opens Twitter with pre-filled text)
- [ ] Share via Facebook (opens Facebook share dialog)
- [ ] Share via WhatsApp (SMS-like share)
- [ ] Copy link to clipboard
- [ ] Deep link works (navigates to same location/date when reopened)
- [ ] Image generation <2s
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 4–5 days (image generation is tricky)

---

### Feature 18 — Location Search & Library

**Description:**  
Provide a searchable library of famous fishing locations. Users can:
- Search by name or region (e.g., "largemouth bass lakes", "coastal spots")
- View location details (name, GPS, region, species)
- Bookmark locations to saved locations
- See score for that location (without needing exact GPS)

Pre-populate with 100–500 famous U.S. fishing spots; support user submissions (future).

**Why it matters:**  
Users discover new fishing destinations. Drives engagement and cross-location comparisons.

**Data sources / APIs:**
- Static JSON seed data (embedded in app or served from CDN)
- User submissions (future, requires backend)

**Seed data structure:**
```typescript
interface FishingLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;       // e.g., "Massachusetts", "Florida Keys"
  species: string[];    // e.g., ["Largemouth Bass", "Catfish"]
  description: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}
```

**Component structure:**
- `LocationLibraryService` — search, filter seed data
- `LocationSearchComponent` — autocomplete input + search results
- `LocationDetailComponent` — view location, see score, add to bookmarks

**Dependencies:** Feature 13 (integrate with saved locations)

**Acceptance Criteria:**
- [ ] Search locations by name
- [ ] Filter by region or species
- [ ] Display location details (name, GPS, region, species)
- [ ] Show fishing score for that location
- [ ] Add location to bookmarks (saved locations)
- [ ] Autocomplete search suggestions
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 19 — Smart Notifications & Alerts

**Description:**  
Users opt-in to notifications for important fishing events:
- "Score jumped from 45 to 72 — great day ahead!"
- "Full moon in 3 days — expect better fishing"
- "Pressure is falling rapidly — fish may be sluggish"
- "Your favorite spot now has a score of 68"

Use Web Push Notifications API (for PWA). Client-side timers for MVP; backend scheduling (future).

**Why it matters:**  
Notifications drive daily engagement. Users don't have to remember to check; the app reminds them.

**Component structure:**
- `NotificationService` — wrapper around Notification API, request permission
- `NotificationSettingsComponent` — user preference toggles
- Background timers: check score changes, upcoming moon events, pressure trends
- Service Worker (future, for background notifications)

**Notification types:**
```typescript
interface Notification {
  type: 'score_jump' | 'moon_event' | 'pressure_change' | 'saved_location';
  title: string;
  body: string;
  actionUrl?: string;
}
```

**Dependencies:** Features 01, 05, 14 (needs location, score, and preference service)

**Acceptance Criteria:**
- [ ] Request notification permission on first load
- [ ] Score change detection (e.g., 45 → 72) triggers notification
- [ ] Moon event notifications (e.g., "full moon in 3 days")
- [ ] Pressure trend notifications
- [ ] User can enable/disable each notification type
- [ ] Notification click navigates to relevant screen
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days

---

### Feature 20 — Catch Logging & Fishing Journal

**Description:**  
Users log their fishing trips to build a personal journal:
- **Trip details:** Date, location, start/end time, duration
- **Catch data:** Number of fish, species, size/weight, photos
- **Weather snapshot:** Auto-filled from API (temperature, wind, pressure, moon phase)
- **Notes:** Personal notes about the trip
- **Linking:** Auto-link to that day's MoonBite score

Store in IndexedDB. Over time, correlate catches with scores.

**Why it matters:**  
Personal data is powerful. Users see patterns: "I caught the most on days with score 70+" → builds trust and loyalty.

**Data structure:**
```typescript
interface FishingTrip {
  id: string;
  date: Date;
  location: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  catchCount: number;
  species: string[];
  weight?: number;  // total weight or avg
  notes: string;
  photos: File[];   // file paths in IndexedDB
  moonBiteScore: number;
  weather: {
    temperature: number;
    windSpeed: number;
    pressure: number;
    moonPhase: string;
  };
  createdAt: Date;
}
```

**Component structure:**
- `FishingJournalService` — CRUD for trips, IndexedDB persistence
- `TripFormComponent` — add/edit trip with date/location picker, file upload
- `JournalComponent` — list of past trips, filter by location/date
- `TripDetailComponent` — view single trip with photos, linked score

**Dependencies:** Features 01, 04, 05 (needs location, weather, and score)

**Acceptance Criteria:**
- [ ] Add new fishing trip with date, location, time, catches, notes
- [ ] Photo upload (2–5 photos per trip)
- [ ] Auto-fill weather from API
- [ ] Link to that day's MoonBite score
- [ ] Edit trip details
- [ ] Delete trip with confirmation
- [ ] List of past trips (sortable by date, location)
- [ ] Filter trips by location or date range
- [ ] View individual trip with all details and photos
- [ ] Persist to IndexedDB
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** L

**Effort Estimate:** 6–8 days (photo upload, form handling, indexing are time-consuming)

---

### Feature 21 — Analytics Dashboard for Power Users

**Description:**  
Advanced view correlating catch logs with daily scores and moon phases:
- **When do I catch the most?** Chart: catches vs. score (scatter or bar chart)
- **Best fishing days:** Identify patterns (e.g., "My best catches are on full moons")
- **Seasonal trends:** "Spring peaks are 3x higher than summer"
- **Personal baseline:** "My average score on good days is 72"
- **Export data:** CSV download of all trips + scores

**Why it matters:**  
Power users love data. Provides retention and a competitive moat (their personal fishing data is locked in).

**Component structure:**
- `AnalyticsService` — cross-correlate catch logs with historical scores, statistical analysis
- `AnalyticsComponent` — dashboard layout with charts
- `CatchVsScoreChartComponent` — scatter or bar chart
- `SeasonalTrendsComponent` — season-over-season comparison
- `ExportDataComponent` — CSV download button

**Analysis queries:**
- Catches by score range (0–25, 25–50, 50–75, 75–100)
- Catches by moon phase (full, new, waxing, waning)
- Catches by season (spring, summer, fall, winter)
- Average score on days with catches vs. without

**Dependencies:** Feature 20 (needs catch logs); depends on Feature 05 (needs score history)

**Acceptance Criteria:**
- [ ] Chart: catches vs. score (correlate to see if high scores → more fish)
- [ ] Identify best fishing moon phases
- [ ] Seasonal trend analysis
- [ ] Personal baseline metrics (avg score on good days)
- [ ] Export trip data as CSV
- [ ] Sufficient sample size check (e.g., "Need >10 trips for analysis")
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** L

**Effort Estimate:** 5–7 days (statistical analysis and charting are complex)

---

### Feature 22 — Premium / Paid Features (Freemium Model)

**Description:**  
Introduce a subscription tier to monetize engaged users:

| Feature | Free | Premium |
|---------|------|---------|
| Daily score | ✓ | ✓ |
| Score history | 7 days | 90 days |
| Saved locations | 1 | Unlimited |
| Catch logging | | ✓ |
| Analytics | | ✓ |
| Ad-free | | ✓ |

**Why it matters:**  
Monetization and sustainability. Realistic target: 5–10% conversion (users pay $2.99–4.99/month).

**Implementation:**
- Subscription state in `SubscriptionService` (signal: `isPremium`)
- Feature guards using Angular route guards or component-level signals
- Paywall UI: show on premium features if not subscribed
- Backend (future): validate subscription, handle payments (Stripe, Apple, Google)

**Component structure:**
- `SubscriptionService` — subscription state, localStorage persistence
- `PaywallComponent` — "Unlock with Premium" modal
- Feature guards on routes (e.g., `/analytics` requires premium)

**Premium features (gated):**
- History: limit to 7 days free, 90 days premium
- Saved locations: limit to 1 free, unlimited premium
- Catch logging: premium only
- Analytics: premium only
- Ad-free: premium only

**Paywall UX:**
```
"Unlock Advanced Insights
 Track your catches, analyze patterns, and improve your success.
 
 Premium Features:
 • Unlimited saved locations
 • 90-day score history
 • Catch logging & photos
 • Personal analytics
 • Ad-free experience
 
 [Subscribe] [Learn More]"
```

**Dependencies:** All (wraps Features 13, 15, 20, 21)

**Acceptance Criteria:**
- [ ] Feature gating logic (isPremium checks)
- [ ] Paywall UI on premium features
- [ ] Free tier limits: 1 location, 7-day history, no catch logging
- [ ] Premium tier unlocks: unlimited locations, 90-day history, catch logging, analytics
- [ ] Subscription state persists in localStorage (MVP; future: backend validation)
- [ ] Route guards prevent access to premium routes
- [ ] Mobile responsive
- [ ] Unit test coverage ≥85%

**Complexity:** M

**Effort Estimate:** 3–4 days (payment integration is future; MVP just gates features)

---

## Milestone 4: Future Enhancements (Post-Week 8)

### Feature 23 — Backend & User Accounts (Future)

- User registration / login
- Cloud sync of preferences, saved locations, catch logs
- Backend validation of premium subscriptions
- Analytics and usage data collection (anonymized)

### Feature 24 — Payment Processing (Future)

- Stripe integration for web subscription
- Apple In-App Purchase (iOS app)
- Google Play Billing (Android app)

### Feature 25 — Community & Social (Future)

- Fishing spots discussion board
- Catch sharing with leaderboards
- Following other anglers
- Social proof (likes, comments)

### Feature 26 — Advanced Integrations (Future)

- Smartwatch notifications (Apple Watch, Wear OS)
- Alexa / Google Assistant: "What's my fishing score?"
- Calendar integration (add solunar peaks to calendar)

---

## Prioritization & RICE Scoring

### High Priority (RICE >100)

| Feature | Reach | Impact | Confidence | Effort | RICE |
|---------|-------|--------|------------|--------|------|
| **F01: Geolocation** | 100% | Critical | 90% | S | 270 |
| **F02: Moon Phase** | 100% | Critical | 90% | S | 270 |
| **F03: Solunar** | 100% | Critical | 80% | M | 160 |
| **F04: Weather** | 100% | Critical | 90% | M | 180 |
| **F05: Scoring** | 100% | Critical | 70% | M | 140 |
| **F06: Home Screen** | 100% | Critical | 95% | S | 285 |
| **F07: Responsive Design** | 100% | Critical | 95% | M | 190 |

### Medium Priority (RICE 50–100)

| Feature | RICE | Milestone |
|---------|------|-----------|
| F08–F10: Detail Screens | 80–100 | M2 |
| F11: Score Breakdown | 95 | M2 |
| F12: Navigation | 90 | M2 |
| F13: Saved Locations | 75 | M2 |
| F14: Preferences | 65 | M2 |
| F15: History | 70 | M2 |
| F16: Branding | 50 | M2 |
| F17: Sharing | 80 | M3 |
| F18: Location Library | 60 | M3 |
| F19: Notifications | 70 | M3 |

### Lower Priority (RICE <50)

| Feature | RICE | Milestone |
|---------|------|-----------|
| F20: Catch Logging | 40 | M3 |
| F21: Analytics | 30 | M3 |
| F22: Premium | 45 | M3 |

---

## Success Metrics & KPIs

### Milestone 1 (MVP) — Week 2

| Metric | Target | Validation |
|--------|--------|------------|
| App load time | <2s | Lighthouse audit |
| Score display latency | <5s after location grant | Manual testing |
| Geolocation permission grant rate | >90% | Analytics event |
| Users reaching home screen | >80% | Analytics event |
| Unit test coverage | ≥85% | Code coverage report |
| Console errors | 0 | QA testing |
| Mobile responsive | Pass on 360px, 768px, 1200px | Manual testing |

### Milestone 2 (Core Value) — Week 4

| Metric | Target | Validation |
|--------|--------|------------|
| DAU / MAU ratio | >50% | Analytics |
| Users viewing detail screens | >70% | Analytics event |
| Average session duration | >2 minutes | Analytics |
| User satisfaction (NPS) | >50 | User survey |
| Day-2 retention | >30% | Cohort analysis |
| Saved locations created | avg 1.5+ per user | Analytics |

### Milestone 3 (Engagement) — Week 8

| Metric | Target | Validation |
|--------|--------|------------|
| Scores shared per day | >20% of daily scores | Analytics event |
| Power users (10+ locations) | >5% | Analytics |
| Catch logs created | >30% of users log ≥1 | Analytics |
| Day-7 retention | >40% | Cohort analysis |
| Day-30 retention | >25% | Cohort analysis |
| Premium conversion rate | 5–10% | Subscription data |

---

## Technical Dependencies & API Costs

### MVP APIs (Free Tier)

| API | Purpose | Cost | Limit | Notes |
|-----|---------|------|-------|-------|
| Browser Geolocation | User location | Free | Native | No API calls |
| Open-Meteo | Weather + moon | Free | 10k/day | No key required |
| Nominatim (OSM) | Reverse geocoding | Free | 1 req/sec | Fair use |
| astronomy-engine | Solunar calculation | Free | npm package | Local, no API |

**Total MVP API cost: $0**

### Scale (If Exceeding Free Tiers)

- **Open-Meteo overflow:** $0 (graceful degradation; show cached data)
- **Nominatim overflow:** Switch to Google Geocoding API (~$0.005/request)
- **Total estimated cost at 100k monthly active users:** <$200/month

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Solunar algorithm accuracy | Medium | High | Validate astronomy-engine against solunar.org; early user feedback |
| Weather API downtime | Low | Medium | Cache last known weather (2 hours); show "last updated" timestamp |
| Geolocation permission denial | Medium | High | Provide manual location entry (city name or lat/lon); fallback UX |
| Algorithm doesn't match real fishing | High | High | Collect catch logs (F20) early; iterate weights based on data; start conservative |
| Feature scope creep | High | Medium | Strict scope per milestone; defer "nice to have" to M4 |

---

## Development Workflow

### Per-Feature Process (Recommended)

1. **Create feature requirements file:** `docs/feature-requirements/feature-NN-<slug>.md`
2. **TDD workflow:**
   - Write unit tests first (Jasmine)
   - Write implementation
   - Run tests until passing
   - Achieve ≥85% coverage
3. **E2E tests:** Playwright tests for critical paths (geolocation, score display)
4. **Code review:** ESLint, Prettier, manual review
5. **Merge to main:** Git PR with tests passing
6. **Iterate:** Gather feedback, adjust weights/UX

### Sprint Cadence (Recommended)

- **1-week sprints** for MVP (faster feedback, scope control)
- **2-week sprints** for M2+ (more complex features)
- **Daily standups** for sync
- **Weekly demo** to stakeholders

---

## Go-to-Market Timeline

### Week 1–2 (MVP)
- Launch on Product Hunt
- Social media (Twitter, Reddit, fishing forums)
- Fishing subreddits (r/fishing, r/bassfishing, r/carp)
- Fishing Discord servers
- Target: 500+ installs

### Week 3–4 (M2)
- Gather user feedback
- Feature blog posts (Why Solunar Matters, How to Read Barometric Pressure)
- Email reach-out to early users (feature requests)
- Influencer outreach: fishing YouTube channels
- Target: 2,000+ total users

### Week 5–8 (M3)
- Introduce premium tier
- Referral campaign ("Invite a friend, both get premium month free")
- Content marketing (SEO for "fishing forecast app")
- In-app prompts for premium (after 10 catch logs, etc.)
- Target: 10,000+ total users; 5–10% premium conversion

---

## Open Questions & Decisions

1. **Platform expansion:** Web-only (PWA) or native iOS/Android apps?
2. **Geographic focus:** US-only or global from day one?
3. **Data privacy:** How much user data do we collect and retain?
4. **Algorithm transparency:** Show exact weights or keep them proprietary?
5. **Community features:** Build community features (M4) or focus on core value first?
6. **International support:** Multi-language support from MVP or later?

---

## Document Metadata

- **Created:** April 1, 2026
- **Version:** 1.0
- **Status:** Ready for Development
- **Review Cycle:** Bi-weekly (post-sprint reviews)
- **Next Review:** April 15, 2026 (end of M1)

**Related Documents:**
- Product Brief: `docs/PRODUCT-BRIEF.md`
- Architecture Guide: `docs/AGENTS.md`
- Feature Requirements: `docs/feature-requirements/` directory
- Technical Stack: `CLAUDE.md`

---

## Appendix: Example User Workflows

### MVP User Journey (First-Time User)

1. Open app → Grant location permission (2 seconds)
2. See home screen: location + daily score + summary (3 seconds)
3. Check score: "72 — Good fishing today"
4. Quick scan: "Moon: waxing favorable. Solunar: strong peak at 7 AM. Wind: calm. Pressure: rising."
5. **Decision:** Yes, I'll go fishing today.
6. (Optional) Click summary → see detail screens (M2+)

**Total time to decision:** 30 seconds

### M2 User Journey (Engaged User)

1. Open app → See score (cached from yesterday)
2. Tap "Details" → View moon, solunar, weather breakdown
3. See score breakdown: understand why score is 72
4. Review solunar timeline: plan to fish 7:00–9:00 AM (peak hours)
5. Check weather details: wind forecast for afternoon (might take trip early)
6. Tap "History" → See 7-day trend: high scores around full moon
7. **Decision:** Go fishing at 7 AM, back by noon.

**Total time to plan:** 2 minutes

### M3 User Journey (Power User)

1. Open app → Check score (score is 65 — fair)
2. Tap "Locations" → Switch to "Smith Lake" (favorite spot) → Score is 72 there
3. Open "Journal" → Log last week's catch (5 bass, caught at 8 AM)
4. Tap "Analytics" → See scatter chart: "I catch 60% more on days with score >70"
5. Share score with friend: "Smith Lake is a 72 today — let's go!"
6. Open Apple Notes to plan trip (from share notification)

**Total time:** 3 minutes; uses 4+ features

---

## Appendix: Feature File Template

When creating individual feature requirement files, use this template:

```markdown
# Feature NN — [Feature Name]

**Status:** Backlog | In Progress | Done  
**Milestone:** M1 | M2 | M3  
**Complexity:** S | M | L | XL  
**Estimated Effort:** X–Y days  
**Dependencies:** [Feature NN], [Feature NN]

## User Story

> As a [user type], I want to [action], so that [benefit].

## Requirements

### Functional

- Requirement 1
- Requirement 2
- ...

### Non-Functional

- Performance: [e.g., <2s load time]
- Coverage: [85%+ unit tests]
- Accessibility: [WCAG AA]
- Mobile: [360px+ responsive]

## Data Structure

[TypeScript interfaces]

## Acceptance Criteria

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
- ...

## Technical Notes

[Implementation guidance, API details, etc.]
```

---

## Appendix: Testing Strategy

### Unit Tests (Jasmine/Karma)

- **Coverage threshold:** 85% (statements, branches, functions, lines)
- **Location:** Co-located with source files (`*.spec.ts`)
- **Framework:** TestBed for component tests, direct for service tests
- **Mocking:** Mock HTTP with `provideHttpClientTesting()`

### E2E Tests (Playwright)

- **Location:** `e2e/tests/*.spec.ts`
- **Coverage:** Critical user paths (geolocation, score display, navigation)
- **Selectors:** Prefer `page.getByRole()` and `page.getByText()` (accessible)
- **Headless:** Run in CI/CD; UI mode for local debugging

### Manual Testing

- Mobile device (iPhone 12 or Pixel 5)
- Tablet (iPad)
- Desktop (Chrome, Firefox, Safari)
- Geolocation permission scenarios (granted, denied, timeout)
- Offline fallback (show cached data)

---

**End of Roadmap**
