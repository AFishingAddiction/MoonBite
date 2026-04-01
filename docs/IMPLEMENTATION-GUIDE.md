# MoonBite — Implementation Guide

**How to execute the product roadmap: workflow, tools, and best practices.**

---

## Overview

This guide provides engineers and the product team with a repeatable process for shipping features from the roadmap. It covers:

1. Feature development workflow (from requirements to merge)
2. Testing and quality standards
3. Code review and deployment
4. User feedback integration
5. Sprint cadence and team coordination

---

## Feature Development Workflow

### Phase 1: Preparation (1–2 days before sprint starts)

**Owner:** Product Manager + Lead Engineer

#### 1.1 Create Feature Requirement Document

For each feature (e.g., Feature 01 — Geolocation):

Create: `docs/feature-requirements/feature-01-geolocation.md`

**Template:**
```markdown
# Feature 01 — Geolocation Permission & Display

**Status:** Backlog | In Progress | Done  
**Milestone:** M1  
**Complexity:** M  
**Estimated Effort:** 3–4 days  
**Dependencies:** None  
**Owner:** [Engineer Name]  
**Reviewer:** [Lead Engineer]

## User Story

> As a user, I want to grant location permission or enter it manually, so that the app can show me fishing conditions for my area.

## Requirements

### Functional

- Request browser Geolocation API permission on app load
- Display current location (city/state or coordinates)
- Allow manual location entry (city name or lat/lon) if permission denied
- Reverse geocode (lat/lon → city name) using Nominatim API
- Cache location in localStorage for future sessions
- Handle timeout, permission denied, and error states gracefully

### Non-Functional

- **Performance:** Location permission response <5 seconds
- **Reliability:** Fallback to manual entry if API timeout
- **Coverage:** ≥85% unit test coverage
- **Mobile:** Responsive on 360px–1200px widths
- **Accessibility:** WCAG AA (tap targets 44px+, clear labeling)

## Data Structure

```typescript
interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  source: 'geolocation' | 'manual';
  timestamp: Date;
}
```

## Acceptance Criteria

- [ ] Geolocation permission requested on app init
- [ ] Display city/state or coordinates within 5 seconds
- [ ] Manual location entry works (city name or lat/lon)
- [ ] Reverse geocoding functional (lat/lon → city)
- [ ] Location cached in localStorage (`moonbite_location`)
- [ ] Error handling for denied/timeout/invalid input
- [ ] Unit tests: ≥85% coverage
- [ ] E2E test: geolocation flow works
- [ ] Mobile responsive (tested on 360px, 768px, 1200px)
- [ ] No console errors
- [ ] Code review approved

## Technical Notes

### Geolocation API

```typescript
navigator.geolocation.getCurrentPosition(
  (position) => { ... },  // success
  (error) => { ... },     // error
  { timeout: 10000, enableHighAccuracy: false }
);
```

### Nominatim API (Reverse Geocoding)

```
GET https://nominatim.openstreetmap.org/reverse?lat=40.7128&lon=-74.0060&format=json
```

**Important:** Include `User-Agent` header (Nominatim requires it).

### Error Handling

- **PERMISSION_DENIED:** Show manual entry form
- **POSITION_UNAVAILABLE:** Retry or manual entry
- **TIMEOUT:** Fallback after 10 seconds
- **Network error:** Show cached location or manual entry

## Implementation Checklist

- [ ] Create `location.service.ts` with geolocation logic
- [ ] Create `location-permission.component.ts` (request UI)
- [ ] Create `location-display.component.ts` (show location)
- [ ] Create `location.service.spec.ts` with ≥85% coverage
- [ ] Create `location-permission.component.spec.ts`
- [ ] Create `e2e/tests/geolocation.spec.ts`
- [ ] Test on real device (iOS Safari, Android Chrome)
- [ ] Performance test: measure geolocation latency

## References

- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Reverse/)
- [Angular Testing](https://angular.io/guide/testing)
```

#### 1.2 Create Subtasks in Issue Tracker

Break feature into subtasks (optional but recommended):

```
Feature 01 — Geolocation Permission & Display
├─ Subtask 1.1: Implement LocationService (geolocation + cache)
├─ Subtask 1.2: Implement LocationPermissionComponent UI
├─ Subtask 1.3: Implement Nominatim reverse geocoding
├─ Subtask 1.4: Unit tests for LocationService (≥85%)
├─ Subtask 1.5: E2E test (geolocation flow)
├─ Subtask 1.6: Mobile testing and responsive design
└─ Subtask 1.7: Code review + merge
```

#### 1.3 Estimate & Assign

