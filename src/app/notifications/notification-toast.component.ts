import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

const TOAST_DURATION_MS = 5000;

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.scss',
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly toast = this.notificationService.activeToast;

  readonly progressPercent = signal(100);
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Restart progress bar whenever a new toast appears
  }

  ngOnDestroy(): void {
    this.clearProgress();
  }

  startProgress(): void {
    this.clearProgress();
    this.progressPercent.set(100);
    const startTime = Date.now();
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION_MS) * 100);
      this.progressPercent.set(remaining);
      if (remaining === 0) {
        this.clearProgress();
      }
    }, 50);
  }

  private clearProgress(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  dismiss(): void {
    this.clearProgress();
    this.notificationService.dismissToast();
  }

  navigate(): void {
    const t = this.toast();
    if (t?.actionUrl) {
      this.router.navigateByUrl(t.actionUrl);
    }
    this.dismiss();
  }
}
