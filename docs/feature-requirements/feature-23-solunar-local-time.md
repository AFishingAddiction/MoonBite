# Feature 19 — Solunar Peak Times in Local Time

**Status:** Complete

**Owned by:** Product Manager (timing & UX), Engineering (service implementation)

---

## Overview

Display solunar peak times (major transits, minor rise/set windows) in the local solar time of the selected location, replacing hardcoded UTC labels with dynamically calculated UTC offset indicators. This improves usability by showing times in the timezone where the fishing location actually is, without requiring external geolocation APIs.

---

## User Stories

### Story 1: View solunar times in local solar time
> As a **fisher in California,**
> I want solunar peak times to display in **local solar time** rather than UTC,
> so that I can easily correlate peak times with my local clock and plan my fishing trips.

**Acceptance:**
- Solunar peak times shown in user's 12-hour or 24-hour preference format
- UTC offset calculated from location's longitude (Longitude / 15 hours)
- Offset label displayed (e.g., "UTC−7" or "UTC+5:30") below each time
- Offset matches astronomical Local Mean Solar Time (LMT), not political timezone

### Story 2: Solunar details screen shows local times
> As a **fisher reviewing detailed solunar information,**
> I want all four major/minor solunar periods to display in local solar time with clear offset indicators,
> so that I understand which times apply to my location without mental conversion.

**Acceptance:**
- SolunarDetailsComponent applies local time transformation to all four events
- Each time shows calculated UTC offset (e.g., "4:15 AM UTC−5")
- Times remain sortable and comparable visually

### Story 3: Solunar summary card shows local times
> As a **fisher looking at the home screen solunar card,**
> I want next peak time to display in local solar time with offset indicator,
> so that I get actionable local time information at a glance.

**Acceptance:**
- SolunarDisplayComponent shows next peak in local time
- Offset label appears (e.g., "in 2 hrs at 5:30 AM UTC−5")
- Falls back to UTC if location data unavailable

---

## UI Specification

### SolunarDetailsComponent changes
- **Current:** Shows times with hardcoded "UTC" label (e.g., "4:15 AM UTC")
- **New:** Shows times with calculated offset label (e.g., "4:15 AM UTC−5" or "4:15 AM UTC+5:30")
  - Major transit periods: "Major Transit 1 — 4:15 AM UTC−5"
  - Minor rise/set windows: "Minor Rise — 7:45 AM UTC−5"
- **Layout:** No significant changes; offset label replaces "UTC" text
- **Accessibility:** ARIA labels clarify offset meaning (e.g., "4:15 AM, UTC offset minus 5 hours")

### SolunarDisplayComponent changes
- **Current:** Shows next peak with "UTC" suffix (e.g., "5:30 AM UTC")
- **New:** Shows next peak with calculated offset (e.g., "5:30 AM UTC−5")
- **Layout:** No change to card layout; offset label replaces "UTC"
- **Responsive:** Offset formatting adapts to 12h/24h user preference

### Time Format Rules
- **UTC offset display format:**
  - Positive offset: `UTC+N` (e.g., UTC+5, UTC+5:30)
  - Negative offset: `UTC−N` (e.g., UTC−5, UTC−5:30, using Unicode minus U+2212)
  - Zero offset: `UTC+0`
- **Time format:** Respects user's 12-hour/24-hour preference (from PreferencesService)
- **Decimal offset handling:** Display rounded to nearest 15-minute interval (0.25 hour increments)

---

## Architecture & Implementation

### PreferencesService Enhancement
**File:** `src/app/preferences/preferences.service.ts`

Add new method:
```typescript
formatTimeForLongitude(isoString: string, longitude: number): string {
  const date = new Date(isoString);
  
  // Calculate UTC offset from longitude (LMT = longitude / 15 hours)
  const offsetHours = longitude / 15;
  
  // Apply offset to UTC time
  const localDate = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
  
  // Format time according to user preference (12h/24h)
  const time = this.formatTime(localDate.toISOString());
  
  // Append UTC offset label
  const offsetLabel = this.formatUtcOffset(offsetHours);
  return `${time} ${offsetLabel}`;
}

private formatUtcOffset(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '−'; // Unicode minus U+2212
  const absHours = Math.abs(offsetHours);
  const hours = Math.floor(absHours);
  const minutes = Math.round((absHours - hours) * 60);
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}
```

### SolunarDetailsComponent updates
**File:** `src/app/solunar/solunar-details.component.ts` and `.html`

- Import `ActiveLocationService` to get current location's longitude
- Replace `PreferencesService.formatTime(event.startUtc)` calls with `formatTimeForLongitude(event.startUtc, longitude)`
- Update template to bind new formatted times with offset labels