- Review complexity estimate (S/M/L/XL)
- Assign to engineer
- Set deadline (e.g., 3–4 days for Feature 01)
- Add to sprint backlog

---

### Phase 2: Development (Design, Code, Test)

**Owner:** Assigned Engineer

#### 2.1 Setup (1 day)

1. Create feature branch:
   ```bash
   git checkout -b feature/01-geolocation
   ```

2. Create service and component files:
   ```
   src/app/services/location.service.ts
   src/app/services/location.service.spec.ts
   src/app/components/location-permission/location-permission.component.ts
   src/app/components/location-permission/location-permission.component.html
   src/app/components/location-permission/location-permission.component.scss
   src/app/components/location-permission/location-permission.component.spec.ts
   ```

3. Generate using Angular CLI (optional):
   ```bash
   ng generate service services/location
   ng generate component components/location-permission
   ```

#### 2.2 TDD Workflow (Test-Driven Development)

**Important:** Write tests FIRST, then implementation.

**Example: LocationService tests**

```typescript
// src/app/services/location.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationService);
  });

  describe('getCurrentLocation', () => {
    it('should request geolocation permission', (done) => {
      spyOn(navigator.geolocation, 'getCurrentPosition');
      service.getCurrentLocation();
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      done();
    });

    it('should cache location in localStorage', (done) => {
      const mockPosition: GeolocationPosition = {
        coords: { latitude: 40.7128, longitude: -74.0060 } as any
      } as any;
      
      spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((cb) => {
        cb(mockPosition);
      });
      
      service.getCurrentLocation().then(() => {
        const cached = localStorage.getItem('moonbite_location');
        expect(cached).toBeTruthy();
        expect(JSON.parse(cached!).latitude).toBe(40.7128);
        done();
      });
    });

    it('should handle permission denied error', (done) => {
      const error: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied'
      } as any;
      
      spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((_, cb) => {
        cb(error);
      });
      
      service.getCurrentLocation().catch((err) => {
        expect(err.code).toBe(1);
        done();
      });
    });

    it('should timeout after 10 seconds', (done) => {
      jasmine.clock().install();
      spyOn(navigator.geolocation, 'getCurrentPosition');
      
      service.getCurrentLocation();
      jasmine.clock().tick(11000);
      
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.any(Function),
        jasmine.objectContaining({ timeout: 10000 })
      );
      
      jasmine.clock().uninstall();
      done();
    });

    it('should return cached location if available', (done) => {
      const cachedLocation = {
        latitude: 42.3601,
        longitude: -71.0589,
        city: 'Boston'
      };
      localStorage.setItem('moonbite_location', JSON.stringify(cachedLocation));
      
      service.getCachedLocation().then((location) => {
        expect(location.latitude).toBe(42.3601);
        done();
      });
    });
  });

  describe('reverseGeocode', () => {
    it('should fetch city/state from lat/lon', (done) => {
      // Mock HTTP response
      service.reverseGeocode(40.7128, -74.0060).then((result) => {
        expect(result.city).toBeTruthy();
        expect(result.state).toBeTruthy();
        done();
      });
    });
  });
});
```

**Example: LocationService implementation**

```typescript
// src/app/services/location.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  source: 'geolocation' | 'manual';
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly CACHE_KEY = 'moonbite_location';
  private readonly TIMEOUT_MS = 10000;

  getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'geolocation',
            timestamp: new Date()
          };
          
          // Reverse geocode
          this.reverseGeocode(location.latitude, location.longitude)
            .then((geocoded) => {
              location.city = geocoded.city;
              location.state = geocoded.state;
              this.cacheLocation(location);
              resolve(location);
            })
            .catch(() => {
              // Cache without city/state
              this.cacheLocation(location);
              resolve(location);
            });
        },
        (error) => reject(error),
        { timeout: this.TIMEOUT_MS, enableHighAccuracy: false }
      );
    });
  }

  private cacheLocation(location: UserLocation): void {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(location));
  }

  getCachedLocation(): UserLocation | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  }

  private reverseGeocode(lat: number, lon: number): Promise<{
    city: string;
    state: string;
  }> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    return this.http.get<any>(url, {
      headers: { 'User-Agent': 'MoonBite-App' }
    }).toPromise().then((response) => ({
      city: response.address.city || response.address.town || '',
      state: response.address.state || ''
    }));
  }
}
```

#### 2.3 Code Standards

**Angular Conventions:**
- Use standalone components (no NgModules)
- Use `inject()` over constructor injection
- Use `OnPush` change detection for performance
- Use signals for state (`signal()`, `computed()`, `effect()`)
- Avoid `any` types; use strict TypeScript

