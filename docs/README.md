# MoonBite Documentation

Welcome to MoonBite! This folder contains product planning, feature roadmaps, and development guidance.

---

## Quick Start

**New to the project?** Start here:

1. **[GETTING-STARTED-PRODUCT.md](GETTING-STARTED-PRODUCT.md)** — 5-min overview of what MoonBite is and where to find information
2. **[PRODUCT-BRIEF.md](PRODUCT-BRIEF.md)** — Strategic vision, value prop, and success metrics
3. **[ROADMAP-SUMMARY.md](ROADMAP-SUMMARY.md)** — Quick reference: 22 features, 3 milestones, 8 weeks

---

## Documentation Index

### Product Strategy
| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| **[PRODUCT-BRIEF.md](PRODUCT-BRIEF.md)** | Strategic vision, user stories, success metrics, go-to-market | Product, Exec, Marketing | 10 min |
| **[ROADMAP.md](ROADMAP.md)** | Detailed 22-feature roadmap with APIs, complexity, dependencies | Everyone | 20 min |
| **[ROADMAP-SUMMARY.md](ROADMAP-SUMMARY.md)** | Quick reference: timeline, features, decisions, metrics | Everyone | 5 min |

### Development Guidance
| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| **[GETTING-STARTED-PRODUCT.md](GETTING-STARTED-PRODUCT.md)** | How to navigate docs, common questions, development workflow | Developers, Designers, QA | 5 min |
| **[FEATURE-DEPENDENCIES.md](FEATURE-DEPENDENCIES.md)** | Build order, parallelization, critical path, testing strategy | Tech Lead, Eng Manager | 10 min |
| **[FEATURE-REQUIREMENTS.md](FEATURE-REQUIREMENTS.md)** | Index of all 22 features and acceptance criteria | Product, Dev | 2 min |
| **[AGENTS.md](AGENTS.md)** | How to compose agent workflows for planning and development | Dev, Product | 10 min |

### Project Setup
| Document | Purpose |
|----------|---------|
| **[../CLAUDE.md](../CLAUDE.md)** | Tech stack, conventions, testing, development commands |

---

## MoonBite at a Glance

**What it does:** Gives anglers a single daily "fishing score" (0–100) based on solunar tables, moon phase, weather, and barometric pressure.

**Value Prop:** "Stop guessing. Know exactly how good fishing is today — in seconds."

**MVP Timeline:** 2 weeks → 7 core features → users see their score in <30 seconds

**Full Product Timeline:** 8 weeks → 22 features across 3 milestones → ecosystem with sharing, catch logging, analytics

---

## Navigation by Role

### Product Manager
1. Read **[PRODUCT-BRIEF.md](PRODUCT-BRIEF.md)** (strategy, metrics, risks)
2. Skim **[ROADMAP.md](ROADMAP.md)** (feature descriptions, business impact)
3. Reference **[ROADMAP-SUMMARY.md](ROADMAP-SUMMARY.md)** (quick facts)

### Engineering Lead / Tech Lead
1. Read **[CLAUDE.md](../CLAUDE.md)** (tech stack, conventions)
2. Read **[FEATURE-DEPENDENCIES.md](FEATURE-DEPENDENCIES.md)** (build order, critical path)
3. Skim **[ROADMAP.md](ROADMAP.md)** (APIs, component architecture, complexity)

### Developer
1. Read **[GETTING-STARTED-PRODUCT.md](GETTING-STARTED-PRODUCT.md)** (workflow, common questions)
2. Reference **[ROADMAP.md](ROADMAP.md)** for your feature (description, APIs, component structure)
3. Create a feature doc in `feature-requirements/feature-NN-<slug>.md` (use example as template)

### Designer
1. Read **[PRODUCT-BRIEF.md](PRODUCT-BRIEF.md)** "User Stories" section
2. Skim **[ROADMAP-SUMMARY.md](ROADMAP-SUMMARY.md)** for context
3. Reference **[ROADMAP.md](ROADMAP.md)** for UI descriptions of each feature

### QA / Test Engineer
1. Read **[CLAUDE.md](../CLAUDE.md)** (testing conventions: Jasmine, Playwright)
2. Read **[FEATURE-DEPENDENCIES.md](FEATURE-DEPENDENCIES.md)** (testing strategy per feature)
3. Reference **[ROADMAP.md](ROADMAP.md)** for acceptance criteria

### Marketing / Growth
1. Read **[PRODUCT-BRIEF.md](PRODUCT-BRIEF.md)** (value prop, competitive positioning, GTM)
2. Skim **[ROADMAP-SUMMARY.md](ROADMAP-SUMMARY.md)** (timeline, monetization strategy)
3. Focus on Milestone 3 features (sharing, notifications, premium)

---

## Feature Roadmap at a Glance

### Milestone 1: MVP (Weeks 1–2)
**Goal:** Users open app → grant location → see fishing score in <30 seconds

**Features (F01–F07):**
- Geolocation permission & display
- Moon phase data
- Solunar peak times
- Weather forecast
- Fishing score calculation
- Home screen
- Responsive mobile design

