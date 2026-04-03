# MoonBite — Roadmap Quick Reference

**Quick lookup for features, dependencies, and timelines.**

---

## Milestone Overview

```
MILESTONE 1 (Weeks 1–2)    MILESTONE 2 (Weeks 3–4)    MILESTONE 3 (Weeks 5–8)
┌─────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  MVP                │    │  Core Value          │    │  Engagement & Growth │
│  Core Score         │    │  Transparency        │    │  Sharing & Premium   │
│                     │    │  Detailed Breakdowns │    │  Catch Logging       │
│  • Geolocation      │    │                      │    │                      │
│  • Moon Phase       │    │  • Moon Details      │    │  • Share Score       │
│  • Solunar Peaks    │    │  • Solunar Details   │    │  • Location Library  │
│  • Weather          │    │  • Weather Details   │    │  • Notifications     │
│  • Score Calc       │    │  • Score Breakdown   │    │  • Catch Logging     │
│  • Home Screen      │    │  • Navigation        │    │  • Analytics         │
│  • Responsive       │    │  • Saved Locations   │    │  • Premium Model     │
│                     │    │  • Preferences       │    │                      │
│  7 Features         │    │  • History & Trends  │    │  6 Features          │
│  $0 API Cost        │    │  • Branding          │    │  $0 API Cost         │
│                     │    │                      │    │  (premium=revenue)   │
└─────────────────────┘    │  9 Features          │    └──────────────────────┘
                           │  $0 API Cost         │
                           └──────────────────────┘
```

---

## Feature Matrix by Complexity

### Small (S) — 2–3 Days

| # | Feature | M1 | M2 | M3 |
|---|---------|----|----|-----|
| 01 | Geolocation | ✓ | | |
| 02 | Moon Phase | ✓ | | |
| 06 | Home Screen | ✓ | | |
| 11 | Score Breakdown | | ✓ | |
| 12 | Navigation | | ✓ | |
| 14 | Preferences | | ✓ | |
| 16 | Branding | | ✓ | |

**Total: 7 small features**

### Medium (M) — 3–5 Days

| # | Feature | M1 | M2 | M3 |
|---|---------|----|----|-----|
| 03 | Solunar Tables | ✓ | | |
| 04 | Weather Data | ✓ | | |
| 05 | Scoring Algorithm | ✓ | | |
| 07 | Responsive Design | ✓ | | |
| 08 | Moon Details | | ✓ | |
| 09 | Solunar Details | | ✓ | |
| 10 | Weather Details | | ✓ | |
| 13 | Saved Locations | | ✓ | |
| 15 | Score History | | ✓ | |
| 17 | Share Score | | | ✓ |
| 18 | Location Library | | | ✓ |
| 19 | Notifications | | | ✓ |
| 22 | Premium Model | | | ✓ |

**Total: 13 medium features**

### Large (L) — 6–8 Days

| # | Feature | M1 | M2 | M3 |
|---|---------|----|----|-----|
| 20 | Catch Logging | | | ✓ |
| 21 | Analytics | | | ✓ |

**Total: 2 large features**

---

## Effort Estimate by Milestone

```
Milestone 1 (MVP)          Milestone 2 (Core Value)   Milestone 3 (Engagement)
─────────────────────────  ──────────────────────────  ─────────────────────────
F01: Geolocation      4d   F08: Moon Details      4d   F17: Share Score       5d
F02: Moon Phase       3d   F09: Solunar Details   4d   F18: Location Library   4d
F03: Solunar Tables   5d   F10: Weather Details   4d   F19: Notifications      4d
F04: Weather Data     4d   F11: Score Breakdown   3d   F20: Catch Logging      7d
F05: Scoring Algo     3d   F12: Navigation        3d   F21: Analytics          6d
F06: Home Screen      3d   F13: Saved Locations   4d   F22: Premium Model      4d
F07: Responsive       3d   F14: Preferences       3d   ─────────────────────
                           F15: Score History     5d   Subtotal: 30 days
Subtotal: 25 days         F16: Branding          3d   (6 features)
(7 features)              ─────────────────────
                          Subtotal: 40 days
                          (9 features)

TOTAL: 25 + 40 + 30 = 95 days (~19 weeks with 1 engineer, 2-week sprints)
       (Parallelizable; team of 2–3 engineers = ~7 weeks)
```