**Example:**
```typescript
import { Component, inject, signal } from '@angular/core';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-location-permission',
  standalone: true,
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationPermissionComponent {
  private readonly locationService = inject(LocationService);
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  requestPermission() {
    this.isLoading.set(true);
    this.locationService.getCurrentLocation()
      .then(() => this.isLoading.set(false))
      .catch((error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      });
  }
}
```

#### 2.4 Run Tests Constantly

After implementing each method, run tests:

```bash
npm test -- --include='**/location.service.spec.ts'
```

**Target:** ≥85% coverage (statements, branches, functions, lines)

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

#### 2.5 Linting & Formatting

After each file:

```bash
npm run lint -- --fix    # Auto-fix issues
npm run format            # Format with Prettier
```

Fix any remaining lint warnings before commit.

---

### Phase 3: Testing & Review

**Owner:** Assigned Engineer + Reviewers

#### 3.1 Unit Tests

Ensure ≥85% coverage:

```bash
npm run test:coverage
```

Check report: `coverage/index.html`

**Coverage thresholds:**
- Statements: ≥85%
- Branches: ≥85%
- Functions: ≥85%
- Lines: ≥85%

#### 3.2 E2E Tests (Playwright)

Create acceptance test:

```typescript
// e2e/tests/geolocation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Geolocation Flow', () => {
  test('should request permission and display location', async ({ page, context }) => {
    // Mock geolocation
    await context.grantPermissions(['geolocation']);
    
    await page.goto('http://localhost:4202');
    
    // Look for location permission button
    const permissionButton = page.getByRole('button', { name: /grant location/i });
    await expect(permissionButton).toBeVisible();
    
    await permissionButton.click();
    
    // Should show location (city/state)
    const locationDisplay = page.getByText(/boston|new york/i);
    await expect(locationDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should show manual entry fallback if permission denied', async ({ page, context }) => {
    // Deny geolocation permission
    await context.denyPermissions(['geolocation']);
    
    await page.goto('http://localhost:4202');
    
    // Should show fallback UI (manual entry)
    const manualEntryInput = page.getByPlaceholder(/city or coordinates/i);
    await expect(manualEntryInput).toBeVisible({ timeout: 5000 });
  });

  test('should cache location in localStorage', async ({ page }) => {
    await page.goto('http://localhost:4202');
    
    // Get cached location from localStorage
    const cached = await page.evaluate(() => {
      return localStorage.getItem('moonbite_location');
    });
    
    expect(cached).toBeTruthy();
    const location = JSON.parse(cached!);
    expect(location.latitude).toBeGreaterThan(0);
    expect(location.longitude).toBeLessThan(0); // Western hemisphere
  });
});
```

Run E2E tests:
```bash
npm start  # In one terminal
npm run e2e  # In another
npm run e2e:ui  # Interactive mode
```

#### 3.3 Manual Testing (Mobile)

1. **Physical device testing:**
   - iPhone 12 (Safari): test geolocation permission prompt
   - Pixel 5 (Chrome): test Android geolocation
   - Tablet (iPad): test responsive layout

2. **Test scenarios:**
   - ✓ Grant permission: should show location in <5s
   - ✓ Deny permission: should show manual entry
   - ✓ Manual entry: enter "Boston, MA" → show coordinates
   - ✓ Timeout: slow network → show fallback
   - ✓ Cached location: reload app → should show cached location
   - ✓ Dark mode: toggle dark mode → UI readable

3. **Performance check:**
   ```bash
   npm run build
   # Open DevTools → Lighthouse
   # Performance score should be >80
   ```

#### 3.4 Code Review

Create a GitHub / GitLab pull request:

**PR Title:**
```
feat(location): Implement geolocation permission & display [F01]
```

**PR Description:**
```markdown
## Feature 01: Geolocation Permission & Display

### Summary
Implements browser geolocation API with fallback to manual location entry.

### Changes
- LocationService: geolocation + caching + reverse geocoding
- LocationPermissionComponent: request UI
- LocationDisplayComponent: location display
- Unit tests: ≥85% coverage
- E2E tests: geolocation flow

### Testing
- [x] Unit tests passing (85%+ coverage)
- [x] E2E tests passing
- [x] Mobile tested (iPhone 12, Pixel 5)
- [x] No console errors
- [x] Linting passing

### Checklist
- [x] Code follows Angular conventions
- [x] Responsive design (360px+)
- [x] Accessibility (WCAG AA)
- [x] No breaking changes
- [x] Feature requirement met

### Screenshots
[Add before/after if applicable]
```

