import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { AppNotification } from './notification.model';

const HISTORY_KEY = 'moonbite_notifications';
const STATE_KEY = 'moonbite_notification_state';

describe('NotificationService', () => {
  let service: NotificationService;

  function freshService(): NotificationService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(NotificationService);
  }

  beforeEach(() => {
    localStorage.clear();
    service = freshService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty history', () => {
    expect(service.history()).toEqual([]);
  });

  it('should start with no active toast', () => {
    expect(service.activeToast()).toBeNull();
  });

  it('should start with unread count of 0', () => {
    expect(service.unreadCount()).toBe(0);
  });

  // ── notify() ────────────────────────────────────────────────────────────────

  it('should add notification to history', () => {
    service.notify('scoreJump', 'Title', 'Message', '📈');
    expect(service.history().length).toBe(1);
  });

  it('should set notification fields correctly', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈', {
      locationId: 'loc1',
      locationName: 'Lake Tahoe',
      actionUrl: '/',
    });
    const n = service.history()[0];
    expect(n.type).toBe('scoreJump');
    expect(n.title).toBe('Title');
    expect(n.message).toBe('Msg');
    expect(n.icon).toBe('📈');
    expect(n.locationId).toBe('loc1');
    expect(n.locationName).toBe('Lake Tahoe');
    expect(n.actionUrl).toBe('/');
    expect(n.read).toBe(false);
    expect(n.id).toBeTruthy();
    expect(n.timestamp).toBeTruthy();
  });

  it('should prepend new notifications (newest first)', () => {
    service.notify('scoreJump', 'First', 'Msg', '📈');
    service.notify('moonMilestone', 'Second', 'Msg', '🌕');
    expect(service.history()[0].type).toBe('moonMilestone');
    expect(service.history()[1].type).toBe('scoreJump');
  });

  it('should set active toast when notifying', () => {
    service.notify('scoreJump', 'Title', 'Message', '📈');
    expect(service.activeToast()).not.toBeNull();
    expect(service.activeToast()!.title).toBe('Title');
  });

  it('should persist notification to localStorage', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    const raw = localStorage.getItem(HISTORY_KEY);
    expect(raw).not.toBeNull();
    const parsed: AppNotification[] = JSON.parse(raw!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Title');
  });

  it('should increment unread count after notify', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    expect(service.unreadCount()).toBe(1);
  });

  it('should cap history at 100 entries', () => {
    for (let i = 0; i < 105; i++) {
      service.notify('scoreJump', `Title ${i}`, 'Msg', '📈');
    }
    expect(service.history().length).toBe(100);
  });

  it('should keep the newest 100 entries when capping', () => {
    for (let i = 0; i < 105; i++) {
      service.notify('scoreJump', `Title ${i}`, 'Msg', '📈');
    }
    expect(service.history()[0].title).toBe('Title 104');
  });

  // ── dismissToast() ──────────────────────────────────────────────────────────

  it('should clear active toast on dismiss', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    service.dismissToast();
    expect(service.activeToast()).toBeNull();
  });

  it('should not throw if dismissToast called with no toast', () => {
    expect(() => service.dismissToast()).not.toThrow();
  });

  // ── markRead() ──────────────────────────────────────────────────────────────

  it('should mark a notification as read', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    const id = service.history()[0].id;
    service.markRead(id);
    expect(service.history()[0].read).toBe(true);
  });

  it('should decrement unread count after markRead', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    const id = service.history()[0].id;
    service.markRead(id);
    expect(service.unreadCount()).toBe(0);
  });

  it('should persist read state to localStorage', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    const id = service.history()[0].id;
    service.markRead(id);
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: AppNotification[] = JSON.parse(raw!);
    expect(parsed[0].read).toBe(true);
  });

  it('should not throw when marking unknown id as read', () => {
    expect(() => service.markRead('nonexistent-id')).not.toThrow();
  });

  // ── markAllRead() ───────────────────────────────────────────────────────────

  it('should mark all notifications as read', () => {
    service.notify('scoreJump', 'A', 'Msg', '📈');
    service.notify('moonMilestone', 'B', 'Msg', '🌕');
    service.markAllRead();
    expect(service.history().every(n => n.read)).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  // ── clearHistory() ──────────────────────────────────────────────────────────

  it('should remove all notifications from history', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    service.clearHistory();
    expect(service.history()).toEqual([]);
  });

  it('should persist empty history to localStorage', () => {
    service.notify('scoreJump', 'Title', 'Msg', '📈');
    service.clearHistory();
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: AppNotification[] = JSON.parse(raw!);
    expect(parsed).toEqual([]);
  });

  // ── localStorage persistence ─────────────────────────────────────────────────

  it('should load history from localStorage on init', () => {
    const n: AppNotification = {
      id: 'abc',
      type: 'scoreJump',
      title: 'Stored',
      message: 'Msg',
      icon: '📈',
      timestamp: new Date().toISOString(),
      read: false,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([n]));
    const fresh = freshService();
    expect(fresh.history().length).toBe(1);
    expect(fresh.history()[0].title).toBe('Stored');
  });

  it('should filter out notifications older than 30 days on load', () => {
    const old = new Date();
    old.setDate(old.getDate() - 31);
    const n: AppNotification = {
      id: 'old',
      type: 'scoreJump',
      title: 'Old',
      message: 'Msg',
      icon: '📈',
      timestamp: old.toISOString(),
      read: false,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([n]));
    const fresh = freshService();
    expect(fresh.history().length).toBe(0);
  });

  it('should keep notifications within 30 days on load', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const n: AppNotification = {
      id: 'recent',
      type: 'scoreJump',
      title: 'Recent',
      message: 'Msg',
      icon: '📈',
      timestamp: recent.toISOString(),
      read: false,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([n]));
    const fresh = freshService();
    expect(fresh.history().length).toBe(1);
  });

  it('should start with empty history when localStorage contains invalid JSON', () => {
    localStorage.setItem(HISTORY_KEY, 'invalid-json{');
    const fresh = freshService();
    expect(fresh.history()).toEqual([]);
  });

  it('should start with empty history when localStorage contains non-array', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ notAnArray: true }));
    const fresh = freshService();
    expect(fresh.history()).toEqual([]);
  });

  // ── checkScoreJump() ─────────────────────────────────────────────────────────

  it('should not fire on first score observation (no previous score)', () => {
    const fired = service.checkScoreJump(70, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(false);
    expect(service.history().length).toBe(0);
  });

  it('should fire when score jumps 15+ points', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false); // baseline
    const fired = service.checkScoreJump(60, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(true);
    expect(service.history().length).toBe(1);
  });

  it('should not fire when score increases by less than 15 points', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    const fired = service.checkScoreJump(59, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(false);
  });

  it('should not fire when score decreases', () => {
    service.checkScoreJump(70, 'loc1', 'Lake Tahoe', true, false);
    const fired = service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(false);
  });

  it('should not fire when type is disabled', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', false, false);
    const fired = service.checkScoreJump(80, 'loc1', 'Lake Tahoe', false, false);
    expect(fired).toBe(false);
  });

  it('should not fire when location is muted', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, true); // muted=true
    const fired = service.checkScoreJump(80, 'loc1', 'Lake Tahoe', true, true);
    expect(fired).toBe(false);
  });

  it('should deduplicate: not fire a second score jump for same location same day', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    service.checkScoreJump(60, 'loc1', 'Lake Tahoe', true, false); // fires
    const firedAgain = service.checkScoreJump(80, 'loc1', 'Lake Tahoe', true, false);
    expect(firedAgain).toBe(false);
    expect(service.history().length).toBe(1);
  });

  it('should fire independently for different locations', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    service.checkScoreJump(45, 'loc2', 'River Bend', true, false);
    const fired1 = service.checkScoreJump(60, 'loc1', 'Lake Tahoe', true, false);
    const fired2 = service.checkScoreJump(60, 'loc2', 'River Bend', true, false);
    expect(fired1).toBe(true);
    expect(fired2).toBe(true);
    expect(service.history().length).toBe(2);
  });

  it('should include location name in score jump notification title', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    service.checkScoreJump(60, 'loc1', 'Lake Tahoe', true, false);
    expect(service.history()[0].title).toContain('Lake Tahoe');
  });

  it('should store score for next comparison even when type is disabled', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', false, false);
    service.checkScoreJump(60, 'loc1', 'Lake Tahoe', false, false);
    // enabling now — but dedup key is set so won't fire
    // Re-enable and check that stored score tracks
    const fresh = freshService(); // fresh service resets dedup
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    const fired = service.checkScoreJump(62, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(true);
  });

  // ── checkMoonMilestone() ──────────────────────────────────────────────────────

  it('should fire when approximately 3 days before full moon', () => {
    const LUNAR_CYCLE = 29.530588861;
    const moonAgeNearFull = LUNAR_CYCLE / 2 - 3; // 3 days before full moon
    const fired = service.checkMoonMilestone(moonAgeNearFull, true);
    expect(fired).toBe(true);
    expect(service.history().length).toBe(1);
  });

  it('should fire when approximately 3 days before new moon', () => {
    const LUNAR_CYCLE = 29.530588861;
    const moonAgeNearNew = LUNAR_CYCLE - 3; // 3 days before new moon
    const fired = service.checkMoonMilestone(moonAgeNearNew, true);
    expect(fired).toBe(true);
    expect(service.history().length).toBe(1);
  });

  it('should not fire when far from any milestone', () => {
    const moonAgeMidway = 7; // first quarter area
    const fired = service.checkMoonMilestone(moonAgeMidway, true);
    expect(fired).toBe(false);
  });

  it('should not fire when moon milestone type is disabled', () => {
    const LUNAR_CYCLE = 29.530588861;
    const moonAgeNearFull = LUNAR_CYCLE / 2 - 3;
    const fired = service.checkMoonMilestone(moonAgeNearFull, false);
    expect(fired).toBe(false);
  });

  it('should deduplicate moon milestone notifications per day', () => {
    const LUNAR_CYCLE = 29.530588861;
    const moonAgeNearFull = LUNAR_CYCLE / 2 - 3;
    service.checkMoonMilestone(moonAgeNearFull, true);
    const firedAgain = service.checkMoonMilestone(moonAgeNearFull, true);
    expect(firedAgain).toBe(false);
    expect(service.history().length).toBe(1);
  });

  it('should set actionUrl to /moon for moon milestone notification', () => {
    const LUNAR_CYCLE = 29.530588861;
    const moonAgeNearFull = LUNAR_CYCLE / 2 - 3;
    service.checkMoonMilestone(moonAgeNearFull, true);
    expect(service.history()[0].actionUrl).toBe('/moon');
  });

  // ── checkPressureAlert() ─────────────────────────────────────────────────────

  it('should not fire on first pressure reading', () => {
    const fired = service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(false);
    expect(service.history().length).toBe(0);
  });

  it('should fire when pressure drops more than 2 hPa', () => {
    service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', true, false);
    const fired = service.checkPressureAlert(1010, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(true);
    expect(service.history().length).toBe(1);
  });

  it('should not fire when pressure drop is 2 hPa or less', () => {
    service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', true, false);
    const fired = service.checkPressureAlert(1011, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(false);
  });

  it('should not fire when pressure rises', () => {
    service.checkPressureAlert(1010, 'loc1', 'Lake Tahoe', true, false);
    const fired = service.checkPressureAlert(1015, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(false);
  });

  it('should not fire when pressure alert type is disabled', () => {
    service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', false, false);
    const fired = service.checkPressureAlert(1005, 'loc1', 'Lake Tahoe', false, false);
    expect(fired).toBe(false);
  });

  it('should not fire when location is muted for pressure alert', () => {
    service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', true, true);
    const fired = service.checkPressureAlert(1005, 'loc1', 'Lake Tahoe', true, true);
    expect(fired).toBe(false);
  });

  it('should deduplicate pressure alerts per location per day', () => {
    service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', true, false);
    service.checkPressureAlert(1010, 'loc1', 'Lake Tahoe', true, false); // fires
    const firedAgain = service.checkPressureAlert(1005, 'loc1', 'Lake Tahoe', true, false);
    expect(firedAgain).toBe(false);
    expect(service.history().length).toBe(1);
  });

  it('should set actionUrl to /weather for pressure alert notification', () => {
    service.checkPressureAlert(1013, 'loc1', 'Lake Tahoe', true, false);
    service.checkPressureAlert(1010, 'loc1', 'Lake Tahoe', true, false);
    expect(service.history()[0].actionUrl).toBe('/weather');
  });

  // ── sendTestNotification() ───────────────────────────────────────────────────

  it('should add a test notification to history', () => {
    service.sendTestNotification();
    expect(service.history().length).toBe(1);
  });

  it('should show test notification as active toast', () => {
    service.sendTestNotification();
    expect(service.activeToast()).not.toBeNull();
  });

  // ── trigger state persistence ────────────────────────────────────────────────

  it('should persist trigger state to localStorage', () => {
    service.checkScoreJump(45, 'loc1', 'Lake Tahoe', true, false);
    const raw = localStorage.getItem(STATE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.lastScoreByLocationId['loc1']).toBe(45);
  });

  it('should load trigger state from localStorage on init', () => {
    const state = {
      lastScoreByLocationId: { loc1: 45 },
      lastPressureByLocationId: {},
      deduplicationKeys: [],
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    const fresh = freshService();
    // Now a 15+ jump from 45 should fire
    const fired = fresh.checkScoreJump(60, 'loc1', 'Lake Tahoe', true, false);
    expect(fired).toBe(true);
  });

  it('should recover gracefully from corrupt trigger state', () => {
    localStorage.setItem(STATE_KEY, 'bad-json{{{');
    expect(() => freshService()).not.toThrow();
  });
});
