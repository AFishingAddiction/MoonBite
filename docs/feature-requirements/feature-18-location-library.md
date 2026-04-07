# Feature 18 — Location Search & Library

**Status:** Complete  
**Milestone:** 3 — Engagement & Persistence

---

## Overview

Extend Feature 13 (Saved Locations) with the ability to **search for any location by place name** using a free geocoding API. Users can search for "Lake Tahoe", "Bristol, UK", or any address, review a ranked list of results with coordinates, and add any result directly to their saved locations library. This eliminates the need to manually save only the current GPS location and makes it effortless to plan fishing trips to anywhere in the world.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|---------|
| US-1 | Angler | To search for a fishing location by name or address | I can find spots I want to fish without needing to visit them first |
| US-2 | Angler | To see a list of matching locations with names, coordinates, and region | I can pick the correct result if multiple match my search |
| US-3 | Angler | To see the coordinates of a search result before saving | I can verify it's the right location (e.g., not a different lake with the same name) |
| US-4 | Angler | To add a search result to my saved locations with one tap | I can quickly build a library of spots to plan trips |
| US-5 | Angler | To clear a search and try a new one | I can refine my search without leaving the locations screen |
| US-6 | Angler | To see helpful empty states and error messages during search | I understand what went wrong and how to fix it |
| US-7 | Angler | To have search results debounced as I type | The app doesn't make excessive API requests and remains responsive |
| US-8 | Angler | To search from the saved locations management screen | I don't need a separate view to add new locations |

---

## UX Notes

### Search Workflow

1. User lands on `/locations` (Saved Locations screen).
2. Search input at top: "Search for a location..." placeholder.
3. User types (e.g., "Lake Tahoe") — debounced 300ms.
4. Results appear below: ranked list with place name, region/country, and coordinates (lat/lng).
5. Tap a result → inline "Add to Saved Locations" confirmation with name pre-filled.
6. Confirm → location added to library; search cleared; list updated.
7. "X" or "Clear" button clears search and hides results.

### Key Interaction Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Search input location | Top of `/locations` screen | Reduces navigation friction; search and library in one place |
| Debounce interval | 300ms | Balances responsiveness with API rate limiting |
| Max results shown | 8 results | Avoids overwhelming list; user can refine search if needed |
| Result format | Place name + region/country + lat/lng | Disambiguates (e.g., "Lake Tahoe, CA, USA" vs. regional variants) |
| Add to library flow | Inline confirmation with pre-filled name | User can rename before saving; respects 10-location max |
| Empty state | "No results for '{query}'" | Clear feedback without jargon |
| Error state | "Search failed. Check your connection." | User knows it's temporary; encourages retry |
| Loading state | Spinner with "Searching..." text | Clear that work is in progress |
| Search clearing | X icon in input or "Clear" button | Obvious way to reset; discoverability high on mobile |

### Accessibility (Fishing Context)

- Search input has visible label (or aria-label) and placeholder.
- Results list is semantic `<ul>` with `<button>` elements for "Add" actions.
- Touch targets ≥ 44×44px.
- Spinner and status messages announced via `aria-live="polite"`.
- Error states use `aria-label` + color + icon for robustness.
- Keyboard: Tab through results, Enter/Space to select "Add".

---

## UI Spec

### Saved Locations Screen with Search (`/locations`)

```
┌─────────────────────────────────────┐
│ ← Back       📍 Saved Locations     │
├─────────────────────────────────────┤
│ [Search for a location...      ] [X]│ ← Search input + clear button
├─────────────────────────────────────┤
│ 🔍 Searching...                     │ ← Loading state
│                                     │
├─────────────────────────────────────┤
│ Search Results (3)                  │ ← Section header
├─────────────────────────────────────┤
│ Lake Tahoe, CA, USA                 │ ← Result
│ 39.0968° N, 120.0324° W             │
│                         [Add] [Info] │ (Info shows full coords)
│                                     │
│ Lake Tahoe, NV, USA                 │ ← Ambiguous result
│ 39.1850° N, 119.7674° W             │
│                         [Add] [Info] │
│                                     │
│ Tahoe City, CA, USA                 │ ← Related result
│ 39.1306° N, 120.1340° W             │
│                         [Add] [Info] │
├─────────────────────────────────────┤
│                                     │
│ ✓ Currently using: Lake Tahoe       │ ← Saved locations section
│                           [Use GPS] │ (appears after search/results)
├─────────────────────────────────────┤
│ ● Lake Tahoe (Active)     [Use GPS] [Delete] │
│   39.0968° N, 120.0324° W           │
│                                     │
│ ○ Home Waters             [Use]     [Delete] │
│   40.7128° N, 74.0060° W            │
└─────────────────────────────────────┘
```