**Reviewer checklist:**
- [ ] Code follows conventions
- [ ] Tests cover happy path + error cases
- [ ] Coverage ≥85%
- [ ] No console warnings/errors
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] No security issues (e.g., API keys exposed)
- [ ] Documentation updated

**Approval:** Requires 1–2 approvals from lead engineers.

---

### Phase 4: Deployment

**Owner:** Tech Lead + DevOps

#### 4.1 Merge to Main

```bash
# Ensure all checks pass
git checkout feature/01-geolocation
git rebase main
npm test
npm run lint
npm run e2e

# Merge
git checkout main
git merge --no-ff feature/01-geolocation
git push origin main
```

#### 4.2 Deploy to Staging

Deploy to staging environment (same as production, but for internal testing):

```bash
npm run build
# Deploy to staging server
```

QA team performs final smoke test on staging.

#### 4.3 Deploy to Production

```bash
npm run build
# Deploy to production
# Monitor error logs, user feedback
```

#### 4.4 Monitor & Alert

Post-deployment:
- [ ] No spike in error rate
- [ ] API latency normal
- [ ] User feedback positive

---

### Phase 5: Iteration & Learning

**Owner:** Product Manager + Engineers

#### 5.1 Gather Feedback

- User feedback (app store reviews, support emails)
- Crash reports (Sentry, browser error logs)
- Analytics (permission grant rate, location display latency)

#### 5.2 Identify Issues

Common issues for geolocation:
- "Permission denied on iOS" → Add FAQ
- "Location shows incorrect city" → Nominatim accuracy issue
- "Timeout on slow networks" → Increase timeout? Show spinner?

#### 5.3 Plan Improvements

If >10% of users encounter an issue, plan a fix:
- Create new feature/issue
- Add to next sprint
- Fix + re-deploy

---

## Testing Standards

### Unit Test Coverage

**Target:** ≥85% (statements, branches, functions, lines)

**Structure:**
```typescript
describe('ComponentName', () => {
  beforeEach(() => { ... });
  
  describe('method1', () => {
    it('should do X when Y', () => { ... });
    it('should handle error Z', () => { ... });
  });
  
  describe('method2', () => {
    it('should do A when B', () => { ... });
  });
});
```

**Coverage checklist:**
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases (null, empty, boundary values)
- [ ] Async operations (Promises, observables)
- [ ] User interactions (click, input)

### E2E Test Coverage

**Critical paths to test:**
- User grants location → sees score
- User denies location → sees manual entry → enters location
- User navigates between screens
- Score updates when input changes

**Example:**
```typescript
test('should load app, grant location, display score', async ({ page }) => {
  await page.goto('http://localhost:4202');
  
  // Grant geolocation
  const button = page.getByRole('button', { name: /grant/i });
  await button.click();
  
  // Should see score
  const score = page.getByRole('heading', { level: 1 });
  await expect(score).toContainText(/^\d+$/); // Number
});
```

### Performance Testing

**Lighthouse targets:**
- Performance: >80
- Accessibility: >90
- Best Practices: >90

**Manual performance testing:**
```bash
npm run build
# Open http://localhost:4202 with DevTools open
# Lighthouse → Generate report
```

---

## Sprint Cadence

### 2-Week Sprint Schedule (Recommended)

```
Monday
├── Sprint Planning (9 AM, 1 hour)
│   ├── Review completed features
│   ├── Discuss blockers
│   └── Assign features for next 2 weeks
│
├── Standup (10:30 AM, 15 min)
│   ├── What did I do?
│   ├── What will I do?
│   └── Blockers?
│
└── Development (rest of day)

Tuesday–Thursday
├── Daily Standup (10:30 AM, 15 min)
└── Development + Code Review

Friday
├── Demo Day (4 PM, 1 hour)
│   ├── Show completed features
│   ├── Gather feedback
│   └── Celebrate wins
│
└── Retro (5 PM, 30 min)
    ├── What went well?
    ├── What can we improve?
    └── Plan next sprint adjustments

Next Monday
└── Start new 2-week sprint
```

### Milestone Delivery

```
Milestone 1 (MVP):  Weeks 1–2   → 7 features
Milestone 2 (M2):   Weeks 3–4   → 9 features
Milestone 3 (M3):   Weeks 5–8   → 6 features
Total:              8 weeks     → 22 features
```

---

## Collaboration Tools

### Git Workflow

**Branch naming:**
```
feature/NN-slug          # Feature branch
bugfix/issue-description # Bug fix
refactor/what-changed    # Refactoring
```

