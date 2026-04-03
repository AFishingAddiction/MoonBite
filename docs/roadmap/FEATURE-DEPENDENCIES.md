# MoonBite Feature Dependencies & Build Order

This document shows which features depend on other features and the recommended build order to minimize blockers.

---

## Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FEATURE DEPENDENCIES                         │
└─────────────────────────────────────────────────────────────────────┘

MILESTONE 1: MVP (Weeks 1–2)
==================================

┌─────────────────────────────────────────────────────────────────────┐
│                       F01: GEOLOCATION                              │
│   (Required by: F02, F03, F04, F13 | No dependencies)              │
└─────────────────────────────────────────────────────────────────────┘
        │                  │                 │                    │
        ├──────────────────┼─────────────────┼────────────────────┤
        ↓                  ↓                 ↓                    ↓
   ┌────────┐        ┌────────┐       ┌────────┐          ┌────────┐
   │ F02:   │        │ F03:   │       │ F04:   │          │ F13:   │
   │ MOON   │        │ SOLUNAR│       │WEATHER │          │SAVED   │
   │ PHASE  │        │        │       │        │          │LOC.    │
   └────────┘        └────────┘       └────────┘          └────────┘
        │                  │                 │
        └──────────────────┴─────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │  F05: SCORING ENGINE  │
        │ (Combines F02, F03, F04)
        └───────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │ F06: HOME SCREEN      │
        │ (Displays F05 score)  │
        └───────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │ F07: MOBILE DESIGN    │
        │ (Styles all features) │
        └───────────────────────┘


MILESTONE 2: CORE VALUE (Weeks 3–4)
====================================

F02 (Moon Phase)         F03 (Solunar)        F04 (Weather)
        │                       │                    │
        ↓                       ↓                    ↓
┌─────────────────┐   ┌──────────────────┐  ┌──────────────────┐
│ F08: Moon       │   │ F09: Solunar     │  │ F10: Weather     │
│ Details Screen  │   │ Details Screen   │  │ Details Screen   │
└─────────────────┘   └──────────────────┘  └──────────────────┘
        │                       │                    │
        └───────────────────────┴────────────────────┘
                        │
                        ↓
              ┌──────────────────────┐
              │ F11: Score Breakdown │
              │ (Explains F05 score) │
              └──────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    ┌────────┐   ┌──────────┐   ┌─────────────┐
    │ F12:   │   │ F14:     │   │ F16:        │
    │ BOTTOM │   │ PREFS    │   │ BRANDING    │
    │ NAV    │   │ (Dark    │   │ (Splash)    │
    │        │   │  mode,   │   │             │
    └────────┘   │  units)  │   └─────────────┘
        │        └──────────┘
        │             │
        │             ↓
        │        ┌──────────────┐
        │        │ F19:         │
        │        │ NOTIF.       │
        │        │ (Uses F14    │
        │        │ settings)    │
        │        └──────────────┘
        │
        ↓
F05 (Scoring Engine)
        │
        ├─────────────────┬─────────────────┐
        ↓                 ↓                 ↓
    ┌─────────┐   ┌────────────┐   ┌─────────────┐
    │ F15:    │   │ F17:       │   │ F13: Saved  │
    │ HISTORY │   │ SHARING    │   │ Locations   │
    │ (Track  │   │ (Share     │   │ (Switch     │
    │  scores)│   │  score)    │   │  between    │
    └─────────┘   └────────────┘   │  spots)     │
        │               │           └─────────────┘
        │               │                 │
        ├───────────────┤                 ↓
        ↓               ↓           ┌──────────────┐
    ┌───────────────────────┐      │ F18:         │
    │ F21: ANALYTICS        │      │ LOCATION     │
    │ (Correlate catches    │      │ LIBRARY      │
    │ w/ scores)            │      │ (Search      │
    │ (Requires F20 logs)   │      │  spots)      │
    └───────────────────────┘      └──────────────┘


MILESTONE 3: GROWTH (Weeks 5–8)
===============================

F13 (Saved Locations)    F17 (Sharing)
        │                       │
        └───────────────────────┴────────────────────┐
                        │                            │
                        ↓                            ↓
              ┌──────────────────────┐    ┌──────────────────┐
              │ F20: CATCH LOGGING   │    │ F22: PREMIUM     │
              │ (Log fishing trips)  │    │ (Monetization)   │
              └──────────────────────┘    └──────────────────┘
                        │                        │
                        ↓                        ├─── Gates F13, F15, F20, F21
                F21: ANALYTICS
                (See patterns in
                 personal catch data)
