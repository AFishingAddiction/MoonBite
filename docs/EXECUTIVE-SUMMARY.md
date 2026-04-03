# MoonBite — Executive Summary

**A complete product roadmap for a fishing forecast app combining solunar tables, moon phase, weather, and barometric pressure into a single daily "fishing score."**

---

## Product Vision

**MoonBite answers one question: "Should I go fishing today?"**

In 30 seconds, anglers (fishermen) grant location permission, see a single 0–100 fishing score, and know whether conditions are favorable. The score combines:

1. **Moon Phase** — Full/new moon = more active fish
2. **Solunar Peaks** — Peak feeding times (Major/Minor periods)
3. **Weather** — Wind, precipitation, cloud cover
4. **Barometric Pressure** — Rising = good fishing; falling = poor

No confusion. No consulting 5 websites. One score.

---

## Business Model

| Phase | Monetization | Timeline |
|-------|--------------|----------|
| **MVP (M1)** | Free web app (PWA) | Week 2 |
| **Growth (M2–M3)** | Free tier; Premium features unlock at Week 5 | Week 8 |
| **Revenue (M3+)** | Freemium: $2.99–4.99/month for catch logging, analytics | Post-Week 8 |

**Target:** 5–10% premium conversion (realistic for fishing apps); $1–2 ARPU (average revenue per user).

---

## Roadmap at a Glance

### Milestone 1: MVP (Weeks 1–2)
**7 features | 25 engineer-days | Free API cost**

User opens app → grants location → sees fishing score in <30 seconds.

**Features:**
1. Geolocation & Location Display
2. Moon Phase Data
3. Solunar Peak Times
4. Weather Data & Pressure
5. Fishing Score Algorithm (0–100)
6. Home Screen UI
7. Responsive Mobile-First Design

**Success Metrics:**
- >90% geolocation permission grant rate
- >80% of users see score on first load
- <2s app load time
- ≥85% unit test coverage
- Zero console errors

---

### Milestone 2: Core Value (Weeks 3–4)
**9 features | 40 engineer-days | Free API cost**

Users understand *why* the score is what it is. Detailed views for moon, solunar, weather. Score history and preferences.

**Features:**
8. Moon Phase Details Screen
9. Solunar Peak Times Details Screen
10. Weather Details Screen
11. Score Breakdown Infographic
12. Navigation & Routing
13. Saved Locations / Bookmarks
14. User Preferences (units, dark mode, etc.)
15. Daily Score History & Trends
16. Splash Screen & Branding

**Success Metrics:**
- >70% of users view detail screens
- >50% DAU (daily active users)
- >80% user satisfaction (NPS)
- >30% Day-2 retention
- Average 1.5+ saved locations per user

---

### Milestone 3: Engagement & Monetization (Weeks 5–8)
**6 features | 30 engineer-days | Free API cost + app revenue**

Drive daily engagement through sharing, catch logging, and premium features. Enable users to correlate their catches with MoonBite scores.

**Features:**
17. Share Score / Social Cards
18. Location Search & Library
19. Notifications & Alerts
20. Catch Logging & Fishing Journal
21. Analytics Dashboard (correlate catches vs. scores)
22. Premium / Freemium Model

**Success Metrics:**
- >20% of scores shared per day
- >30% of users log at least one catch
- >40% Day-7 retention
- 5–10% premium conversion rate
- >25% Day-30 retention

---

## Key Numbers

| Metric | Target | Notes |
|--------|--------|-------|
| **MVP Launch** | Week 2 | 7 features shipped |
| **Development Team** | 2–3 engineers | 1 PM, 1 designer, 1 QA |
| **API Cost (MVP)** | $0 | All free APIs |
| **API Cost (at 100k MAU)** | <$400/month | Minimal infrastructure cost |
| **First 7 Days** | 500+ installs | Product Hunt + social |
| **Day-2 Retention** | >20% | Before M2 launch |
| **Day-30 Retention** | >25% | Steady-state target |
| **Premium Conversion** | 5–10% | By end of M3 |
| **Total Timeline** | 8 weeks | M1 + M2 + M3 |
| **Total Features** | 22 | Across 3 milestones |

---

## API Dependencies

### Free APIs (No Cost)

| API | Purpose | Free Tier |
|-----|---------|-----------|
| Browser Geolocation | User location | Native browser API |
| Open-Meteo | Weather + moon phase | 10k requests/day |
| Nominatim (OpenStreetMap) | Reverse geocoding | 1 req/sec (fair use) |
| astronomy-engine | Solunar calculation | npm package (local) |