---

## Feature Dependencies (Dependency Tree)

```
F01 Geolocation
├── F02 Moon Phase ──┬─→ F08 Moon Details ──┐
│                    └────────────────────────→ F11 Score Breakdown
├── F03 Solunar ─────┬─→ F09 Solunar Details ┤
│                    └────────────────────────→ F11 Score Breakdown
├── F04 Weather ─────┬─→ F10 Weather Details ┤
│                    └────────────────────────→ F11 Score Breakdown
│
└── F13 Saved Locations ──→ F18 Location Library

F05 Scoring Algorithm
├─→ F11 Score Breakdown
├─→ F17 Share Score
└─→ F15 Score History ──→ F21 Analytics

F06 Home Screen ──→ F12 Navigation

F14 Preferences ──→ F19 Notifications

F20 Catch Logging ──→ F21 Analytics

F22 Premium (wraps F13, F15, F20, F21)
```

**Key insight:** F01–F05 are critical path; can parallelize F02–F04 after F01.

---

## Go-to-Market Timeline

```
Week 1–2 (M1 MVP)          Week 3–4 (M2 Core Value)   Week 5–8 (M3 Growth)
────────────────────────   ─────────────────────────   ────────────────────
Launch MVP                 Gather Feedback            Launch Premium
Product Hunt               Feature Blog Posts         Referral Campaign
Reddit/Forums              Email to Early Users       Email Campaign
Fishing Discord            Influencer Outreach       In-App Upsell
Target: 500 installs       Target: 2k users          Target: 10k users

Post-Launch Goals:
┌──────────────────┬──────────────────┬──────────────────┐
│ DAY 1 (M1)       │ DAY 7 (M1)        │ DAY 30 (M2+)     │
├──────────────────┼──────────────────┼──────────────────┤
│ >100 installs    │ >30% return       │ >25% retention   │
│ >90% permission  │ >80% satisfaction │ >10% premium conv│
│ >80% see score   │ >70% detail views │ >20% sharing     │
│ >4.5 stars       │ >50% DAU          │ >10 locations    │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## API Costs & Integrations

```
MILESTONE 1 (MVP)
┌──────────────────────────────────────┐
│ Geolocation API (Browser native)     │ FREE
│ Open-Meteo (Weather + Moon)          │ FREE (10k/day)
│ Nominatim (Reverse Geocoding)        │ FREE (1 req/sec)
│ astronomy-engine (Solunar, local)    │ FREE (npm)
├──────────────────────────────────────┤
│ TOTAL API COST:                      │ $0
└──────────────────────────────────────┘

MILESTONE 2 (M2) — No new APIs required
MILESTONE 3 (M3) — No new APIs required (premium = app revenue, not API cost)

