# MoonBite Product Roadmap — Executive Summary

**Date:** April 1, 2026  
**Status:** Ready for Development  
**Prepared for:** Product, Engineering, Design, Marketing Leadership

---

## What is MoonBite?

A mobile-first web app that gives anglers a **single daily "fishing score" (0–100)** based on:
- Solunar tables (peak feeding times)
- Moon phase (full/new moon = better fishing)
- Weather forecast (wind, precipitation, pressure)
- Barometric pressure (rising = good; falling = poor)

**Value Prop:** Anglers open the app, see their score, and immediately know whether to go fishing. No guessing, no scrolling through 5 websites.

**Target User:** Casual to serious anglers, ages 25–65, mobile-first decision makers.

---

## Business Model

| Phase | Model | Timeline | Notes |
|-------|-------|----------|-------|
| **MVP + M2** | Free | Weeks 1–4 | Acquire users, validate product-market fit |
| **M3+** | Freemium | Week 5+ | Free tier = daily score; Premium = catch logs + analytics |

**Premium Pricing Target:** $2.99/month (5–10% conversion expected)

---

## Roadmap: Three Milestones, Eight Weeks

```
WEEK 1–2         WEEK 3–4          WEEK 5–8
MVP Launch       Core Value        Growth
───────────      ────────────      ──────────
7 features       9 features        6 features
Score display    Score explained   Sharing,
& location       & saved spots     catch logging,
                                   analytics,
                                   premium
```

### Milestone 1: MVP (Weeks 1–2)

**Goal:** Users see their daily fishing score in <30 seconds.

**Features:** Geolocation, moon phase, solunar tables, weather, scoring algorithm, home screen, responsive design.

**Success Criteria:**
- App loads in <2 seconds
- Score displays in <5 seconds
- 85%+ unit test coverage
- Zero console errors
- Mobile responsive (360px+)

**Cost:** $0/month (all free APIs)

---

### Milestone 2: Core Value (Weeks 3–4)

**Goal:** Users understand *why* the score is what it is and return daily.

**Features:** Detailed screens (moon, solunar, weather), score breakdown, saved locations, user preferences, score history, branding.

**Success Criteria:**
- >50% DAU (daily active users)
- >70% of users view a details page
- >80% user satisfaction (NPS survey)
- Day-7 retention >40%

**Cost:** $0/month (no new APIs)

---

### Milestone 3: Growth & Monetization (Weeks 5–8)

**Goal:** Viral sharing, catch logging, premium features.

**Features:** Share score, location library, notifications, catch logging, analytics dashboard, premium gating.

**Success Criteria:**
- >20% of users share their score daily
- >30% of users log at least one catch
- 5–10% premium conversion rate
- Day-30 retention >25%

**Cost:** ~$100–300/month (premium backend validation, analytics)

---

## Key Numbers

| Metric | Target | Assumption |
|--------|--------|-----------|
| **MVP Load Time** | <2 seconds | Fast enough to use before work/fishing trip |
| **Score Display Time** | <5 seconds | Faster than opening 3+ fishing websites |
| **Test Coverage** | 85%+ | Quality gate for launch |
| **DAU (Week 4)** | >50% of installs | Anglers check every morning |
| **Premium Conversion (Week 8)** | 5–10% | Conservative estimate for fishing apps |
| **Share Rate (Week 8)** | >20% daily | Viral coefficient >0.2 |

---

## Tech Stack (Zero Surprises)

| Layer | Technology |
|-------|-----------|
| **Framework** | Angular 21 (standalone components, signals) |
| **Language** | TypeScript 5.9+ (strict mode) |
| **Styling** | SCSS (mobile-first) |
| **State** | Angular Signals (no external store) |
| **Persistence** | localStorage + IndexedDB (client-side only) |
| **Testing** | Jasmine/Karma (85% threshold) + Playwright (E2E) |
| **APIs** | Open-Meteo (weather), Nominatim (geocoding), astronomy-engine (npm) |

**Backend:** None required for MVP/M2. M3 needs simple backend for premium validation only.

---

## MVP Differentiators

| vs. Solunar.org | vs. Fishbrain | vs. FishAngler |
|-----------------|---------------|---|
| **Mobile-first UX** ✓ | **Simpler interface** ✓ | **Integrated weather** ✓ |
| **Integrated weather** ✓ | **Faster load** ✓ | **Transparent algorithm** ✓ |
| **One actionable score** ✓ | **Cheaper (free)** ✓ | **No social clutter** ✓ |

---

## Cost Analysis