**Total MVP API cost: $0**

### Scale Strategy

If exceeding free tiers:
- **Open-Meteo overflow:** Graceful degradation (cache data, show "last updated")
- **Nominatim overflow:** Switch to Google Geocoding (~$0.005/request)
- **Estimated cost at 100k MAU:** <$400/month

---

## Team & Capacity

### Recommended Team

```
Eng Team:         2–3 full-time engineers
├── Lead Eng:     Architecture, core features (F01–F05)
├── Full-Stack:   Details/persistence (F06–F15)
└── (Optional) 3rd Engineer: Features 17–22

Product:          1 full-time PM
├── Roadmap management
├── Stakeholder alignment
└── User feedback loops

Design:           1 part-time (0.5 FTE)
├── UI/UX validation
├── Responsive design
└── Accessibility

QA:               1 part-time (0.5 FTE)
├── Mobile testing
├── E2E test writing
└── Performance validation
```

### Delivery Timeline

```
Sprint 1 (M1):    Weeks 1–2    → 7 features (25 eng-days ÷ 2 eng = 1.75 weeks)
Sprint 2 (M2a):   Weeks 3–4    → 5 features (20 eng-days ÷ 2 eng = 1.25 weeks)
Sprint 3 (M2b):   Weeks 4      → 4 features (20 eng-days ÷ 2 eng = 1.25 weeks)
Sprint 4 (M3a):   Weeks 5–6    → 3 features (15 eng-days ÷ 2 eng = 1 week)
Sprint 5 (M3b):   Weeks 7–8    → 3 features (15 eng-days ÷ 2 eng = 1 week)
──────────────────────────────────────────────────────────
Total:            8 weeks      → 22 features (with 2 engineers + 1 week buffer)
```

---

## Go-to-Market

### Week 2 (MVP Launch)

**Channels:**
- Product Hunt (top priority)
- Reddit (r/fishing, r/bassfishing, r/carp)
- Fishing Discord communities
- Twitter/X announcement
- Angler Facebook groups

**Goal:** 500+ installs

---

### Week 3–4 (M2 Rollout)

**Channels:**
- Feature blog posts ("Why Solunar Matters", "How to Read Barometric Pressure")
- Email to early users (feature requests, testimonials)
- Influencer outreach (fishing YouTube channels)

**Goal:** 2,000+ total users; >50% DAU

---

### Week 5–8 (M3 Growth)

**Channels:**
- Referral campaign ("Invite a friend, unlock premium month")
- Content marketing (SEO for "fishing forecast app")
- In-app prompts for premium (after 10 catch logs)

**Goal:** 10,000+ users; 5–10% premium conversion

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Solunar accuracy** | 40% | High | Validate astronomy-engine; early feedback |
| **Weather API downtime** | 20% | Medium | Cache 2 hours; show timestamp |
| **Geolocation denied** | 50% | High | Manual location entry fallback |
| **Algorithm mismatch** | 70% | High | Catch logs (F20); iterate weights |
| **Scope creep** | 70% | Medium | Strict M1/M2/M3 scope enforcement |

**Highest risk:** Algorithm doesn't match real fishing. **Mitigation:** Collect catch logs early (Feature 20) and iterate based on user data.

---

## Success Criteria

### MVP (Week 2)
- [ ] All 7 features shipped and tested
- [ ] Unit test coverage ≥85%
- [ ] E2E tests for critical paths
- [ ] Mobile responsive (360px–1200px)
- [ ] <2s app load; <5s score display
- [ ] Zero console errors
- [ ] >90% permission grant rate

### Growth (Week 4)
- [ ] All M2 features shipped
- [ ] >70% of users view detail screens
- [ ] >50% DAU
- [ ] >80% user satisfaction (NPS)
- [ ] >30% Day-2 retention
- [ ] All features at ≥85% unit test coverage

### Engagement (Week 8)
- [ ] All M3 features shipped
- [ ] >20% of scores shared
- [ ] >30% of users log ≥1 catch
- [ ] >40% Day-7 retention
- [ ] 5–10% premium conversion
- [ ] >25% Day-30 retention

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Solunar: Local calculation** | No API cost; offline-capable; deterministic |
| **Weather: Open-Meteo** | Free unlimited; moon phase included; no key |
| **State: Angular Signals** | Built-in; no external dependency |
| **Persistence: localStorage + IndexedDB** | Simple + scalable |
| **Scoring: Transparent algorithm** | Users understand the score; builds trust |
| **MVP: Web-only (PWA)** | Faster to market than native apps |
| **Premium: Freemium model** | 5–10% conversion realistic for apps |