**Success Metric:** <2s load time, >85% unit test coverage

### Milestone 2: Core Value (Weeks 3–4)
**Goal:** Users understand *why* the score is what it is; return daily

**Features (F08–F16):**
- Detailed screens (moon, solunar, weather)
- Score breakdown explanation
- Navigation / routing
- Saved locations (bookmarks)
- User preferences
- Score history & trends
- Branding / splash screen

**Success Metric:** >70% DAU, >80% user satisfaction, 50%+ of users view details

### Milestone 3: Growth & Monetization (Weeks 5–8)
**Goal:** Viral sharing, catch logging, premium features

**Features (F17–F22):**
- Share score / daily report
- Location library & search
- Smart notifications
- Catch logging & fishing journal
- Analytics dashboard
- Premium / paid features

**Success Metric:** >20% share rate, 5–10% premium conversion

---

## Key External APIs (MVP)

| API | Purpose | Cost | Key Link |
|-----|---------|------|----------|
| **Open-Meteo** | Weather + moon phase | Free | https://open-meteo.com |
| **Nominatim** (OSM) | Reverse geocoding | Free | https://nominatim.openstreetmap.org |
| **astronomy-engine** (npm) | Solunar calculation | Free | https://github.com/cosinekitty/astronomy |

**Total MVP API cost: $0/month** (all free with fair-use limits)

---

## Development Commands

```bash
npm start              # Start dev server (localhost:4202)
npm test               # Run unit tests
npm run test:coverage  # Unit tests with coverage report
npm run lint           # Check code style
npm run e2e            # Run Playwright E2E tests
npm run e2e:ui         # Playwright UI mode (interactive)
npm run build          # Production build
npm run format         # Format code with Prettier
```

---

## Standards & Conventions

### Code Quality
- **Language:** TypeScript 5.9+ (strict mode, no `any`)
- **Framework:** Angular 21 (standalone components, signals, OnPush)
- **Testing:** 85% coverage threshold (Jasmine/Karma + Playwright)
- **Linting:** ESLint + angular-eslint + Prettier

### TDD Workflow
1. Write failing unit tests (Jasmine)
2. Write failing E2E tests (Playwright)
3. Implement feature (make tests pass)
4. Refactor (maintain >85% coverage)

### Feature Documentation
Each feature gets a file in `feature-requirements/feature-NN-<slug>.md` with:
- Overview & user story
- Acceptance criteria (checkbox list)
- Implementation notes

---

## Success Metrics

### Week 2 (MVP Launch)
- [ ] All 7 features shipped
- [ ] <2s load time
- [ ] >85% test coverage
- [ ] Zero console errors

### Week 4 (M2 Launch)
- [ ] >50% DAU
- [ ] >70% users view details page
- [ ] >80% user satisfaction (NPS)

### Week 8 (M3 Launch)
- [ ] >20% share rate
- [ ] 5–10% premium conversion

---

## Common Questions

**Q: Why no backend for MVP?**  
A: To move fast. Everything is client-side (localStorage, IndexedDB). Backend only for premium validation (M3).

**Q: Why astronomy-engine instead of a solunar API?**  
A: Free, open-source, deterministic, no latency or rate limits. Validates locally, works offline.

**Q: Can I build features out of order?**  
A: Check [FEATURE-DEPENDENCIES.md](FEATURE-DEPENDENCIES.md) for build order. Some features block others; parallel work is possible.

**Q: What if the score doesn't match real fishing?**  
A: Expected. We iterate based on catch logs (Feature 20, Milestone 3). Start with conservative weights.

**Q: How do we make money?**  
A: Freemium model (Feature 22). Free tier = daily score; Premium = catch logging, analytics, unlimited locations.

---

## Contacts & Support

| Area | Contact |
|------|---------|
| Product questions | Product Manager |
| Technical decisions | Tech Lead / Angular Architect |
| API integration issues | API Designer / Backend Eng |
| Testing strategy | QA Lead |
| Build / deployment | DevOps |

---

## Document Versions

| Document | Version | Last Updated |
|----------|---------|--------------|
| PRODUCT-BRIEF.md | 1.0 | April 1, 2026 |
| ROADMAP.md | 1.0 | April 1, 2026 |
| ROADMAP-SUMMARY.md | 1.0 | April 1, 2026 |
| FEATURE-DEPENDENCIES.md | 1.0 | April 1, 2026 |
| GETTING-STARTED-PRODUCT.md | 1.0 | April 1, 2026 |
| FEATURE-REQUIREMENTS.md | 1.0 | April 1, 2026 |

---

## Next Steps

1. **Approve this roadmap** with stakeholders
2. **Create individual feature docs** in `feature-requirements/` for F01–F22 (use example as template)
3. **Assign Feature 01** to lead developer; start with test-first approach
4. **Review weekly** to track progress and unblock dependencies
5. **Gather user feedback** after MVP launch (Week 2)

---

**Status:** Ready for Development  
**Created:** April 1, 2026  
**Version:** 1.0

For questions or updates, reach out to the product team.
