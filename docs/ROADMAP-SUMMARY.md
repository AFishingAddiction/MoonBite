# MoonBite Roadmap — Quick Reference

**See the full roadmap in [`docs/ROADMAP.md`](ROADMAP.md) and product brief in [`docs/PRODUCT-BRIEF.md`](PRODUCT-BRIEF.md).**

---

## Timeline & Scope

| Milestone | Duration | Target Ship Date | Features | Key Metric |
|-----------|----------|------------------|----------|-----------|
| **MVP** | 2 weeks | Week 2 | F01–F07 | <2s load, <5s score display |
| **Core Value** | 2 weeks | Week 4 | F08–F16 | >70% DAU, >80% satisfaction |
| **Growth** | 4 weeks | Week 8 | F17–F22 | >20% share rate, 5–10% premium conv. |

---

## Feature Summary by Milestone

### Milestone 1: MVP — Daily Fishing Score (Weeks 1–2)

| # | Feature | User Goal | Complexity | Status |
|---|---------|-----------|-----------|--------|
| **01** | Geolocation Permission & Display | Allow app to find my location | M | Backlog |
| **02** | Moon Phase Data Service | Know today's lunar phase | S | Backlog |
| **03** | Solunar Table Data Service | See peak feeding times | M | Backlog |
| **04** | Weather Data Service | Check wind, rain, pressure | M | Backlog |
| **05** | Fishing Score Calculation Engine | Get a 0–100 score for today | M | Backlog |
| **06** | App Shell & Home Screen | See the score immediately on open | S | Backlog |
| **07** | Responsive Design & Mobile-First CSS | Use the app on my phone | M | Backlog |

**MVP User Journey:** Open app → Grant location → See score in <30 seconds

---

### Milestone 2: Core Value — Detailed Breakdowns (Weeks 3–4)

| # | Feature | User Goal | Complexity | Status |
|---|---------|-----------|-----------|--------|
| **08** | Moon Phase Details Screen | Understand the lunar cycle & next events | M | Backlog |
| **09** | Solunar Peak Times Details Screen | Plan my day around feeding windows | M | Backlog |
| **10** | Weather Details Screen | See hourly forecast & pressure trends | M | Backlog |
| **11** | Score Breakdown Explanation | Understand *why* the score is what it is | S | Backlog |
| **12** | Bottom Navigation / Routing | Navigate between home, details, settings | S | Backlog |
| **13** | Location Bookmarks / Saved Locations | Quickly check multiple fishing spots | M | Backlog |
| **14** | User Settings & Preferences | Customize units (F/C, mph/knots), dark mode | S | Backlog |
| **15** | Daily Score History & Trends | See patterns in fishing scores over time | M | Backlog |
| **16** | Splash Screen & App Branding | See a polished, branded app | S | Backlog |

**M2 User Journey:** Details tab → Understand score → Save favorite locations → Check tomorrow

---

### Milestone 3: Engagement & Growth (Weeks 5–8)

| # | Feature | User Goal | Complexity | Status |
|---|---------|-----------|-----------|--------|
| **17** | Share Score / Daily Report | Share my fishing forecast with friends | M | Backlog |
| **18** | Location Search & Library | Discover new fishing spots | M | Backlog |
| **19** | Smart Notifications & Alerts | Get notified of great fishing days | M | Backlog |
| **20** | Catch Logging & Fishing Journal | Log my trips & track catches | L | Backlog |
| **21** | Analytics Dashboard for Power Users | Correlate my catches with scores & moon phase | L | Backlog |
| **22** | Premium / Paid Features | Unlock advanced features | M | Backlog |

**M3 User Journey:** Log a trip → See analytics → Share score → Invite friends

---

## Data Sources & APIs

### Free APIs (No Cost for MVP)

| Data | API | Why | Cost |
|------|-----|-----|------|
| **Weather & Moon Phase** | Open-Meteo | Free, global, no key required | Free |
| **Reverse Geocoding** | Nominatim (OSM) | Free, open-source, global | Free |
| **Solunar Calculation** | astronomy-engine (npm) | Local calculation, no API calls, open-source | Free |

### Optional (Scale Phase)

| Data | API | Cost per 1k | Use Case |
|------|-----|-------------|----------|
| Weather (alt) | OpenWeatherMap | $0.10 | If Open-Meteo insufficient |
| Solunar (alt) | astronomy-api.com | $50–$500 | If local calculation inadequate |

