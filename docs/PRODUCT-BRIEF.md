# MoonBite — Product Brief

**Date:** April 1, 2026  
**Status:** Ready for Development  
**Audience:** Product, Engineering, Design

---

## Executive Summary

MoonBite is a mobile-first web app that gives anglers a single, actionable daily "fishing score" (0–100) based on solunar tables, moon phase, weather forecast, and barometric pressure. The MVP launches in Week 2 with a 30-second user experience: grant location permission → see your daily score and why it matters.

**Target User:** Casual to serious anglers who check conditions before heading out. Age 25–65, mobile-first.

**Value Prop:** "Stop guessing. Know exactly how good fishing is today — in seconds."

**Go-to-Market:** Free web app (PWA-capable); freemium model after Milestone 2 with premium features like catch logging and advanced analytics.

---

## Problem Statement

Anglers currently check fishing conditions by consulting 3–5 sources:
1. Solunar tables (e.g., solunar.org)
2. Weather apps (e.g., Weather.com)
3. Moon phase apps or calendars
4. Local fishing reports (inconsistent, paywalled)

This is time-consuming, confusing, and doesn't directly answer "Should I go fishing today?"

**Result:** Decision paralysis, missed good days, wasted trips.

---

## Solution

A single score that synthesizes all four inputs:

- **Moon Phase:** Full/new moon = higher score (fish are more active)
- **Solunar Peaks:** Peak feeding times = bonus points
- **Weather:** Calm, clear conditions with high pressure = higher score
- **Barometric Pressure:** Rising pressure = good fishing; falling = sluggish

**Score Range:**
- 75–100: **Excellent** — Go fishing. Conditions are ideal.
- 50–74: **Good** — Worth a trip. Fair to good conditions.
- 25–49: **Fair** — Possible, but marginal. Conditions are not ideal.
- 0–24: **Poor** — Skip today if possible. Conditions are unfavorable.

---

## User Stories (MVP Scope)

### Primary User Journey
> As an angler, I want to open MoonBite, allow it to access my location, and see my daily fishing score in under 30 seconds so that I can quickly decide whether to go fishing today without consulting multiple websites.

### Secondary Journey (Milestone 2)
> As an experienced angler, I want to see the breakdown of my score (moon phase, solunar peaks, weather, pressure) so that I understand *why* today is good/bad fishing and plan my trip accordingly.

### Tertiary Journey (Milestone 3)
> As a frequent angler, I want to log my fishing trips, track catches, and correlate them with daily MoonBite scores so that I build a personal fishing journal and identify my best fishing conditions.

---

## Key Features by Milestone

### Milestone 1: MVP (Week 1–2)
- **Geolocation:** Auto-detect user location via browser; allow manual entry as fallback
- **Moon Phase:** Current lunar phase, percentage illuminated
- **Solunar Times:** Major and minor feeding peaks for today
- **Weather:** Current and forecast (wind, precipitation, pressure)
- **Fishing Score:** Weighted algorithm combining all four inputs
- **Home Screen:** Single card with score, label, and one-liner explanation
- **Mobile-First Design:** Responsive for 360px and up

**MVP Success Criteria:**
- App loads in <2s; score displays in <5s
- All four inputs present and calculating correctly
- 85%+ unit test coverage
- Zero console errors

---

### Milestone 2: Core Value (Week 3–4)
- **Detailed Screens:** Expand each input (moon, solunar, weather) into dedicated detail pages
- **Score Breakdown:** Infographic showing point contributions
- **Navigation:** Bottom nav with routes (home, details, settings)
- **Saved Locations:** Bookmark multiple fishing spots and switch between them
- **User Preferences:** Temperature unit, time format, dark mode
- **Score History:** Track daily scores for 7–30 days with trend charts
- **Branding:** Splash screen, consistent visual design

**M2 Success Criteria:**
- >70% of users view at least one detail page
- >80% user satisfaction in surveys
- 50%+ DAU (daily active users)
- All new features have 85%+ unit test coverage

---

### Milestone 3: Engagement & Growth (Week 5–8)
- **Share Score:** Social cards for Twitter, Facebook, SMS, copy-to-clipboard
- **Location Library:** Searchable database of famous fishing spots
- **Notifications:** Alerts for score changes, upcoming full moons, pressure trends
- **Catch Logging:** Users log trips, catches, photos
- **Analytics:** Correlate personal catch data with daily scores and moon phase
- **Premium Model:** Freemium gating for catch logging, advanced analytics, unlimited locations

**M3 Success Criteria:**
- >20% of scores shared per day (viral coefficient >0.2)
- >10 saved locations per power user
- >30% of users log at least one catch
- 5–10% conversion to premium

