import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification } from './notification.model';
import { NotificationService } from './notification.service';

interface NotificationGroup {
  readonly label: string;
  readonly notifications: AppNotification[];
}

@Component({
  selector: 'app-notifications-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './notifications-screen.component.html',
  styleUrl: './notifications-screen.component.scss',
})
export class NotificationsScreenComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly history = this.notificationService.history;
  readonly unreadCount = this.notificationService.unreadCount;

  readonly groups = computed<NotificationGroup[]>(() => {
    const notifications = this.history();
    if (notifications.length === 0) return [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const buckets = new Map<string, AppNotification[]>();

    for (const n of notifications) {
      const dateStr = n.timestamp.slice(0, 10);
      let label: string;
      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      } else {
        label = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!buckets.has(label)) {
        buckets.set(label, []);
      }
      buckets.get(label)!.push(n);
    }

    return Array.from(buckets.entries()).map(([label, notifs]) => ({ label, notifications: notifs }));
  });

  markRead(id: string): void {
    this.notificationService.markRead(id);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  clearHistory(): void {
    this.notificationService.clearHistory();
  }

  navigate(notification: AppNotification): void {
    this.markRead(notification.id);
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
