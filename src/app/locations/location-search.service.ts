import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, filter, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeocodingResult, NominatimResult, mapNominatimResult } from './geocoding-result.model';

export const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 8;

type SearchOutcome = GeocodingResult[] | 'error';

@Injectable({ providedIn: 'root' })
export class LocationSearchService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _results = signal<GeocodingResult[] | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastQuery = signal('');

  readonly results = this._results.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastQuery = this._lastQuery.asReadonly();

  private readonly searchSubject = new Subject<string>();
  private readonly retrySubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(DEBOUNCE_MS),
        filter((q) => q.length > 0),
        distinctUntilChanged(),
        tap(() => {
          this._isLoading.set(true);
          this._error.set(null);
        }),
        switchMap((query) => this.fetchResults(query)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => this.applyOutcome(outcome));

    this.retrySubject
      .pipe(
        tap(() => {
          this._isLoading.set(true);
          this._error.set(null);
        }),
        switchMap((query) => this.fetchResults(query)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => this.applyOutcome(outcome));
  }

  search(query: string): void {
    const trimmed = query.trim();
    this._lastQuery.set(trimmed);
    if (!trimmed) {
      this.clear();
      return;
    }
    this._isLoading.set(true);
    this._error.set(null);
    this.searchSubject.next(trimmed);
  }

  clear(): void {
    // Push empty string to reset the debounce timer and cancel any pending search
    this.searchSubject.next('');
    this._results.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    this._lastQuery.set('');
  }

  retry(): void {
    const q = this._lastQuery();
    if (!q) return;
    this.retrySubject.next(q);
  }

  private fetchResults(query: string): Observable<SearchOutcome> {
    const params = new HttpParams()
      .set('q', query)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('limit', String(MAX_RESULTS));

    return this.http.get<NominatimResult[]>(NOMINATIM_URL, { params }).pipe(
      map((results) => results.map(mapNominatimResult)),
      catchError(() => of('error' as const)),
    );
  }

  private applyOutcome(outcome: SearchOutcome): void {
    if (outcome === 'error') {
      this._error.set('Search failed. Check your connection and try again.');
      this._results.set(null);
    } else {
      this._results.set(outcome);
      this._error.set(null);
    }
    this._isLoading.set(false);
  }
}
