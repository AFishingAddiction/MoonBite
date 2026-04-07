import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LocationSearchService } from './location-search.service';
import { NominatimResult } from './geocoding-result.model';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function makeNominatimResult(overrides: Partial<NominatimResult> = {}): NominatimResult {
  return {
    place_id: 123456,
    lat: '39.0968',
    lon: '-120.0324',
    display_name: 'Lake Tahoe, California, United States',
    address: {
      lake: 'Lake Tahoe',
      state: 'California',
      country: 'United States',
      country_code: 'us',
    },
    ...overrides,
  };
}

describe('LocationSearchService', () => {
  let service: LocationSearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ─── Initial state ─────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null results', () => {
    expect(service.results()).toBeNull();
  });

  it('should start with isLoading false', () => {
    expect(service.isLoading()).toBeFalse();
  });

  it('should start with null error', () => {
    expect(service.error()).toBeNull();
  });

  it('should start with empty lastQuery', () => {
    expect(service.lastQuery()).toBe('');
  });

  // ─── search() — empty input ────────────────────────────────────────────────

  it('should clear state when search called with empty string', fakeAsync(() => {
    service.search('');
    tick(300);
    expect(service.results()).toBeNull();
    expect(service.isLoading()).toBeFalse();
    expect(service.error()).toBeNull();
    httpMock.expectNone(NOMINATIM_URL);
  }));

  it('should clear state when search called with whitespace only', fakeAsync(() => {
    service.search('   ');
    tick(300);
    expect(service.results()).toBeNull();
    expect(service.isLoading()).toBeFalse();
    httpMock.expectNone(NOMINATIM_URL);
  }));

  // ─── search() — debounce ───────────────────────────────────────────────────

  it('should set isLoading immediately on search()', fakeAsync(() => {
    service.search('Lake Tahoe');
    expect(service.isLoading()).toBeTrue();
    tick(300);
    httpMock.expectOne(() => true).flush([]);
  }));

  it('should debounce rapid calls and only make one HTTP request', fakeAsync(() => {
    service.search('L');
    service.search('La');
    service.search('Lak');
    service.search('Lake');
    service.search('Lake Tahoe');
    tick(300);

    const req = httpMock.expectOne(() => true);
    expect(req.request.params.get('q')).toBe('Lake Tahoe');
    req.flush([]);
  }));

  it('should not make HTTP request before debounce interval', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(100);
    httpMock.expectNone(NOMINATIM_URL);
    expect(service.isLoading()).toBeTrue(); // still waiting
    tick(200); // total 300ms
    httpMock.expectOne(() => true).flush([]);
  }));

  // ─── search() — HTTP request ───────────────────────────────────────────────

  it('should send correct query params to Nominatim', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);

    const req = httpMock.expectOne(() => true);
    expect(req.request.url).toBe(NOMINATIM_URL);
    expect(req.request.params.get('q')).toBe('Lake Tahoe');
    expect(req.request.params.get('format')).toBe('json');
    expect(req.request.params.get('addressdetails')).toBe('1');
    expect(req.request.params.get('limit')).toBe('8');
    req.flush([]);
  }));

  it('should map Nominatim results to GeocodingResult[]', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);

    const req = httpMock.expectOne(() => true);
    req.flush([makeNominatimResult()]);

    expect(service.results()).not.toBeNull();
    expect(service.results()!.length).toBe(1);

    const result = service.results()![0];
    expect(result.placeId).toBe(123456);
    expect(result.latitude).toBeCloseTo(39.0968);
    expect(result.longitude).toBeCloseTo(-120.0324);
    expect(result.displayName).toBe('Lake Tahoe, California, United States');
    expect(result.address.name).toBe('Lake Tahoe');
    expect(result.address.state).toBe('California');
    expect(result.address.country).toBe('United States');
    expect(result.address.countryCode).toBe('us');
  }));

  it('should return empty array and no error for 0 results', fakeAsync(() => {
    service.search('Atlantis');
    tick(300);

    httpMock.expectOne(() => true).flush([]);

    expect(service.results()).toEqual([]);
    expect(service.error()).toBeNull();
    expect(service.isLoading()).toBeFalse();
  }));

  it('should set isLoading false after results arrive', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock.expectOne(() => true).flush([makeNominatimResult()]);
    expect(service.isLoading()).toBeFalse();
  }));

  it('should clear error on successful search', fakeAsync(() => {
    // First cause an error
    service.search('fail');
    tick(300);
    httpMock.expectOne(() => true).error(new ErrorEvent('Network error'));
    expect(service.error()).not.toBeNull();

    // Then a successful search clears it
    service.search('Lake Tahoe');
    tick(300);
    httpMock.expectOne(() => true).flush([makeNominatimResult()]);
    expect(service.error()).toBeNull();
  }));

  // ─── search() — error handling ────────────────────────────────────────────

  it('should set error message on network failure', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock.expectOne(() => true).error(new ErrorEvent('Network error'));

    expect(service.error()).toBe('Search failed. Check your connection and try again.');
    expect(service.results()).toBeNull();
    expect(service.isLoading()).toBeFalse();
  }));

  it('should set error on HTTP 429 response', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock
      .expectOne(() => true)
      .flush('Too Many Requests', { status: 429, statusText: 'Too Many Requests' });

    expect(service.error()).toBe('Search failed. Check your connection and try again.');
    expect(service.isLoading()).toBeFalse();
  }));

  it('should set error on HTTP 500 response', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock
      .expectOne(() => true)
      .flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).not.toBeNull();
    expect(service.isLoading()).toBeFalse();
  }));

  // ─── clear() ──────────────────────────────────────────────────────────────

  it('should reset all state on clear()', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock.expectOne(() => true).flush([makeNominatimResult()]);

    service.clear();

    expect(service.results()).toBeNull();
    expect(service.isLoading()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.lastQuery()).toBe('');
  }));

  it('should cancel pending debounce on clear()', fakeAsync(() => {
    service.search('Lake Tahoe');
    service.clear();
    tick(300);
    // No HTTP request should be made since clear() was called before debounce fired
    httpMock.expectNone(NOMINATIM_URL);
    expect(service.results()).toBeNull();
    expect(service.lastQuery()).toBe('');
  }));

  // ─── retry() ──────────────────────────────────────────────────────────────

  it('should retry with the last query immediately (no debounce)', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock.expectOne(() => true).error(new ErrorEvent('Network error'));
    expect(service.error()).not.toBeNull();

    service.retry();
    tick(0); // no debounce on retry

    const req = httpMock.expectOne(() => true);
    expect(req.request.params.get('q')).toBe('Lake Tahoe');
    req.flush([makeNominatimResult()]);

    expect(service.results()!.length).toBe(1);
    expect(service.error()).toBeNull();
    expect(service.isLoading()).toBeFalse();
  }));

  it('should set isLoading on retry', fakeAsync(() => {
    service.search('Lake Tahoe');
    tick(300);
    httpMock.expectOne(() => true).error(new ErrorEvent('Network error'));

    service.retry();
    expect(service.isLoading()).toBeTrue();
    tick(0);
    httpMock.expectOne(() => true).flush([]);
  }));

  it('should do nothing if retry() called with no last query', fakeAsync(() => {
    service.retry();
    tick(0);
    httpMock.expectNone(NOMINATIM_URL);
    expect(service.isLoading()).toBeFalse();
  }));

  // ─── mapNominatimResult ────────────────────────────────────────────────────

  it('should fall back to city when lake is absent in address', fakeAsync(() => {
    const raw = makeNominatimResult({
      address: { city: 'Bristol', state: 'England', country: 'United Kingdom', country_code: 'gb' },
    });
    service.search('Bristol');
    tick(300);
    httpMock.expectOne(() => true).flush([raw]);

    expect(service.results()![0].address.name).toBe('Bristol');
  }));

  it('should handle results with no recognisable place name', fakeAsync(() => {
    const raw = makeNominatimResult({
      address: { state: 'California', country: 'United States', country_code: 'us' },
    });
    service.search('California');
    tick(300);
    httpMock.expectOne(() => true).flush([raw]);

    expect(service.results()![0].address.name).toBeUndefined();
  }));
});