---

## Product Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| **roadmap/PRODUCT-ROADMAP.md** | Full feature details, dependencies, acceptance criteria | Eng, Product |
| **roadmap/ROADMAP-QUICK-REFERENCE.md** | Charts, matrices, quick decisions | Exec, Product |
| **IMPLEMENTATION-GUIDE.md** | Development workflow, testing, deployment | Eng |
| **PRODUCT-BRIEF.md** | Strategy, problem statement, competitive analysis | Exec, Product |
| **feature-requirements/FNN-*.md** | Individual feature specs (to be created) | Eng |
| **AGENTS.md** | Development agent workflow | Eng |
| **CLAUDE.md** | Technical stack, conventions, testing | Eng |

---

## Open Questions for Stakeholders

1. **Platform expansion:** Web-only PWA, or plan native iOS/Android eventually?
2. **Geographic scope:** US-only or global from day one?
3. **Data collection:** Can we collect anonymized catch data to improve algorithm?
4. **Monetization start:** Free MVP (Week 8) or introduce paywall earlier?
5. **Community features:** Build community (M4) or focus on core value first?
6. **International:** Multi-language support from MVP or later?

---

## Quick Start for Developers

**To understand the roadmap:**

1. Read **EXECUTIVE-SUMMARY.md** (this file) — 10 min
2. Review **roadmap/ROADMAP-QUICK-REFERENCE.md** — 15 min (charts, dependencies)
3. Deep dive **roadmap/PRODUCT-ROADMAP.md** — 30 min (full feature details)

**To start development:**

1. Read **IMPLEMENTATION-GUIDE.md** — how to ship features
2. Create feature requirement file: `docs/feature-requirements/feature-01-geolocation.md`
3. Start Feature 01 development (TDD: tests first)

**To track progress:**

1. Check **roadmap/ROADMAP-QUICK-REFERENCE.md** matrix
2. Update feature status (Backlog → In Progress → Done)
3. Weekly demo to stakeholders

---

## Next Steps

### Before Development Starts

- [ ] Stakeholder sign-off on roadmap
- [ ] Team assignments (eng, product, design, qa)
- [ ] Development environment setup
- [ ] Git repository initialized
- [ ] CI/CD pipeline configured

### Week 1 (M1 Kickoff)

- [ ] Create Feature 01–07 requirement files
- [ ] Assign features to engineers
- [ ] Sprint planning (capacity, timeline)
- [ ] Daily standups begin

### Week 2 (M1 Completion)

- [ ] All M1 features shipped
- [ ] QA sign-off on quality gates
- [ ] Launch preparation (Product Hunt, social)

### Week 3 (M2 Kickoff)

- [ ] Post-launch analysis (installs, retention, feedback)
- [ ] Plan M2 adjustments based on feedback
- [ ] Start M2 feature development

---

## Contact & Governance

**Document Owner:** Product Manager  
**Last Updated:** April 1, 2026  
**Version:** 1.0  
**Status:** Ready for Development

**Approval:**
- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Executive Sponsor

---

## Appendix: Feature Inventory (22 Total)

### Milestone 1: MVP (7 features)
1. Geolocation Permission & Display
2. Moon Phase Data Service
3. Solunar Table Data Service
4. Weather Data Service
5. Fishing Score Calculation Engine
6. App Shell & Home Screen
7. Responsive Design & Mobile-First CSS

### Milestone 2: Core Value (9 features)
8. Moon Phase Details Screen
9. Solunar Peak Times Details Screen
10. Weather Details Screen
11. Score Breakdown Explanation
12. Bottom Navigation / Routing
13. Location Bookmarks / Saved Locations
14. User Settings & Preferences
15. Daily Score History & Trends
16. Splash Screen & App Branding

### Milestone 3: Engagement & Monetization (6 features)
17. Share Score / Daily Report
18. Location Search & Library
19. Smart Notifications & Alerts
20. Catch Logging & Fishing Journal
21. Analytics Dashboard for Power Users
22. Premium / Paid Features (Freemium Model)

---

**Thank you for reviewing MoonBite's product roadmap. For questions, see roadmap/PRODUCT-ROADMAP.md or contact the Product Manager.**