### SolunarDisplayComponent updates
**File:** `src/app/solunar/solunar-display.component.ts` and `.html`

- Import `ActiveLocationService` to get location longitude
- Replace time formatting logic to use `formatTimeForLongitude()` for next peak display
- Update template to show offset label instead of hardcoded "UTC"

### Data Flow
1. **ActiveLocationService** provides active location with `latitude`, `longitude`, `name`
2. **SolunarService** continues to return all times as UTC ISO strings (no change)
3. **Components** call `PreferencesService.formatTimeForLongitude()` at render time
4. **Result:** Times displayed in Local Mean Solar Time with offset indicator

---

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Solunar peak times display in local solar time

  Scenario: Solunar details show major transit in local time
    Given the user is viewing solunar details for location at longitude -120 (UTC−8)
    When the major transit 1 event occurs at 2026-04-07T12:15:00Z
    Then the display shows "4:15 AM UTC−8"
    And the time is correct: 12:15 UTC + (-120/15) hours = 4:15 local

  Scenario: Solunar details show minor rise in local time with positive offset
    Given the user is viewing solunar details for location at longitude +75 (UTC+5)
    When the minor rise event occurs at 2026-04-07T18:30:00Z
    Then the display shows "11:30 PM UTC+5"
    And the offset label correctly indicates +5 hours ahead of UTC

  Scenario: Solunar card shows next peak in local time
    Given the user is on the home screen with location at longitude -75 (UTC−5)
    And the next solunar peak occurs at 2026-04-07T17:45:00Z
    Then the solunar card displays "12:45 PM UTC−5 in 3 hrs"
    And users can correlate to their local wall clock

  Scenario: User preference (12h/24h) applies to local time display
    Given the user has selected 24-hour time format in preferences
    When viewing solunar times at longitude -120 (UTC−8)
    Then times display in 24-hour format with UTC offset (e.g., "04:15 UTC−8")
    And changing preference to 12h updates all displays to "4:15 AM UTC−8"

  Scenario: Fallback behavior when location data unavailable
    Given the active location has no longitude data
    When rendering solunar details
    Then display reverts to UTC times with "UTC+0" offset label
    And users see warning/hint: "Unable to calculate local time — displaying UTC"
```

---

## Testing Strategy

### Unit Tests
- **PreferencesService:** `formatTimeForLongitude()` correctly applies longitude offset to ISO strings
- **SolunarDetailsComponent:** Correctly injects active location longitude and formats all four event times
- **SolunarDisplayComponent:** Next peak time formatted with correct offset label
- **Offset calculation:** Test edge cases (UTC±0, positive/negative, fractional hours like +5:30)

### E2E Tests
- View solunar details at different longitude values; verify displayed time matches calculated local time
- Change location and verify offset label updates
- Toggle 12h/24h preference; verify time format updates while preserving offset

### Manual Testing
- Verify times are astronomically correct (use online LMT converter as reference)
- Test on saved locations with known longitudes (e.g., London 0°, New York −74°)
- Accessibility: Screen reader announces offset meaning clearly

---

## Dependencies & Risks

### Dependencies
- `ActiveLocationService`: Must provide `longitude` on location object (already does)
- `PreferencesService`: Must support `formatTime()` method (already does)
- No new external APIs required

### Risks
- **Confusion with political timezones:** Users may expect political timezone (EST, PST) instead of LMT. Mitigate with clear labeling ("Solar Time") and docs.
- **Fractional hour offsets:** Some longitudes produce non-standard offsets (e.g., UTC+5:45). Format handling tested; display clear.
- **GPS vs. saved location:** Both use LMT; no special-casing needed.

---

## Success Metrics

- **User comprehension:** >85% of users correctly interpret "UTC−5" as "5 hours behind UTC" (via in-app survey)
- **Feature adoption:** Time display uses local solar time in >90% of solunar views
- **No regression:** Existing solunar detail layouts remain responsive; accessibility maintained (WCAG AA)
- **Accuracy:** All displayed times match expected LMT calculation (validated against reference tool)

---

## Timeline

- **Design review:** 1 day
- **Implementation (PreferencesService, SolunarDetailsComponent, SolunarDisplayComponent):** 2–3 days
- **Testing (unit + E2E):** 1–2 days
- **Total:** ~4–5 days

---

## Links & References

- **Feature 03 — Solunar Service:** `docs/feature-requirements/feature-03-solunar.md`
- **Feature 09 — Solunar Details Screen:** `docs/feature-requirements/feature-09-solunar-details.md`
- **Feature 14 — User Preferences:** `docs/feature-requirements/feature-14-preferences.md`
- **Local Mean Solar Time (Wikipedia):** https://en.wikipedia.org/wiki/Solar_time#Mean_solar_time