---

## Technical Architecture

### Frontend Stack
- **Framework:** Angular 21 (standalone components, signals, OnPush change detection)
- **Language:** TypeScript 5.9+
- **Styling:** SCSS (mobile-first, semantic naming)
- **State Management:** Angular Signals (reactive, no external store needed)
- **Persistence:** localStorage (preferences, bookmarks), IndexedDB (history, catches)
- **Testing:** Jasmine/Karma (85% threshold) + Playwright (e2e)

### External APIs (MVP)
| Purpose | API | Cost | Notes |
|---------|-----|------|-------|
| Weather + Moon | Open-Meteo | Free | 10k req/day; no key required |
| Reverse Geocoding | Nominatim (OSM) | Free | Fair-use limits; no key required |
| Solunar Calculation | astronomy-engine (npm) | Free | Local calculation; no API calls |

### Persistence
- **localStorage:** User preferences, saved locations (small, synchronous)
- **IndexedDB:** Score history, catch logs (larger datasets, async)

### No Backend Required for MVP
The MVP is entirely client-side. A backend is needed only for:
- Premium subscription validation (M3)
- Analytics/reporting (future)
- User accounts / cloud sync (future)

---

## Data Flow

```
User grants location
        ↓
Fetch weather, moon phase, barometric pressure
        ↓
Calculate solunar peaks (local, using astronomy-engine)
        ↓
Weighting algorithm:
  - Moon phase: 0–20 points
  - Solunar peaks: 0–25 points
  - Weather: 0–25 points
  - Pressure trend: −30 to +30 points
        ↓
Total Score: 0–100
        ↓
Display home screen + store in IndexedDB history
        ↓
User can view details, save location, share score
```

---

## Success Metrics

### Acquisition
- Install rate (target: 500 installs in Month 1)
- App store ratings (target: 4.5+ stars)
- Organic traffic / word-of-mouth (target: 50% of installs by M3)

### Activation
- Geolocation permission grant rate (target: >90%)
- Home screen "view time" (target: >10 seconds)

### Engagement
- DAU / MAU ratio (target: >50% for MVP)
- Details page views (target: >70% of DAU by M2)
- Saved locations (target: avg 2+ per user by M2)
- Share rate (target: >20% of users share in M3)

### Retention
- Day-7 retention (target: >40% by M2)
- Day-30 retention (target: >25% by M3)
- Return visitor frequency (target: 5+ sessions/week for active users)

### Revenue (M3+)
- Premium conversion rate (target: 5–10%)
- ARPU (average revenue per user, target: $1–2/month)
- LTV / CAC ratio (target: >3x)

---

## Risk & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Solunar algorithm accuracy | Users distrust score | Medium | Validate astronomy-engine against known tables; collect feedback early |
| Weather API downtime | Feature unavailable | Low | Cache last known data; show timestamp; degrade gracefully |
| Geolocation permission denial | Users can't use app | Medium | Allow manual location entry; prominently feature it |
| Algorithm doesn't correlate with real catches | Core value prop fails | High | Collect catch logs (F20); iterate weights based on data; start conservative |
| Poor weather API quality for local area | Incorrect score | Low | Test coverage for major regions; use fallback (Open-Meteo is accurate) |

---

## Competitive Landscape

### Direct Competitors
- **Fishbrain:** Social fishing platform (has score features, but cluttered UX)
- **FishAngler:** Solunar tables + simple interface (no integrated weather/moon)
- **Solunar.org:** Just solunar tables; no mobile-first design

### MoonBite Differentiation
1. **Single Score:** Easiest decision tool. No confusion.
2. **Transparent Algorithm:** Users understand why they see a score.
3. **Mobile-First UX:** Fastest to load and use.
4. **Open Ecosystem:** Share, social, community (roadmap).

---

## Go-to-Market Strategy

### Phase 1: MVP Launch (Week 2)
- Product Hunt launch
- Fishing forums and subreddits (r/fishing, r/bassfishing, etc.)
- Angler social media groups (Facebook groups, Fishing Discord servers)
- Email reach out to Fishbrain/FishAngler users (if data available)

### Phase 2: Growth (Weeks 3–4)
- Referral incentives ("Invite a friend, both get [premium feature]")
- SEO: "best fishing forecast app", "solunar table app"
- Content marketing: blog posts ("Why Solunar Matters", "How to Read Barometric Pressure")
- Influencer partnerships with fishing YouTube channels

### Phase 3: Monetization (Week 5+)
- Introduce premium tier (catch logging, advanced analytics)
- Email campaigns to active users: "Unlock insights with Premium"
- In-app prompts at key moments (after 10 log entries, etc.)