### Development Cost
- **MVP (2 weeks):** 2–3 senior engineers, 1 designer, 1 QA
- **M2 (2 weeks):** Same team
- **M3 (4 weeks):** Add 1 backend engineer (for premium validation)
- **Total:** ~6–8 weeks of team effort

### Operating Cost

| Phase | Hosting | APIs | Backend | Total/Month |
|-------|---------|------|---------|------------|
| **MVP** | $50 (Vercel) | $0 (free) | $0 | **~$50** |
| **M2** | $100 (scale) | $0 (free) | $0 | **~$100** |
| **M3** | $200 | $0–50 | $200 | **~$400–450** |

**Very low burn. Profitable at 500+ monthly active users.**

---

## Competitive Advantages

1. **Transparent Algorithm** — Users understand why they see a score (not a black box)
2. **Simplicity** — One number, not a dashboard
3. **Speed** — <5s from open to decision
4. **Free APIs** — Can offer free tier indefinitely without paying for data
5. **Local Calculation** — Solunar peaks calculated locally (no API latency)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Algorithm doesn't correlate with catches | Medium | Core value fails | Collect catch logs (F20); iterate weights |
| Solunar calculation inaccurate | Low | Users distrust score | Validate against solunar.org before launch |
| Geolocation permission denial | Medium | App unusable | Allow manual entry fallback |
| Weather API downtime | Low | Missing data | Cache 2 hours; show timestamp |
| Users don't return daily | High | Product fails | Notifications + history features in M2 |

**Highest Risk:** Algorithm doesn't match real fishing. **Mitigation:** Collect catch logs in M3 and iterate.

---

## Go-to-Market Strategy

### Acquisition Channels (M1–M2)
1. **Product Hunt** launch (Day 1, Week 2)
2. **Fishing communities** (r/fishing, r/bassfishing, fishing Discord, Facebook groups)
3. **Fishing influencers** (YouTube channels, TikTok, Instagram)
4. **SEO** (keywords: "fishing forecast app", "solunar table app")

### Retention Levers (M2)
- Push notifications (great fishing day alert)
- Catch logging (builds personal data, stickiness)
- History & trends (users see patterns, trust grows)
- Referral incentives (early M3)

### Monetization Levers (M3)
- In-app prompt: "Unlock advanced insights with Premium"
- Email campaigns to active users
- Paywall on catch logging & analytics

**Realistic ARR by end of Year 1:** $30K–100K (500–1000 paying users at $2.99/month + ads later)

---

## Success Metrics (Dashboard)

Track these weekly:

### Acquisition
- Installs (cumulative)
- Install source (Product Hunt, organic, paid, etc.)

### Activation
- Geolocation permission grant rate (target: >90%)
- App store rating (target: 4.5+ stars)

### Engagement
- DAU / MAU ratio (target: >50%)
- Average session length (target: >2 min)
- Details page views (target: >70% of DAU)

### Retention
- Day-7 retention (target: >40%)
- Day-30 retention (target: >25%)
- Repeat usage frequency (target: 5+ sessions/week for active users)

### Revenue (M3+)
- Premium signups
- Conversion rate (target: 5–10%)
- ARPU (target: $1–2/month)
- LTV / CAC ratio (target: >3x)

---

## Decision Checkpoints

### Week 2 (Post-MVP)
**Decision:** Is the algorithm "reasonable"? Do users find value?
- If YES → Proceed to M2
- If NO → Iterate scoring weights, gather feedback

### Week 4 (Post-M2)
**Decision:** Are users returning daily? Is DAU >50%?
- If YES → Proceed to M3 growth features
- If NO → Extend M2, focus on retention

### Week 8 (Post-M3)
**Decision:** Is product-market fit validated? Can we build a sustainable business?
- If YES → Scale (more marketing, team expansion)
- If NO → Pivot or sunset

---

## Key Decisions Made (No Debates Needed)

1. **Solunar: Local calculation (astronomy-engine) vs. API** → Local (faster, cheaper, no limits)
2. **Weather: Open-Meteo vs. OpenWeatherMap** → Open-Meteo (free, no key)
3. **Persistence: Client-side only for MVP** → Yes (no backend overhead)
4. **Scoring: Transparent weights vs. ML** → Transparent (must explain to users)
5. **Platform: Web (PWA) vs. native apps first** → Web first (faster iteration)

---

## What We're NOT Doing

❌ User accounts / cloud sync (MVP)  
❌ Native iOS/Android apps (MVP)  
❌ Advanced ML scoring (before catch logs)  
❌ Ads (until sustainable DAU)  
❌ Community features (after M3)  
❌ International languages (v2)  