### Search Input (Focused/Active)

```
┌─────────────────────────────────────┐
│ ← Back       📍 Saved Locations     │
├─────────────────────────────────────┤
│ [Lake Tahoe                   ] [X] │ ← Clear button visible
│  ┌─────────────────────────────────┐│
│  │ Lake Tahoe, CA, USA             ││ ← Results dropdown/list
│  │ 39.0968° N, 120.0324° W         ││
│  │                       [Add][Info]││
│  │                                 ││
│  │ Lake Tahoe, NV, USA             ││
│  │ 39.1850° N, 119.7674° W         ││
│  │                       [Add][Info]││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Empty State (No Results)

```
┌─────────────────────────────────────┐
│ ← Back       📍 Saved Locations     │
├─────────────────────────────────────┤
│ [Search for "Atlantis"        ] [X] │
├─────────────────────────────────────┤
│                                     │
│         🔍 No results found         │
│                                     │
│    Try another name or address.     │
│                                     │
└─────────────────────────────────────┘
```

### Error State (Network/API Failure)

```
┌─────────────────────────────────────┐
│ ← Back       📍 Saved Locations     │
├─────────────────────────────────────┤
│ [Search for a location...      ] [X]│
├─────────────────────────────────────┤
│                                     │
│       ⚠️  Search failed              │
│                                     │
│  Check your connection and try      │
│  again, or use your saved locations │
│  below.                             │
│                                     │
│               [Retry]               │
│                                     │
└─────────────────────────────────────┘
```

### Add to Library Confirmation

```
┌─────────────────────────────────────┐
│ Add to Saved Locations              │
├─────────────────────────────────────┤
│                                     │
│ Location Name:                      │
│ [Lake Tahoe, CA, USA           ]    │
│                                     │
│ Coordinates:                        │
│ 39.0968° N, 120.0324° W             │
│                                     │
│      [Save]  [Cancel]               │
│                                     │
│ Note: You can rename this later     │
│ in Settings.                        │
│                                     │
└─────────────────────────────────────┘
```

### Design Tokens (Reuse from Feature 13)

| Element | Token |
|---------|-------|
| Search input background | `$color-surface` |
| Search input border (focused) | `$color-primary` |
| Results list background | `$color-surface` |
| Result item hover | `$color-surface-alt` |
| "Add" button | `$color-accent` |
| Error icon/text | `$color-error` |
| Loading spinner | `$color-primary` |
| Placeholder text | `$color-text-secondary` |

---

## Geocoding API

### Recommendation: Nominatim (OpenStreetMap)

**Why Nominatim:**
- Free, no API key required
- Open-source, widely trusted
- Generous rate limits (1 req/sec for public, no auth)
- Good coverage globally
- Returns structured, disambiguated results
- Returns bounding box (useful for zooming maps in future features)
- Respects legal privacy/GDPR compliance

### Endpoint

```
GET https://nominatim.openstreetmap.org/search?q={query}&format=json&addressdetails=1&limit=8
```

### Query Parameters

| Param | Value | Purpose |
|-------|-------|---------|
| `q` | User's search string (e.g., "Lake Tahoe") | Required; what to search for |
| `format` | `json` | Return JSON (required) |
| `addressdetails` | `1` | Include breakdown of address components |
| `limit` | `8` | Max results (same as UI spec) |

### Response Shape

```json
[
  {
    "place_id": 123456,
    "lat": "39.0968",
    "lon": "-120.0324",
    "display_name": "Lake Tahoe, California, United States",
    "address": {
      "lake": "Lake Tahoe",
      "county": "El Dorado County",
      "state": "California",
      "country": "United States",
      "country_code": "us"
    },
    "boundingbox": ["39.02", "39.16", "-120.12", "-119.88"]
  },
  ...
]
```

### TypeScript Model

```typescript
interface GeocodingResult {
  readonly placeId: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;        // e.g., "Lake Tahoe, California, United States"
  readonly address: GeocodingAddress;
  readonly boundingBox: [string, string, string, string]; // [minLat, maxLat, minLon, maxLon]
}

