import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationToastComponent } from './notification-toast.component';
import { NotificationService } from './notification.service';
import { AppNotification } from './notification.model';

describe('NotificationToastComponent', () => {
  let component: NotificationToastComponent;
  let fixture: ComponentFixture<NotificationToastComponent>;
  let notificationService: NotificationService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [NotificationToastComponent],
      providers: [{ provide: Router, useValue: router }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationToastComponent);
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

  it('should not render toast when no active toast', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="notification-toast"]')).toBeNull();
  });

  it('should render toast when active toast is set', () => {
    notificationService.notify('scoreJump', 'Score jumped!', 'Great day ahead', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="notification-toast"]')).not.toBeNull();
  });

  it('should display notification title and message', () => {
    notificationService.notify('scoreJump', 'Score jumped!', 'Great day ahead', '📈');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Score jumped!');
    expect(el.textContent).toContain('Great day ahead');
  });

  it('should display notification icon', () => {
    notificationService.notify('moonMilestone', 'Full Moon', 'In 3 days', '🌕');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('🌕');
  });

  it('should show details button when notification has actionUrl', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈', { actionUrl: '/' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="toast-details-btn"]')).not.toBeNull();
  });

  it('should not show details button when notification has no actionUrl', () => {
    notificationService.notify('locationUpdate', 'Title', 'Msg', '📬');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="toast-details-btn"]')).toBeNull();
  });

  it('should dismiss toast when dismiss button clicked', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="toast-dismiss-btn"]');
    btn.click();
    fixture.detectChanges();
    expect(notificationService.activeToast()).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="notification-toast"]')).toBeNull();
  });

  it('should navigate and dismiss when details button clicked', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈', { actionUrl: '/moon' });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="toast-details-btn"]');
    btn.click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/moon');
    expect(notificationService.activeToast()).toBeNull();
  });

  it('should apply type-specific CSS class to toast', () => {
    notificationService.notify('moonMilestone', 'Title', 'Msg', '🌕');
    fixture.detectChanges();
    const toast: HTMLElement = fixture.nativeElement.querySelector('[data-testid="notification-toast"]');
    expect(toast.className).toContain('notif-toast--moonMilestone');
  });

  it('should have role="alert" on toast', () => {
    notificationService.notify('scoreJump', 'Title', 'Msg', '📈');
    fixture.detectChanges();
    const toast: HTMLElement = fixture.nativeElement.querySelector('[data-testid="notification-toast"]');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('should start progress and update progressPercent', fakeAsync(() => {
    component.startProgress();
    tick(100);
    expect(component.progressPercent()).toBeLessThan(100);
    // Drain all pending timers/intervals to avoid leaks
    tick(10000);
  }));

  it('should clear progress interval after 5 seconds', fakeAsync(() => {
    component.startProgress();
    tick(5100);
    // After 5s the interval should have stopped and progressPercent should be 0
    expect(component.progressPercent()).toBe(0);
  }));

  it('should call clearProgress without error when no interval is running', () => {
    // clearProgress when no interval running (covers the null guard branch)
    expect(() => component.dismiss()).not.toThrow();
  });

  it('should reset progressPercent to 100 on startProgress', () => {
    component.startProgress();
    expect(component.progressPercent()).toBe(100);
  });
});