```

---

## Build Order (Critical Path)

### Week 1

**Day 1–2: Foundation (Serial)**
1. **F01: Geolocation** — Must ship first (all others depend on it)
   - Geolocation API wrapper + reverse geocoding
   - Acceptance: location displays on screen

**Day 2–3: Parallel (Can start while F01 finishes QA)**
2. **F02: Moon Phase** — Independent from others
   - Open-Meteo API integration
   - Acceptance: moon phase displays with icon + percentage

3. **F03: Solunar Tables** — Independent from others
   - astronomy-engine npm package + local calculation
   - Acceptance: major/minor peak times display

4. **F04: Weather** — Independent from others
   - Open-Meteo API integration (same provider as F02 for efficiency)
   - Acceptance: wind, rain, pressure display

**Day 4: Blocking (Requires F02, F03, F04)**
5. **F05: Scoring Algorithm** — Depends on F02, F03, F04
   - Implement weighting logic
   - Acceptance: score 0–100 displays with label ("Excellent", "Good", etc.)

**Day 4–5: Parallel (Can start once F05 logic is ready)**
6. **F06: Home Screen** — Depends on F05
   - Layout with location, large score card, summary of inputs
   - Acceptance: score visible on app load

7. **F07: Responsive Design** — Parallel with F06
   - SCSS, mobile-first, responsive to 1024px+
   - Acceptance: looks good on 360px, 768px, 1024px screens

**Day 5–6: QA & Integration**
- All features meet 85%+ unit test coverage
- Playwright E2E tests for critical paths
- MVP ready for launch

---

### Week 2

**Day 1–2: Parallel Details Screens**
8. **F08: Moon Phase Details** — Depends on F02
9. **F09: Solunar Details** — Depends on F03
10. **F10: Weather Details** — Depends on F04

**Day 2–3: Interdependent**
11. **F11: Score Breakdown** — Depends on F05 (scoring engine)
    - Visual breakdown of point contributions

12. **F12: Bottom Navigation** — Depends on F06 (home screen)
    - Routes to home, details, settings

**Day 3–4: Parallel Settings & Polish**
13. **F13: Saved Locations** — Depends on F01
    - localStorage for bookmarks
    - Quick location switcher

14. **F14: User Preferences** — Independent
    - Settings for units, time format, dark mode
    - localStorage persistence

15. **F16: Branding** — Parallel, polish phase
    - Splash screen, logo, consistent colors

**Day 4–5: History & Notifications**
16. **F15: Score History** — Depends on F05
    - IndexedDB storage for daily scores
    - Simple chart view

17. **F19: Notifications** — Depends on F14 (preferences)
    - Web push notifications (opt-in via preferences)

**Day 5–6: Final QA & M2 Launch**
- All features meet coverage threshold
- Playwright tests updated
- M2 ready for launch

---

### Weeks 3–4 (Parallel Track: Can start Day 3 of Week 2)

**F18: Location Library** — Depends on F13
- Searchable database of popular spots
- Independent of core scoring

**F17: Share Score** — Depends on F05
- Social media cards, copy-to-clipboard
- Independent of other growth features

---

### Weeks 5–8

**F20: Catch Logging** — No direct dependencies
- Fishing trip form + photo upload
- Can start independently

**F21: Analytics** — Depends on F20 (catch logs)
- Correlate personal catches with scores
- Historical analysis

**F22: Premium Gating** — Can be added retroactively
- Feature flags for gating
- Wraps F13, F15, F20, F21

---

## Parallelization Opportunities

### Can Build in Parallel
- **F02, F03, F04** (moon, solunar, weather) — All independent; can split across 3 developers
- **F08, F09, F10** (details screens) — Parallel; same data sources as F02–F04
- **F13, F14** (bookmarks, preferences) — Independent; different data sources
- **F15, F17** (history, sharing) — Parallel; both use F05 data but different UI
- **F20, F21** (catch logging, analytics) — Sequential (F20 first, then F21)

### Must Build Serially
- **F01 → F02, F03, F04** — Geolocation must be done first (blocks all scoring)
- **F02, F03, F04 → F05** — Must have all inputs before scoring algorithm
- **F05 → F06** — Need score before home screen
- **F06 → F12** — Need home screen before navigation
- **F14 → F19** — Need preferences before notifications (stores settings)
- **F20 → F21** — Need catch logs before analytics can correlate

---

## Risk Mitigation by Feature

| Feature | Risk | Mitigation |
|---------|------|-----------|
| **F01: Geolocation** | Permission denial | Allow manual entry fallback |
| **F02: Moon Phase** | API outage | Cache last 2 hours; show timestamp |
| **F03: Solunar** | Calculation wrong | Validate against solunar.org |
| **F04: Weather** | API downtime | Cache + fallback to generic conditions |
| **F05: Scoring** | Algorithm doesn't match reality | Iterate based on catch logs (F20) |
| **F06: Home Screen** | Score loads slowly | Optimize API calls, cache data |
| **F07: Responsive** | Layout breaks on edge cases | Test on real devices regularly |
| **F13: Saved Locations** | localStorage full (5MB limit) | Validate count, suggest cleanup |
| **F15: History** | IndexedDB storage limit | Archive old records to JSON export |
| **F20: Catch Logging** | Photo upload is slow | Compress images, show progress bar |

---

## Testing Strategy by Feature

### Unit Tests
- **F01:** Geolocation API wrapper, reverse geocoding parsing
- **F02:** Moon phase data transformation, edge cases (new moon, full moon)
- **F03:** Solunar calculation, time parsing
- **F04:** Weather API response parsing, unit conversion
- **F05:** Scoring algorithm, edge cases (all zeros, all max)
- **F13–F15:** localStorage/IndexedDB CRUD operations
- **F20:** Trip form validation, file upload handling

### E2E Tests
- **F06:** Load app → Grant geolocation → See score displayed
- **F12:** Navigate between home, details, settings
- **F13:** Add location → Switch locations → Score updates
- **F15:** View history chart, verify data persists after refresh
- **F17:** Click share → Social media card appears
- **F20:** Log trip → Verify in journal → See in analytics

---

## Recommended Sprint Planning

### Sprint 1 (Days 1–5, Week 1)
**Goal:** Ship MVP (F01–F07)

| Task | Owner | Dependencies | Status |
|------|-------|---|--------|
| F01: Geolocation | Dev1 | None | Critical path |
| F02: Moon Phase | Dev2 | F01 | Start after F01 compiles |
| F03: Solunar | Dev3 | F01 | Parallel with F02 |
| F04: Weather | Dev4 | F01 | Parallel with F02/F03 |
| F05: Scoring | Dev1 (after F01) | F02, F03, F04 | Blocked until F02–F04 done |
| F06: Home Screen | Dev2 (after F02) | F05 | Blocked until F05 done |
| F07: Responsive Design | Design + Dev | F06 | Parallel with F06 |

---

### Sprint 2 (Days 1–10, Weeks 2–3)
**Goal:** Ship M2 (F08–F16)

| Task | Owner | Dependencies | Status |
|------|-------|---|--------|
| F08–F10: Details Screens | Dev2, Dev3, Dev4 | F02, F03, F04 | Parallel |
| F11: Score Breakdown | Dev1 | F05 | Can start early |
| F12: Navigation | Dev1 | F06 | Parallel with F08–F10 |
| F13: Saved Locations | Dev2 | F01 | Parallel |
| F14: Preferences | Dev3 | None | Parallel |
| F15: History | Dev4 | F05 | Parallel with F14 |
| F16: Branding | Design | All | Polish phase |

---

## Definition of Done

Each feature is considered "done" when:

- [ ] Code written and reviewed (>1 reviewer)
- [ ] Unit tests: ≥85% coverage
- [ ] E2E tests: critical path covered
- [ ] No console errors or warnings
- [ ] Performance: meets targets (load <2s, score display <5s)
- [ ] Mobile responsive: tested at 360px, 768px, 1024px
- [ ] Accessibility: keyboard navigation, ARIA labels (as applicable)
- [ ] Documentation: inline code comments for complex logic, README updated
- [ ] Acceptance criteria from feature doc met

---

## Schedule Summary

```
WEEK 1
======
Mon–Tue:  F01 (geolocation) — Critical path
Tue–Wed:  F02, F03, F04 (moon, solunar, weather) in parallel
Wed–Thu:  F05 (scoring algorithm) — Depends on F02–F04
Thu–Fri:  F06 (home screen) + F07 (responsive design)
Fri:      QA & integration testing

WEEK 2
======
Mon–Tue:  F08–F10 (details screens) in parallel
Tue–Wed:  F11 (score breakdown), F12 (navigation)
Wed–Thu:  F13 (bookmarks), F14 (preferences), F15 (history) in parallel
Thu–Fri:  F16 (branding), F19 (notifications)
Fri:      M2 Launch QA & integration

WEEKS 3–4
=========
Parallel: F17 (sharing), F18 (location library)
(Can overlap with M2 final QA)

WEEKS 5–8
=========
M3 Build: F20 (catch logging) → F21 (analytics)
          F22 (premium gating) retroactively added
```

---

## Key Metrics to Track

### Completion Velocity
- Features shipped per week
- Average feature lead time (from start to launch)
- Blocker frequency (dependencies not ready)

### Quality Metrics
- Unit test coverage (target: 85%+)
- E2E test pass rate (target: 100% on main branch)
- Bug escape rate (defects found post-launch vs. pre-launch)

### Performance Metrics
- App load time (target: <2s)
- Score display time (target: <5s)
- API response times (cache hits vs. misses)

---

**Document Version:** 1.0  
**Created:** April 1, 2026  
**Last Updated:** April 1, 2026