Scale Cost Estimate (100k MAU):
├─ Nominatim overflow → Google Geocoding: ~$200/month
├─ Open-Meteo: FREE (unlimited)
├─ Backend (future): $50–200/month
└─ TOTAL: ~$250–400/month
```

---

## Success Metrics Dashboard

### M1 Success Criteria (Week 2)

| Metric | Target | Status |
|--------|--------|--------|
| App load time | <2s | [ ] Lighthouse |
| Score latency | <5s | [ ] Manual test |
| Geolocation grant rate | >90% | [ ] Analytics |
| Home screen views | >80% | [ ] Analytics |
| Unit test coverage | ≥85% | [ ] Coverage report |
| Console errors | 0 | [ ] QA |
| Mobile responsive | All breakpoints | [ ] Manual test |

**MVP Go/No-Go:** All criteria must pass.

---

### M2 Success Criteria (Week 4)

| Metric | Target | Status |
|--------|--------|--------|
| DAU / MAU ratio | >50% | [ ] Analytics |
| Detail screen views | >70% | [ ] Analytics |
| Session duration | >2 min avg | [ ] Analytics |
| User satisfaction (NPS) | >50 | [ ] Survey |
| Day-2 retention | >30% | [ ] Cohort |
| Saved locations | avg 1.5+ | [ ] Analytics |

**M2 Success:** >50% of metrics achieved; iterate on others.

---

### M3 Success Criteria (Week 8)

| Metric | Target | Status |
|--------|--------|--------|
| Scores shared | >20% daily | [ ] Analytics |
| Power users (10+ locations) | >5% | [ ] Analytics |
| Catch logs created | >30% of users | [ ] Analytics |
| Day-7 retention | >40% | [ ] Cohort |
| Day-30 retention | >25% | [ ] Cohort |
| Premium conversion | 5–10% | [ ] Revenue |

**M3 Success:** Viral coefficient >0.2; retention improving; premium showing traction.

---

## Feature Prioritization (RICE Score)

### MVP (Highest Priority)

```
F01 Geolocation       RICE: 270  ████████████████████████
F02 Moon Phase        RICE: 270  ████████████████████████
F06 Home Screen       RICE: 285  █████████████████████████
F04 Weather           RICE: 180  ██████████████
F07 Responsive        RICE: 190  ███████████████
F03 Solunar           RICE: 160  █████████████
F05 Scoring           RICE: 140  ████████████
```

### M2 (Medium Priority)

```
F11 Score Breakdown   RICE: 95   ████████
F12 Navigation        RICE: 90   ████████
F08 Moon Details      RICE: 85   ███████
F09 Solunar Details   RICE: 85   ███████
F13 Saved Locations   RICE: 75   ██████
F15 Score History     RICE: 70   ██████
F10 Weather Details   RICE: 80   ███████
F14 Preferences       RICE: 65   █████
F16 Branding          RICE: 50   ████
```

### M3 (Lower Priority, High Impact)

```
F17 Share Score       RICE: 80   ███████
F19 Notifications     RICE: 70   ██████
F18 Location Library  RICE: 60   █████
F22 Premium           RICE: 45   ███
F20 Catch Logging     RICE: 40   ███
F21 Analytics         RICE: 30   ██
```

---

## Platform & Tech Stack

```
Frontend
├── Framework: Angular 21 (standalone components, signals, OnPush)
├── Language: TypeScript 5.9+
├── Styling: SCSS (mobile-first, semantic)
├── State: Angular Signals (no external store)
├── Persistence: localStorage + IndexedDB
├── HTTP: @angular/common/http (no external library)
├── Routing: @angular/router (SPA, lazy-load optional)
└── Testing: Jasmine/Karma (unit), Playwright (e2e)

No Backend (MVP)
├── All logic is client-side
├── External APIs: Open-Meteo, Nominatim, astronomy-engine
├── No authentication required for MVP
└── Future: Backend for premium subscriptions, analytics

PWA Capable
├── Service Worker (future, for offline + notifications)
├── Web App Manifest (already in place)
├── Icons & splash screens (Feature 16)
└── Installable on mobile home screen
```

---

## Risk Scorecard

| Risk | Probability | Impact | Mitigation Status |
|------|-------------|--------|-------------------|
| Solunar accuracy | 40% | High | Validate library; early feedback |
| Weather API downtime | 20% | Medium | Cache 2h; show timestamp |
| Geolocation denied | 50% | High | Manual entry fallback |
| Algorithm mismatch | 70% | High | Catch logs (F20); iterate |
| Scope creep | 70% | Medium | Strict M1/M2 scope |

**Highest risk:** Algorithm doesn't match real fishing conditions. **Mitigation:** Collect catch logs early (F20) and iterate weights based on user data.

---

## Team & Capacity

### Recommended Team (for 7-week delivery)

```
Engineers:        2–3 full-time
├── Lead Engineer (F01–F05 core, architecture)
├── Full-Stack Engineer (F06–F15 details + persistence)
└── (Optional 3rd for F17–F22 features)

Product Manager:  1 full-time
├── Requirements gathering
├── Stakeholder alignment
├── User feedback loops
└── Weekly demos

Designer:         1 part-time
├── UI/UX for M1 (home, detail screens)
├── Responsive design validation
└── Accessibility review

