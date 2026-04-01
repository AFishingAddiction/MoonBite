# MoonBite — Product Planning Quick Start

Welcome to MoonBite! This guide helps you navigate the product planning documents and understand what we're building.

---

## What is MoonBite?

A simple, mobile-first web app that tells anglers how good fishing is today (0–100 score) based on:
1. Moon phase
2. Solunar tables (peak feeding times)
3. Weather forecast
4. Barometric pressure

**Value Prop:** Anglers open the app, see their score in <30 seconds, and know whether to go fishing. Done.

---

## Where to Start

### For Product Managers & Stakeholders
1. **Read first:** [`docs/PRODUCT-BRIEF.md`](PRODUCT-BRIEF.md) (5 min read)
   - Overview of what we're building and why
   - User stories and success metrics
   - Competitive landscape and go-to-market

2. **Skim second:** [`docs/ROADMAP-SUMMARY.md`](ROADMAP-SUMMARY.md) (3 min)
   - High-level timeline (3 milestones over 8 weeks)
   - Features by milestone
   - Quick reference tables

3. **Deep dive:** [`docs/ROADMAP.md`](ROADMAP.md) (20 min)
   - All 22 features with detailed descriptions
   - Data sources and API recommendations
   - Technical decisions and risk mitigation

### For Engineers
1. **Read first:** [`CLAUDE.md`](../CLAUDE.md) (5 min)
   - Tech stack (Angular 21, TypeScript, signals, testing approach)
   - Project structure and conventions
   - Development commands

2. **Skim second:** [`docs/PRODUCT-BRIEF.md`](PRODUCT-BRIEF.md) "Technical Architecture" section (3 min)
   - Frontend stack overview
   - External APIs needed (free tier details)
   - Persistence strategy

3. **Reference:** [`docs/ROADMAP.md`](ROADMAP.md) Feature sections for:
   - Data sources and API endpoints
   - Component structure recommendations
   - Complexity estimates and dependencies

### For Designers
1. **Read first:** [`docs/PRODUCT-BRIEF.md`](PRODUCT-BRIEF.md) "User Stories" section (5 min)
   - Primary, secondary, and tertiary user journeys
   - MVP scope (what the user sees immediately)

2. **Skim second:** [`CLAUDE.md`](../CLAUDE.md) (2 min)
   - Target breakpoints (mobile-first: 360px+)
   - Styling approach (SCSS, semantic naming)
   - Design system guidelines (if needed)

3. **Reference:** [`docs/ROADMAP.md`](ROADMAP.md) for:
   - Component breakdown for each feature
   - UI descriptions (e.g., "large card with score and summary")

### For QA / Test Engineers
1. **Read first:** [`CLAUDE.md`](../CLAUDE.md) "Testing conventions" (3 min)
   - Unit tests: 85% coverage threshold, Jasmine/Karma
   - E2E tests: Playwright, page object models, accessible selectors

2. **Reference:** Each feature in [`docs/ROADMAP.md`](ROADMAP.md) for:
   - Acceptance criteria (to become feature requirement docs)
   - Dependencies (test order)
   - Data sources (mock data strategy)

---

## Document Map

```
docs/
├── PRODUCT-BRIEF.md           ← Strategic overview, value prop, success metrics
├── ROADMAP.md                  ← Detailed 22-feature roadmap with APIs & complexity
├── ROADMAP-SUMMARY.md          ← Quick reference (timeline, metrics, decisions)
├── FEATURE-REQUIREMENTS.md     ← Index of all features + status
├── feature-requirements/       ← Individual feature docs (to be created)
│   ├── feature-01-geolocation.md
│   ├── feature-02-moon-phase.md
│   ├── ... (features 03–22)
│   └── feature-22-premium.md
├── AGENTS.md                   ← Workflow guide for agents
└── GETTING-STARTED-PRODUCT.md  ← This file
```

---

## How We're Organized

### Three Milestones, Eight Weeks

| Milestone | Weeks | Focus | Ship Date |
|-----------|-------|-------|-----------|
| **MVP** | 1–2 | Get a score displayed (F01–F07) | Week 2 |
| **Core Value** | 3–4 | Show why the score is what it is (F08–F16) | Week 4 |
| **Growth** | 5–8 | Share, engage, monetize (F17–F22) | Week 8 |

### Key Decisions Made

- **Solunar calculation:** Use astronomy-engine (npm) locally, not an API
- **Weather provider:** Open-Meteo (free, no API key)
- **Persistence:** localStorage for settings; IndexedDB for history
- **Scoring algorithm:** Simple, transparent weighting (not ML)
- **No backend required for MVP** — everything is client-side

---

## Common Questions

### Q: Why is Milestone 1 (MVP) only 7 features?
**A:** We want users to get *immediate* value: open app → see score in <30 seconds. Details and history come after we validate the core value prop (M2).

### Q: Why include 22 features in the roadmap if we're only shipping 7 first?
**A:** To show the product vision and growth path. Teams work better when they understand where we're going long-term. We prioritize ruthlessly for each milestone.

### Q: Why not use a solunar API instead of calculating locally?
**A:** We avoid API calls for core calculations. astronomy-engine is free, open-source, and deterministic. No latency, no rate limits, works offline eventually.

### Q: How much does the MVP cost to operate?
**A:** Nearly $0/month (free APIs: Open-Meteo, Nominatim). Hosting cost depends on server (Firebase, Vercel, etc.). No backend until monetization (M3).

