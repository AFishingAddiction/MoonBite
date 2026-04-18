import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { SharePayload, ShareResult } from './share.model';

const APP_URL = 'https://moonbite.app';

@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly doc = inject(DOCUMENT);

  private get nav(): Navigator {
    return this.doc.defaultView?.navigator as Navigator;
  }

  /** Map a 0–100 score to a fishing-condition label. */
  scoreDescription(score: number): string {
    if (score >= 70) return 'excellent fishing';
    if (score >= 50) return 'good fishing';
    if (score >= 30) return 'fair fishing';
    return 'poor fishing';
  }

  /** Build a deep-link URL for the shared location. */
  buildShareUrl(payload: SharePayload): string {
    const params = new URLSearchParams({
      lat: payload.latitude.toFixed(4),
      lng: payload.longitude.toFixed(4),
    });
    return `${APP_URL}/home?${params.toString()}`;
  }

  /** Build the human-readable share message. */
  buildShareText(payload: SharePayload): string {
    const loc =
      payload.locationName ??
      `${payload.latitude.toFixed(2)}, ${payload.longitude.toFixed(2)}`;
    const desc = this.scoreDescription(payload.score);
    const lines = [
      `🎣 MoonBite says today is a ${payload.score} — ${desc} at ${loc}!`,
      `Moon: ${payload.phaseName} (${payload.illuminationPercent}% illuminated)`,
    ];
    if (payload.bestPeakTime) {
      lines.push(`Best time: ${payload.bestPeakTime}`);
    }
    return lines.join('\n');
  }

  /** True when the browser supports the Web Share API. */
  canUseWebShare(): boolean {
    return typeof this.nav?.share === 'function';
  }

  /**
   * Share via Web Share API when available; falls back to clipboard.
   * Never throws — always resolves with a ShareResult.
   */
  async share(payload: SharePayload): Promise<ShareResult> {
    const text = this.buildShareText(payload);
    const url = this.buildShareUrl(payload);

    if (this.canUseWebShare()) {
      try {
        await this.nav.share({ title: 'MoonBite Daily Report', text, url });
        return { status: 'shared', message: 'Shared successfully' };
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { status: 'cancelled', message: 'Share cancelled' };
        }
        return { status: 'error', message: 'Share failed' };
      }
    }

    return this.copyToClipboard(`${text}\n${url}`);
  }

  /** Copy arbitrary text to the system clipboard. */
  async copyToClipboard(text: string): Promise<ShareResult> {
    try {
      await this.nav?.clipboard?.writeText(text);
      return { status: 'copied', message: 'Copied to clipboard!' };
    } catch {
      return { status: 'error', message: 'Failed to copy to clipboard' };
    }
  }
}