QA:               1 part-time
├── Manual testing (mobile, tablet, desktop)
├── E2E test writing (Playwright)
└── Accessibility checks (WCAG AA)
```

### Capacity (2-Engineer Team, 2-Week Sprints)

```
Sprint 1 (M1, Week 1–2):       25 engineer-days ÷ 2 engineers = 1.75 weeks
Sprint 2 (M2 start):           40 engineer-days ÷ 2 engineers = 2.5 weeks
Sprint 3–4 (M2 finish, M3 start): 30 engineer-days ÷ 2 engineers = 1.75 weeks
─────────────────────────────────────────────────────────────────────
Total: 6 weeks (with 2 full-time engineers; 1 week buffer = 7 weeks)
```

---

## Key Decisions & Assumptions

```
Decision                          Rationale
─────────────────────────────────────────────────────────────
Solunar: local calc              No API cost; offline-capable
Weather: Open-Meteo              Free unlimited; moon phase included
Geolocation: browser API         Native; no backend needed
State: Angular Signals           Built-in; no external dependency
Persistence: localStorage + IDB  Simple + scalable
Scoring: transparent algorithm   Users understand the score
MVP: web-only (PWA)              Faster to market than native apps
No authentication (MVP)          Friction reducer; future: cloud sync
Premium: freemium model          5–10% conversion realistic for apps
```

---

## Launch Checklist

### Pre-Launch (End of Week 2 / M1)

- [ ] All M1 features (F01–F07) shipped and tested
- [ ] Unit test coverage ≥85%
- [ ] E2E tests for critical paths (geolocation, score display)
- [ ] Mobile testing: iPhone 12, Pixel 5
- [ ] Performance: load <2s, score <5s
- [ ] Zero console errors
- [ ] Accessibility: WCAG AA (color contrast, tap targets)
- [ ] Privacy policy + terms of service drafted
- [ ] App manifest + icons + splash screen
- [ ] Analytics setup (track permission grant, score views, errors)

### Launch Day (Week 2)

- [ ] Deploy to web
- [ ] Product Hunt post scheduled
- [ ] Reddit post: r/fishing, r/bassfishing, r/carp
- [ ] Discord outreach: fishing communities
- [ ] Twitter/X announcement
- [ ] Email list (if available)
- [ ] Monitor analytics real-time
- [ ] Be ready to hotfix bugs

### Post-Launch (Week 3)

- [ ] Review user feedback (comments, ratings, emails)
- [ ] Analyze DAU, retention, permission grant rate
- [ ] Identify most common issues
- [ ] Plan M2 sprint adjustments
- [ ] Celebrate wins with team

---

## Document Hierarchy

```
CLAUDE.md
├── Project overview, commands, conventions
│
docs/
├── PRODUCT-BRIEF.md
│   └── Executive summary, problem statement, go-to-market
│
├── PRODUCT-ROADMAP.md ← YOU ARE HERE
│   └── Full feature details, dependencies, acceptance criteria
│
├── ROADMAP-QUICK-REFERENCE.md ← QUICK LOOKUP
│   └── Charts, matrices, quick decisions
│
├── ROADMAP-SUMMARY.md
│   └── Text summary of milestones
│
├── FEATURE-REQUIREMENTS.md
│   └── Index of all 22 features
│
├── roadmap/FEATURE-DEPENDENCIES.md
│   └── Dependency graph details
│
├── feature-requirements/
│   ├── feature-01-geolocation.md
│   ├── feature-02-moon-phase.md
│   └── ... (one per feature)
│
└── AGENTS.md
    └── How to use product agents for development
```

---

## Quick Links

| Document | Purpose |
|----------|---------|
| **PRODUCT-ROADMAP.md** | Full details; feature acceptance criteria; risk mitigation |
| **PRODUCT-BRIEF.md** | High-level strategy; competitive analysis; assumptions |
| **ROADMAP-QUICK-REFERENCE.md** | This file; charts, matrices, quick decisions |
| **ROADMAP-SUMMARY.md** | Text summary of milestones and priorities |
| **feature-requirements/** | Individual feature specs (to be created) |
| **AGENTS.md** | Development workflow and agent usage |

---

## Questions for Product Stakeholders

1. **Platform:** Web-only PWA, or plan native iOS/Android apps eventually?
2. **Geographic scope:** US-only or global from day one?
3. **Data collection:** Can we collect anonymized catch data to improve algorithm?
4. **Premium timing:** Start paywalled (M3) or completely free until M3?
5. **Scope:** Does 22-feature roadmap feel right, or cut non-essentials?
6. **Community:** Community features (M4) or focus on core value first?

---

**Quick Reference Version:** 1.0  
**Last Updated:** April 1, 2026  
**For full details, see:** `docs/roadmap/PRODUCT-ROADMAP.md`
