import { ChangeDetectionStrategy, Component, OnDestroy, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss',
})
export class SplashScreenComponent implements OnDestroy {
  /** When set to false, triggers the exit animation then removes the overlay from the DOM. */
  readonly visible = input.required<boolean>();

  /** True while the CSS exit animation is playing. */
  protected readonly isHiding = signal(false);

  /** True after the exit animation completes; gates the @if in the template. */
  protected readonly isGone = signal(false);

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const v = this.visible();
      // Once gone, nothing can bring it back (one-way door).
      if (this.isGone()) return;

      if (!v && !this.isHiding()) {
        this.isHiding.set(true);
        // Remove from DOM after the CSS animation (400ms) plus a small buffer.
        this.hideTimer = setTimeout(() => {
          this.isGone.set(true);
        }, 450);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
    }
  }
}
