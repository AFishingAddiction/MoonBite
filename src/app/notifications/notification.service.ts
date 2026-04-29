import { Injectable, Signal, computed, signal } from '@angular/core';
import { AppNotification, NotificationType } from './notification.model';

const HISTORY_KEY = 'moonbite_notifications';
const STATE_KEY = 'moonbite_notification_state';
const MAX_HISTORY = 100;
const MAX_HISTORY_DAYS = 30;
const TOAST_DURATION_MS = 5000;
const LUNAR_CYCLE = 29.530588861;

interface TriggerState {
  lastScoreByLocationId: Record<string, number>;
  lastPressureByLocationId: Record<string, { hpa: number; dateUtc: string }>;
  deduplicationKeys: string[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _history = signal<AppNotification[]>(this.loadHistory());
  private readonly _activeToast = signal<AppNotification | null>(null);
  private _triggerState: TriggerState = this.loadTriggerState();
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly history: Signal<AppNotification[]> = this._history.asReadonly();
  readonly activeToast: Signal<AppNotification | null> = this._activeToast.asReadonly();
  readonly unreadCount = computed(() => this._history().filter(n => !n.read).length);

  notify(
    type: NotificationType,
    title: string,
    message: string,
    icon: string,
    options?: { locationId?: string; locationName?: string; actionUrl?: string },
  ): AppNotification {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      icon,
      locationId: options?.locationId,
      locationName: options?.locationName,
      actionUrl: options?.actionUrl,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updated = [notification, ...this._history()].slice(0, MAX_HISTORY);
    this._history.set(updated);
    this.persistHistory(updated);
    this.showToast(notification);
    return notification;
  }

  dismissToast(): void {
    if (this._toastTimer !== null) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
    this._activeToast.set(null);
  }

  markRead(id: string): void {
    const updated = this._history().map(n => (n.id === id ? { ...n, read: true } : n));
    this._history.set(updated);
    this.persistHistory(updated);
  }

  markAllRead(): void {
    const updated = this._history().map(n => ({ ...n, read: true }));
    this._history.set(updated);
    this.persistHistory(updated);
  }

  clearHistory(): void {
    this._history.set([]);
    this.persistHistory([]);
  }

  // ── Trigger checks ──────────────────────────────────────────────────────────

  checkScoreJump(
    currentScore: number,
    locationId: string,
    locationName: string,
    enabled: boolean,
    muted: boolean,
  ): boolean {
    const lastScore = this._triggerState.lastScoreByLocationId[locationId];
    this._triggerState.lastScoreByLocationId[locationId] = currentScore;
    this.persistTriggerState();

    if (!enabled || muted) return false;
    if (lastScore === undefined) return false;
    if (currentScore - lastScore < 15) return false;

    const dedupKey = this.makeDedupKey('scoreJump', locationId);
    if (this.isDeduped(dedupKey)) return false;
    this.recordDedup(dedupKey);

    this.notify(
      'scoreJump',
      `${locationName} score jumped!`,
      `Score rose from ${lastScore} to ${currentScore}. Great fishing conditions ahead!`,
      '📈',
      { locationId, locationName, actionUrl: '/' },
    );
    return true;
  }

  checkMoonMilestone(moonAge: number, enabled: boolean): boolean {
    if (!enabled) return false;

    const halfCycle = LUNAR_CYCLE / 2;
    const daysToFullMoon =
      moonAge <= halfCycle ? halfCycle - moonAge : LUNAR_CYCLE - moonAge + halfCycle;
    const daysToNewMoon = LUNAR_CYCLE - moonAge;

    const nearFull = daysToFullMoon >= 2.5 && daysToFullMoon < 3.5;
    const nearNew = daysToNewMoon >= 2.5 && daysToNewMoon < 3.5;

    if (!nearFull && !nearNew) return false;

    const eventType = nearFull ? 'full' : 'new';
    const dedupKey = this.makeDedupKey('moonMilestone', eventType);
    if (this.isDeduped(dedupKey)) return false;
    this.recordDedup(dedupKey);

    const phaseName = nearFull ? 'Full Moon' : 'New Moon';
    const emoji = nearFull ? '🌕' : '🌑';
    const days = Math.round(nearFull ? daysToFullMoon : daysToNewMoon);

    this.notify(
      'moonMilestone',
      `${phaseName} in ${days} days`,
      `${phaseName} approaching — expect strong feeding activity around dawn and dusk.`,
      emoji,
      { actionUrl: '/moon' },
    );
    return true;
  }

  checkPressureAlert(
    currentPressureHpa: number,
    locationId: string,
    locationName: string,
    enabled: boolean,
    muted: boolean,
  ): boolean {
    const dateUtc = new Date().toISOString().slice(0, 10);
    const lastReading = this._triggerState.lastPressureByLocationId[locationId];
    this._triggerState.lastPressureByLocationId[locationId] = { hpa: currentPressureHpa, dateUtc };
    this.persistTriggerState();

    if (!enabled || muted) return false;
    if (!lastReading) return false;
    if (currentPressureHpa - lastReading.hpa >= -2) return false;

    const dedupKey = this.makeDedupKey('pressureAlert', locationId);
    if (this.isDeduped(dedupKey)) return false;
    this.recordDedup(dedupKey);

    this.notify(
      'pressureAlert',
      'Pressure dropping fast',
      'Barometric pressure is falling — fish may be sluggish. Check back when it stabilizes.',
      '📉',
      { locationId, locationName, actionUrl: '/weather' },
    );
    return true;
  }

  sendTestNotification(): void {
    this.notify(
      'locationUpdate',
      'Test notification',
      "Notifications are working! You'll receive alerts about fishing conditions.",
      '📬',
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private showToast(notification: AppNotification): void {
    if (this._toastTimer !== null) {
      clearTimeout(this._toastTimer);
    }
    this._activeToast.set(notification);
    this._toastTimer = setTimeout(() => {
      this._activeToast.set(null);
      this._toastTimer = null;
    }, TOAST_DURATION_MS);
  }

  private makeDedupKey(type: NotificationType, qualifier: string): string {
    const dateUtc = new Date().toISOString().slice(0, 10);
    return `${type}:${qualifier}:${dateUtc}`;
  }

  private isDeduped(key: string): boolean {
    return this._triggerState.deduplicationKeys.includes(key);
  }

  private recordDedup(key: string): void {
    this._triggerState.deduplicationKeys = [
      ...this._triggerState.deduplicationKeys,
      key,
    ].slice(-500);
    this.persistTriggerState();
  }

  private loadHistory(): AppNotification[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - MAX_HISTORY_DAYS);
      const cutoffStr = cutoff.toISOString();

      return (parsed as AppNotification[]).filter(
        n => typeof n.id === 'string' && typeof n.timestamp === 'string' && n.timestamp >= cutoffStr,
      );
    } catch {
      return [];
    }
  }

  private persistHistory(history: AppNotification[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Storage unavailable — silently ignore
    }
  }

  private loadTriggerState(): TriggerState {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return this.emptyTriggerState();
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return this.emptyTriggerState();
      return parsed as TriggerState;
    } catch {
      return this.emptyTriggerState();
    }
  }

  private persistTriggerState(): void {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this._triggerState));
    } catch {
      // Storage unavailable — silently ignore
    }
  }

  private emptyTriggerState(): TriggerState {
    return { lastScoreByLocationId: {}, lastPressureByLocationId: {}, deduplicationKeys: [] };
  }
}