**Focus:** Ship MVP fast, validate, iterate.

---

## Team Composition

### MVP (Weeks 1–2)
- 2 senior frontend engineers (Angular + TS)
- 1 designer (mobile UX)
- 1 QA engineer (Jasmine + Playwright)
- 1 product manager (full-time)

### M2 (Weeks 3–4)
- Same 4-person team

### M3 (Weeks 5–8)
- +1 backend engineer (for premium validation)
- +1 product marketer (for growth channels)

**Total effort:** ~8 weeks of core team + 4 weeks of expanded team

---

## Budget Estimate

| Category | 8 Weeks | Note |
|----------|---------|------|
| **Team** | $80–120K | 4 people × 2 weeks full-time |
| **Hosting** | $1.2K | Vercel/Firebase, ~$150/month |
| **Tools** | $1–2K | GitHub, monitoring, design tools |
| **Marketing** | $2–5K | Product Hunt launch, influencer outreach |
| **Contingency** | $5K | Buffer for scope creep |
| **Total** | **~$90–135K** | |

**ROI:** Break-even at ~500 paying users ($2.99/month) + ads = Year 1 profitable.

---

## Next Steps

1. **Week 1 (This week):**
   - [ ] Approve roadmap and budget
   - [ ] Assign Feature 01 to lead developer
   - [ ] Lock API choices (Open-Meteo, Nominatim, astronomy-engine)
   - [ ] Set up CI/CD pipeline

2. **Week 2:**
   - [ ] MVP ready for public launch
   - [ ] Product Hunt submission + community prep

3. **Week 3:**
   - [ ] Gather first-week feedback
   - [ ] Adjust scoring algorithm if needed
   - [ ] Begin M2 feature work

4. **Week 4:**
   - [ ] M2 launch
   - [ ] Analytics review: DAU, retention, user feedback

5. **Week 5+:**
   - [ ] M3 roadmap refinement based on M2 learnings
   - [ ] Premium feature prioritization

---

## Questions for Leadership

1. **Platform:** Web-only for MVP, or plan for native iOS/Android apps now?
2. **Monetization:** Free-first (grow users, monetize later) or start with free tier + premium?
3. **Geographic Focus:** US-only launch, or global from day one?
4. **Data Collection:** Can we collect anonymized catch data to improve the algorithm?
5. **Scope:** Does this 22-feature roadmap feel right, or should we cut/defer features?
6. **Timeline:** Can we commit to shipping MVP in Week 2? (This is aggressive but doable.)

---

## Summary

**MoonBite is a high-potential, low-risk product:**
- Clear value prop (one score, no guessing)
- Large addressable market (40M+ recreational anglers in US alone)
- Low operating cost (<$500/month even at scale)
- Freemium monetization (proven model in fishing apps)
- Fast MVP timeline (2 weeks to first users)

**Success factors:**
1. Ship MVP on time (Week 2)
2. Iterate algorithm based on user feedback
3. Build in catch logging (M3) to enable data-driven improvement
4. Grow through sharing + influencer partnerships

**Bottom line:** This is a product we can build, launch, and scale with a lean team. High confidence in market opportunity and technical feasibility.

---

## Appendix: Full Feature List

| # | Feature | Milestone | Complexity |
|---|---------|-----------|-----------|
| 01 | Geolocation | M1 | M |
| 02 | Moon Phase | M1 | S |
| 03 | Solunar Tables | M1 | M |
| 04 | Weather | M1 | M |
| 05 | Scoring Algorithm | M1 | M |
| 06 | Home Screen | M1 | S |
| 07 | Responsive Design | M1 | M |
| 08 | Moon Details | M2 | M |
| 09 | Solunar Details | M2 | M |
| 10 | Weather Details | M2 | M |
| 11 | Score Breakdown | M2 | S |
| 12 | Navigation | M2 | S |
| 13 | Saved Locations | M2 | M |
| 14 | Preferences | M2 | S |
| 15 | History | M2 | M |
| 16 | Branding | M2 | S |
| 17 | Share Score | M3 | M |
| 18 | Location Library | M3 | M |
| 19 | Notifications | M3 | M |
| 20 | Catch Logging | M3 | L |
| 21 | Analytics | M3 | L |
| 22 | Premium / Paywall | M3 | M |

See **[docs/roadmap/ROADMAP.md](ROADMAP.md)** for detailed descriptions.

---

**Prepared by:** Product Management  
**Date:** April 1, 2026  
**Status:** Ready for Approval & Execution

**Contact:** [Product Manager Name]