### Q: When do we get a backend?
**A:** Not until M3, and only if we need:
- Premium subscription validation
- User accounts / cloud sync
- Analytics and reporting

For MVP and M2, everything is client-side.

### Q: What's the primary metric we're optimizing for?
**A:** **DAU (daily active users) ≥50% of installs by Week 4 (M2 end).** If anglers don't return daily, the product fails.

### Q: What if the score doesn't match real fishing conditions?
**A:** Expected. We collect catch logs (Feature 20, M3) and iterate the algorithm based on real user data. Start with conservative weights, then improve.

---

## For First-Time Feature Development

### Workflow

1. **Read the feature description** in `docs/ROADMAP.md`
2. **Create a feature requirement doc** in `docs/feature-requirements/feature-NN-<slug>.md` (use the example as a template)
3. **Write failing Jasmine unit tests** (test-first; red phase)
4. **Write failing Playwright E2E tests** (red phase)
5. **Implement the feature** (green phase; make tests pass)
6. **Refactor** (blue phase; maintain >85% coverage)
7. **Code review** before merge

### Example: Feature 02 (Moon Phase)

1. **Feature doc** (already in roadmap; create `feature-02-moon-phase.md`)
   - User story: "As an angler, I want to see the current moon phase so I can understand its impact on fishing."
   - Acceptance criteria:
     - [ ] App fetches moon phase from Open-Meteo API
     - [ ] Display shows phase name (e.g., "Waxing Crescent") and percentage illuminated
     - [ ] Lunar icon (🌙, 🌓, 🌕, etc.) corresponds to phase
     - [ ] No console errors
     - [ ] 85%+ unit test coverage

2. **Unit tests** (`moon-phase.service.spec.ts`)
   - Mock HTTP with `provideHttpClientTesting()`
   - Test parsing of API response
   - Test edge cases (new moon, full moon)

3. **E2E tests** (`e2e/tests/moon-phase.spec.ts`)
   - Test full user flow: load app → see moon phase display

4. **Implementation** (`moon-phase.service.ts`, `moon-phase-display.component.ts`)
   - Service: fetch from Open-Meteo, transform to readable format
   - Component: display phase name + icon

---

## Key Resources

### External APIs (with free tiers)
- **Open-Meteo:** https://open-meteo.com (weather + moon phase)
- **Nominatim:** https://nominatim.openstreetmap.org (reverse geocoding)
- **astronomy-engine:** https://github.com/cosinekitty/astronomy (npm package)

### Angular Documentation
- Signals: https://angular.io/guide/signals
- Standalone Components: https://angular.io/guide/standalone-components
- Routing: https://angular.io/guide/routing

### Testing
- Jasmine: https://jasmine.github.io/
- Karma: https://karma-runner.github.io/
- Playwright: https://playwright.dev/

### TypeScript
- Strict Mode: https://www.typescriptlang.org/tsconfig#strict

---

## Development Commands

```bash
# Start dev server (http://localhost:4202)
npm start

# Run unit tests
npm test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (requires server running)
npm run e2e

# Lint code
npm run lint

# Format code
npm run format

# Production build
npm run build
```

---

## Success Checklist for MVP (Week 2)

- [ ] All 7 MVP features (F01–F07) implemented
- [ ] >85% unit test coverage across all features
- [ ] Playwright E2E tests for critical paths (grant permission, display score)
- [ ] App loads in <2 seconds
- [ ] Score displays in <5 seconds of geolocation
- [ ] Mobile responsive (tested on 360px, 768px, 1024px)
- [ ] Zero console errors in QA
- [ ] Ready for Product Hunt launch

---

## Who to Ask

| Question | Contact |
|----------|---------|
| Feature scope or product direction | Product Manager |
| Technical architecture or dependency conflict | Engineering Lead / Angular Architect |
| API integration approach | API Designer / Backend Engineer |
| Testing strategy or coverage gaps | QA Lead |
| Design or UX questions | UI/UX Designer |
| Build or deployment issues | DevOps / Build Engineer |

---

## Tips for Success

1. **Read the full ROADMAP.md once.** It's long but comprehensive. You'll make better decisions if you understand the full product vision.

2. **Write tests first.** Feature 01 (geolocation) is a good one to start with — straightforward and no external API complexity.

3. **Validate APIs early.** Test Open-Meteo and Nominatim endpoints manually with curl/Postman before writing code.

4. **Communicate blockers.** If an API is down or astronomy-engine has a bug, flag it immediately so we can adjust.

5. **Iterate on the score algorithm.** It won't be perfect on day one. We'll refine it based on feedback and catch logs (M3).

6. **Mobile-first always.** Test on real phones or Chrome DevTools (360px width) as you build.

---

## Next Steps

1. **Week 1:** Feature 01 (geolocation) → ready for Feature 02
2. **Week 1:** Feature 03 (solunar) & Feature 04 (weather) in parallel (independent)
3. **Week 1.5:** Feature 05 (scoring algorithm) once F02–F04 are ready
4. **Week 1.5:** Feature 06 (home screen) + Feature 07 (design) in parallel
5. **Week 2:** MVP launch (all 7 features complete)

---

**Questions?** Reach out to the product team.

**Last Updated:** April 1, 2026  
**Version:** 1.0