**Commit messages:**
```
feat(module): Short description [FNN]

Longer description if needed.
Fixes #123
```

**Example:**
```
feat(location): Implement geolocation service [F01]

- Request browser permission
- Fallback to manual entry
- Cache in localStorage
- Reverse geocode with Nominatim

Fixes #42
```

### Communication

- **Daily standup:** Slack or quick sync (15 min)
- **Feature discussions:** GitHub issues + PRs
- **Blockers:** Ping on Slack, unblock quickly
- **Demo day:** Show work, gather feedback
- **Retrospective:** Monthly or after each milestone

### Documentation

- **Feature requirements:** `docs/feature-requirements/feature-NN-*.md`
- **Code comments:** High-level intent, not obvious code
- **README:** `src/app/[module]/README.md` for complex modules
- **Architecture decisions:** ADRs (Architecture Decision Records)

---

## Quality Gates

### Pre-Merge Checklist

Before merging to main:

- [ ] Unit tests passing (npm test)
- [ ] Coverage ≥85% (npm run test:coverage)
- [ ] Linting passing (npm run lint)
- [ ] Formatting correct (npm run format:check)
- [ ] E2E tests passing (npm run e2e)
- [ ] No console errors/warnings
- [ ] Mobile tested (at least one device)
- [ ] Accessibility checked (WCAG AA)
- [ ] Code review approved (1–2 reviewers)
- [ ] Feature requirement met

### Pre-Release Checklist (Per Milestone)

Before launching:

- [ ] All features in milestone shipped
- [ ] No known high-severity bugs
- [ ] Performance acceptable (Lighthouse >80)
- [ ] Security review passed
- [ ] Privacy policy updated
- [ ] Analytics instrumented
- [ ] Runbook / troubleshooting guide created
- [ ] Team trained on deployment process
- [ ] Rollback plan documented

---

## Troubleshooting

### Common Issues

#### 1. Tests Failing Locally but Passing in CI

**Solution:**
```bash
npm ci  # Clean install
npm test  # Run tests
```

#### 2. Coverage Below 85%

**Solution:**
```bash
npm run test:coverage
# Open coverage/index.html
# Identify uncovered lines
# Add tests for those lines
```

#### 3. Geolocation Timeout

**Issue:** Users reporting timeout on slow networks.

**Solution:**
- Increase timeout: `{ timeout: 15000 }` (was 10000)
- Show spinner while waiting
- Cache last known location; show that while loading

#### 4. Nominatim Rate Limit

**Issue:** "Too many requests" errors.

**Solution:**
- Cache reverse geocode results (24 hours)
- Batch requests if possible
- Switch to Google Geocoding API (future)

#### 5. E2E Test Flakiness

**Issue:** Tests fail intermittently.

**Solution:**
- Increase timeout: `{ timeout: 10000 }`
- Wait for element, not time: `await page.waitForSelector('.loaded')`
- Avoid race conditions

---

## Resources

### Documentation

- [Angular Best Practices](https://angular.io/guide/styleguide)
- [Testing Guide](https://angular.io/guide/testing)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Playwright Docs](https://playwright.dev/)

### Libraries & Tools

- **Astronomy-Engine:** [GitHub](https://github.com/cosinekitty/astronomy)
- **Open-Meteo API:** [API Docs](https://open-meteo.com/en/docs)
- **Nominatim API:** [Docs](https://nominatim.org/release-docs/latest/api/Reverse/)

### Team Resources

- Product Roadmap: `docs/PRODUCT-ROADMAP.md`
- Quick Reference: `docs/ROADMAP-QUICK-REFERENCE.md`
- Architecture: `docs/AGENTS.md`
- Project Setup: `CLAUDE.md`

---

## Key Metrics to Track

### Per Feature

- **Development time:** Actual vs. estimate
- **Test coverage:** % statements covered
- **Code review time:** Days in review
- **Bugs found post-merge:** (should be 0)

### Per Milestone

- **Velocity:** Features shipped per week
- **Quality:** % passing quality gates
- **On-time delivery:** % milestones delivered on schedule
- **User satisfaction:** NPS score post-launch

### Continuous

- **App performance:** Load time, API latency
- **Error rate:** Errors per user session
- **User retention:** DAU, Day-7, Day-30
- **Feature adoption:** % users using each feature

---

## Approval & Sign-Off

**This implementation guide is approved by:**

- [ ] Product Manager
- [ ] Lead Engineer
- [ ] Tech Lead
- [ ] QA Lead

---

**Implementation Guide Version:** 1.0  
**Last Updated:** April 1, 2026  
**For questions, contact:** Product Manager or Tech Lead