---

## Success Criteria for Launch

### Week 1 (Internal)
- [ ] All MVP features implemented and tested
- [ ] Unit tests: 85%+ coverage
- [ ] E2E tests: critical paths covered (load, permission, score display)
- [ ] Mobile responsive (tested on iPhone 12, Pixel 5)
- [ ] Performance: <2s load time, <5s score display
- [ ] Zero console errors in QA testing

### Week 2 (Post-Launch)
- [ ] >100 installs in first week
- [ ] >90% permission grant rate
- [ ] >80% of users see the score (no crashes/errors)
- [ ] >4.5 stars on app store reviews
- [ ] >20% of users return on Day 2

### Week 3–4 (M2 Validation)
- [ ] >50% DAU on launch day
- [ ] >70% of users interact with a details page
- [ ] >80% user satisfaction in NPS survey
- [ ] Feedback indicates algorithm feels "reasonable" (ready to iterate)

---

## Roadmap Timeline

| Milestone | Focus | Duration | Target Launch |
|-----------|-------|----------|----------------|
| MVP | Core score, geolocation, weather, moon, solunar | 2 weeks | Week 2 |
| M2 | Details, history, saved locations, preferences | 2 weeks | Week 4 |
| M3 | Sharing, catch logging, notifications, premium | 4 weeks | Week 8 |
| M4+ | Analytics, location library, ecosystem, integrations | Ongoing | Post-Week 8 |

---

## Product Assumptions

1. **Anglers check fishing conditions every morning** (or before trips). They'll use MoonBite daily.
2. **Solunar tables are predictive, not deterministic.** The score won't be 100% accurate, but it's better than guessing.
3. **Users prefer simplicity.** One score is better than a dashboard of metrics.
4. **Transparency builds trust.** Showing the breakdown of the score (not a black box) increases confidence.
5. **Mobile-first is essential.** Most checks happen on-the-go, not on desktop.
6. **Freemium works for fishing apps.** Users will pay for data-driven features (catch logs, analytics) once they see value.

---

## Open Questions for Stakeholders

1. **Platform Strategy:** Web-only PWA, or also native iOS/Android apps?
2. **Monetization Timeline:** Start with ads, freemium, or fully free for 6+ months?
3. **Geographic Scope:** US-only launch, or global from day one?
4. **Data Collection:** Can we collect anonymized catch data to improve the algorithm?
5. **Partnerships:** Would we pursue partnerships with fishing retailers or online magazines?
6. **Scope Adjustment:** Does the 22-feature roadmap feel right, or should we cut non-essential features?

---

## Appendix: Feature Priority Matrix

### RICE Scoring (Reach × Impact × Confidence / Effort)

**High Priority (RICE >100)**
- F01: Geolocation (Reach: 100%, Impact: must-have, Effort: S)
- F02: Moon Phase (Reach: 100%, Impact: must-have, Effort: S)
- F03: Solunar (Reach: 100%, Impact: must-have, Effort: M)
- F04: Weather (Reach: 100%, Impact: must-have, Effort: M)
- F05: Scoring (Reach: 100%, Impact: critical, Effort: M)
- F06: Home Screen (Reach: 100%, Impact: critical, Effort: S)

**Medium Priority (RICE 50–100)**
- F08–F11: Details screens (Reach: 75%, Impact: important for retention, Effort: M)
- F13: Saved locations (Reach: 60%, Impact: engagement, Effort: M)
- F15: History (Reach: 40%, Impact: retention/insights, Effort: M)
- F17: Sharing (Reach: 50%, Impact: acquisition, Effort: M)

**Lower Priority (RICE <50)**
- F20: Catch logging (Reach: 30%, Impact: retention, Effort: L)
- F21: Analytics (Reach: 20%, Impact: power users, Effort: L)
- F22: Premium (Reach: 100%, Impact: monetization, Effort: M but gated)

---

## Document Metadata

- **Created:** April 1, 2026
- **Audience:** Product, Engineering, Design, Marketing
- **Status:** Approved for Development
- **Review Cycle:** Quarterly (or after major milestones)

**For questions, contact:** [Product Manager]

---

## Related Documents

- **Roadmap:** `docs/roadmap/ROADMAP.md` — Detailed feature descriptions, dependencies, and complexity estimates
- **Feature Requirements:** `docs/FEATURE-REQUIREMENTS.md` — Index of all 22 features and their status
- **Architecture Guide:** `docs/AGENTS.md` — How to decompose tasks across agent workflows
- **Project Setup:** `CLAUDE.md` — Technical stack, conventions, and testing strategy

