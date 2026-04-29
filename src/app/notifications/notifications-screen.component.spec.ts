import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationsScreenComponent } from './notifications-screen.component';
import { NotificationService } from './notification.service';

describe('NotificationsScreenComponent', () => {
  let component: NotificationsScreenComponent;
  let fixture: ComponentFixture<NotificationsScreenComponent>;
  let notificationService: NotificationService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [NotificationsScreenComponent],
      providers: [{ provide: Router, useValue: router }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsScreenComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no notifications', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="empty-state"]')).not.toBeNull();
  });

  it('should not show empty state when notifications exist', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="empty-state"]')).toBeNull();
  });

  it('should show notification items', () => {
    notificationService.notify('scoreJump', 'Score jumped!', 'Great day', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('[data-testid="notification-item"]').length).toBe(1);
  });

  it('should display notification title and message', () => {
    notificationService.notify('scoreJump', 'Score jumped!', 'Great fishing ahead', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Score jumped!');
    expect(el.textContent).toContain('Great fishing ahead');
  });

  it('should group multiple notifications by date', () => {
    notificationService.notify('scoreJump', 'First', 'Msg', '📈');
    notificationService.notify('moonMilestone', 'Second', 'Msg', '🌕');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    // Both on today so single group "Today"
    const groups = el.querySelectorAll('.notif-screen__group-label');
    expect(groups.length).toBe(1);
    expect(groups[0].textContent?.trim()).toBe('Today');
  });

  it('should mark notification as read on navigate', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈', { actionUrl: '/' });
    fixture.detectChanges();
    const id = notificationService.history()[0].id;
    expect(notificationService.history()[0].read).toBe(false);

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.notif-screen__item-btn');
    btn.click();

    expect(notificationService.history()[0].read).toBe(true);
  });

  it('should navigate to actionUrl when notification item clicked', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈', { actionUrl: '/moon' });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.notif-screen__item-btn');
    btn.click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/moon');
  });

  it('should show mark-all-read button when there are unread notifications', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="mark-all-read-btn"]')).not.toBeNull();
  });

  it('should mark all notifications as read when button clicked', () => {
    notificationService.notify('scoreJump', 'A', 'Msg', '📈');
    notificationService.notify('moonMilestone', 'B', 'Msg', '🌕');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="mark-all-read-btn"]');
    btn.click();
    expect(notificationService.unreadCount()).toBe(0);
  });

  it('should clear all notifications when clear button clicked', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="clear-all-btn"]');
    btn.click();
    fixture.detectChanges();
    expect(notificationService.history().length).toBe(0);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="empty-state"]')).not.toBeNull();
  });

  it('should show unread dot for unread notifications', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.notif-screen__unread-dot')).not.toBeNull();
  });

  it('should not show unread dot for read notifications', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    notificationService.markAllRead();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.notif-screen__unread-dot')).toBeNull();
  });

  // ── groups() computed ──────────────────────────────────────────────────────

  it('should return empty array when history is empty', () => {
    expect(component.groups()).toEqual([]);
  });

  it('should group todays notifications under "Today"', () => {
    notificationService.notify('scoreJump', 'A', 'Msg', '📈');
    const groups = component.groups();
    expect(groups.length).toBe(1);
    expect(groups[0].label).toBe('Today');
  });

  it('should group yesterday notifications under "Yesterday"', () => {
    // Inject a notification with yesterday's timestamp directly
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isoYesterday = yesterday.toISOString();
    localStorage.setItem(
      'moonbite_notifications',
      JSON.stringify([
        { id: 'y1', type: 'scoreJump', title: 'Old', message: 'Msg', icon: '📈',
          timestamp: isoYesterday, read: false },
      ]),
    );
    // Re-create service so it loads from storage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });
    const freshNotifService = TestBed.inject(NotificationService);
    const freshFixture = TestBed.createComponent(NotificationsScreenComponent);
    freshFixture.detectChanges();
    const freshComp = freshFixture.componentInstance;
    const groups = freshComp.groups();
    expect(groups.some(g => g.label === 'Yesterday')).toBe(true);
  });

  it('should group older notifications under a formatted date', () => {
    const older = new Date();
    older.setDate(older.getDate() - 5);
    const isoOlder = older.toISOString();
    localStorage.setItem(
      'moonbite_notifications',
      JSON.stringify([
        { id: 'o1', type: 'pressureAlert', title: 'Old', message: 'Msg', icon: '📉',
          timestamp: isoOlder, read: false },
      ]),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });
    const freshFixture = TestBed.createComponent(NotificationsScreenComponent);
    freshFixture.detectChanges();
    const groups = freshFixture.componentInstance.groups();
    // Should be neither "Today" nor "Yesterday"
    expect(groups.some(g => g.label !== 'Today' && g.label !== 'Yesterday')).toBe(true);
  });

  it('should format time correctly', () => {
    const result = component.formatTime('2026-04-19T14:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