---

## Success Metrics

### MVP (Week 2)
- [ ] App loads in <2 seconds
- [ ] Score displays in <5 seconds of location grant
- [ ] 85%+ unit test coverage
- [ ] Zero console errors
- [ ] Mobile responsive (360px+ width)

### M2 (Week 4)
- [ ] >70% of users view a details page
- [ ] >80% user satisfaction (NPS)
- [ ] >50% DAU
- [ ] Day-7 retention >40%

### M3 (Week 8)
- [ ] >20% share rate
- [ ] >10 saved locations per power user (avg)
- [ ] >30% users log at least one catch
- [ ] 5–10% premium conversion rate

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Angular 21 (standalone) | Signals for state mgmt, OnPush change detection |
| **Language** | TypeScript 5.9+ | Strict mode, no `any` |
| **Styling** | SCSS | Mobile-first, semantic naming |
| **State** | Angular Signals | No external store needed |
| **Persistence** | localStorage + IndexedDB | Preferences & history |
| **Testing** | Jasmine/Karma + Playwright | 85% unit test threshold |

---

## Dependencies Between Features

```
Geolocation (01)
├── Moon Phase (02) → Moon Details (08) → Score Breakdown (11)
├── Solunar (03) → Solunar Details (09) → Score Breakdown (11)
├── Weather (04) → Weather Details (10) → Score Breakdown (11)
└── Saved Locations (13) → Location Library (18)

Scoring Algorithm (05)
├── Score Breakdown (11)
├── Share Score (17)
└── History (15)

Home Screen (06) → Navigation (12)

Preferences (14) → Notifications (19)

History (15) → Analytics (21)

Catch Logging (20) → Analytics (21)

Premium (22) → Wraps features 13, 15, 20, 21
```

---

## Key Decisions

### Solunar Calculation: Local vs. API
**Decision:** Use `astronomy-engine` npm package (local calculation).

**Why:** Free, no API latency, works offline, deterministic, auditable.

---

### Weather Provider: Open-Meteo vs. Alternatives
**Decision:** Start with Open-Meteo (no API key needed).

**Why:** Free unlimited, includes moon phase (fewer API dependencies), excellent data quality.

---

### Persistence: localStorage vs. IndexedDB
**Decision:** localStorage for settings/bookmarks; IndexedDB for history/logs.

**Why:** localStorage is simple and fast for small data; IndexedDB for larger datasets.

---

### Scoring Algorithm: Transparent vs. ML-Based
**Decision:** Simple weighted average, show the breakdown.

**Why:** MVP must be explainable. ML comes later (after catch logs in M3).

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Solunar calculation wrong** | Validate astronomy-engine against solunar.org |
| **Weather API down** | Cache last 2 hours; show timestamp; degrade gracefully |
| **Location permission denied** | Allow manual entry (city name or lat/lon) |
| **Algorithm doesn't match real fishing** | Collect catch logs early; iterate based on user data |
| **User doesn't trust the score** | Show breakdown (Feature 11); iterate weights based on feedback |

---

## What's NOT in Scope (MVP)

- ❌ User accounts / cloud sync (future backend work)
- ❌ Native iOS/Android apps (PWA first)
- ❌ Advanced ML-based scoring (after catch logs)
- ❌ Advertising or sponsorships
- ❌ Offline-first with sync (local storage only)
- ❌ Social features / fishing communities (M3+)

---

## Next Steps

1. **Approve this roadmap** with product and engineering leadership
2. **Create feature detail docs** for each feature (F01–F22) in `docs/feature-requirements/`
3. **Assign Feature 01** to lead developer; start with test-first (TDD) approach
4. **Review weekly** to track progress and adjust as needed
5. **Gather user feedback** after MVP launch (Week 2)

---

## Document References

- **Full Roadmap:** `docs/ROADMAP.md` — 22 features with detailed descriptions, APIs, and complexity
- **Product Brief:** `docs/PRODUCT-BRIEF.md` — Strategic vision, value prop, go-to-market
- **Feature Requirements:** `docs/FEATURE-REQUIREMENTS.md` — Feature index and status
- **Agent Workflows:** `docs/AGENTS.md` — How to decompose tasks and coordinate teams

---

**Status:** Ready for Development  
**Last Updated:** April 1, 2026  
**Version:** 1.0