interface GeocodingAddress {
  readonly name?: string;              // "Lake Tahoe", "Bristol", etc.
  readonly county?: string;
  readonly state?: string;
  readonly country?: string;
  readonly countryCode?: string;
}
```

### Rate Limiting & Error Handling

- Nominatim enforces 1 request/second for public API.
- App implements 300ms debounce; user typing "Lake Tahoe" = ~1 request.
- If rate-limited (HTTP 429), show retry message with exponential backoff.
- Network failures: show error state with "Retry" button.
- Empty results (200 OK, empty array): show "No results found" empty state.

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/locations/location-search.service.ts` | HTTP-based geocoding + debounce + caching |
| `src/app/locations/location-search.service.spec.ts` | Unit tests |
| `src/app/locations/geocoding-result.model.ts` | `GeocodingResult` interface + mapper |
| `src/app/locations/saved-locations.component.ts` (updated) | Add search input, results list, confirmation modal |
| `src/app/locations/saved-locations.component.html` (updated) | Search UI + results + confirmation |
| `src/app/locations/saved-locations.component.scss` (updated) | Search styles |

### Modified Files

| File | Change |
|------|--------|
| `src/app/locations/saved-locations.component.ts` | Inject `LocationSearchService`; add search query signal; handle result selection + confirmation |
| `src/app/locations/saved-locations.component.html` | Add search input, results list, and confirmation modal |
| `src/app/locations/saved-locations.component.scss` | Styles for search UI, results, and modal |

### `LocationSearchService` API

```typescript
interface GeocodingResult {
  readonly placeId: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  readonly address: GeocodingAddress;
}

interface GeocodingAddress {
  readonly name?: string;
  readonly county?: string;
  readonly state?: string;
  readonly country?: string;
  readonly countryCode?: string;
}

class LocationSearchService {
  // Search for locations by query string
  // Returns Observable<GeocodingResult[]> | null (null = no query, not searching)
  readonly results: Signal<GeocodingResult[] | null>;
  
  // IsLoading state
  readonly isLoading: Signal<boolean>;
  
  // Error state
  readonly error: Signal<string | null>; // error message or null
  
  // Debounced search method (300ms debounce)
  search(query: string): void; // Updates results, isLoading, error signals
  
  // Clear search
  clear(): void; // Resets results, error, loading
  
  // Retry failed search
  retry(): void;
}
```

### Component Integration

In `SavedLocationsComponent`:

```typescript
// Inject services
private searchService = inject(LocationSearchService);
private savedLocations = inject(SavedLocationsService);

// Signals
readonly searchQuery = signal<string>('');
readonly selectedResult = signal<GeocodingResult | null>(null);
readonly showConfirmation = signal<boolean>(false);
readonly confirmName = signal<string>('');

// Methods
onSearchInput(query: string): void {
  this.searchQuery.set(query);
  if (query.trim()) {
    this.searchService.search(query);
  } else {
    this.searchService.clear();
  }
}

onClearSearch(): void {
  this.searchQuery.set('');
  this.searchService.clear();
}

onSelectResult(result: GeocodingResult): void {
  this.selectedResult.set(result);
  this.confirmName.set(result.displayName);
  this.showConfirmation.set(true);
}

onConfirmAdd(): void {
  const result = this.selectedResult();
  if (result) {
    const saved = this.savedLocations.add(
      this.confirmName(),
      result.latitude,
      result.longitude
    );
    if (saved) {
      this.selectedResult.set(null);
      this.showConfirmation.set(false);
      this.onClearSearch();
    }
    // If not saved (max reached), show error toast
  }
}

onCancel(): void {
  this.selectedResult.set(null);
  this.showConfirmation.set(false);
}
```

---

## Acceptance Criteria

```gherkin
Feature: Location Search & Library

  Scenario: Search for a location by name
    Given the user is on the /locations screen
    When the user types "Lake Tahoe" in the search input
    And waits 300ms for debounce
    Then a list of up to 8 matching locations appears
    And each result shows the place name, region, and coordinates

  Scenario: No results found
    Given the user has typed "Atlantis" in the search input
    When the search completes with 0 results
    Then "No results found" empty state is shown
    And the saved locations list remains visible below

  Scenario: Search error with retry
    Given the user is searching for "Lake Tahoe"
    And the network is unavailable
    When the search request fails
    Then an error message "Search failed. Check your connection." is shown
    And a "Retry" button is available
    When the user taps "Retry"
    Then the search is attempted again

  Scenario: Clear search and results
    Given the user has searched for "Lake Tahoe" and results are shown
    When the user taps the X button in the search input
    Then the search input is cleared
    And the results list disappears
    And the saved locations list is visible again

  Scenario: Add search result to saved locations
    Given search results for "Lake Tahoe" are shown
    When the user taps "Add" on the first result
    Then a confirmation modal appears with:
      - Pre-filled location name (e.g., "Lake Tahoe, CA, USA")
      - Display of latitude and longitude
      - "Save" and "Cancel" buttons
    When the user taps "Save"
    Then the location is added to the saved locations list
    And the search is cleared
    And the modal closes

  Scenario: Rename before adding to library
    Given a search result is selected for adding
    When the user modifies the pre-filled name in the confirmation modal
    And taps "Save"
    Then the location is saved with the new name
    And the original search result name is not changed

  Scenario: Max locations enforced during search add
    Given the user already has 10 saved locations
    When the user selects a search result and taps "Save"
    Then an error "Maximum of 10 locations" is shown
    And the result is not added
    And the modal remains open for user to dismiss

  Scenario: Debounce limits API requests
    Given the user types "Lake" in the search input
    And then types "Tahoe" character by character
    When 300ms of no typing has elapsed
    Then exactly 1 API request is made (not multiple)
    And results are shown after that single request

  Scenario: Coordinates visible on result
    Given search results are shown
    When the user views a result "Lake Tahoe, CA, USA"
    Then the latitude (e.g., 39.0968° N) and longitude (120.0324° W) are displayed
    And the user can verify the correct location before adding

  Scenario: Search preserves saved locations list
    Given the user has saved locations displayed
    When the user performs a search
    Then the search results appear above the saved locations list
    And the saved locations list remains intact below the results
    And "Currently using:" badge is still visible

  Scenario: Empty search input shows saved locations only
    Given the user is on /locations with a search input
    When the search input is empty (no query)
    Then no results are shown
    And the saved locations list is visible
    And the "Currently using:" section is visible
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Search success rate | 100% — results return within 2 seconds (network dependent) |
| Add to library success | 100% — selected result added immediately to saved locations |
| Error recovery | 100% — retry button successfully retries failed searches |
| Debounce effectiveness | Avg 1 API request per search (not per keystroke) |
| Unit test coverage | ≥ 85% (statements, branches, functions, lines) |
| WCAG 2.1 AA compliance | All interactive elements labelled and focusable |
| Performance | Search results appear within 500ms after API response |

---

## Implementation Notes

- **Nominatim API:** Respect 1 request/second rate limit. Debounce 300ms client-side ensures compliance for typical user typing speeds.
- **Caching:** Optional 5-minute in-memory cache for identical queries (e.g., user searches "Lake Tahoe" twice in 5 min).
- **Error Handling:** Distinguish between user errors (no results) and system errors (network, 429, 5xx). Only show retry on system errors.
- **Accessibility:** Use `aria-live="polite"` for results loading, results update, and error messages.
- **Confirmation Modal:** Block interaction with saved locations list while modal is open; focus trap on modal.
- **Name Pre-filling:** Use `result.displayName` (e.g., "Lake Tahoe, California, United States") as the default saved location name; user can customize in modal.

---

## Out of Scope

| Item | Future Feature |
|------|---------------|
| Search history / recent searches | Feature 21 (Analytics Dashboard) |
| Autocomplete / suggestions while typing | Feature 25 (Advanced Search) |
| Fuzzy matching or typo correction | Feature 25 |
| Map view of search results | Feature 23 (Map Integration) |
| Reverse geocoding (tap on map to search) | Feature 23 |
| Location search within saved locations (filtering) | Feature 14 (User Settings) — rename/organize feature |
| Sharing search results with other users | Feature 17 (Share Score) |
| Advanced filters (country, type of water body) | Feature 25 |

---

## Dependencies

| Feature | Provides |
|---------|---------|
| Feature 13 | `SavedLocationsService` + `SavedLocation` model; `/locations` route + `SavedLocationsComponent` |
| Feature 12 | Routing infrastructure + bottom nav |
| Feature 14 | User preferences (future: rename saved location from search) |
| Feature 07 | SCSS design tokens + responsive utilities |

---

## Related Decisions from Feature 13

- **Max locations:** 10 (enforced; search results cannot exceed this limit when adding)
- **Location model:** `SavedLocation` with `id`, `name`, `latitude`, `longitude`, `createdAt`
- **Persistence:** localStorage (`moonbite_saved_locations`)
- **Design tokens:** Reuse all color/spacing tokens from Feature 13
