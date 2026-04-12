import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActiveLocationService } from '../locations/active-location.service';
import { ScoreHistoryService } from './score-history.service';
import { DailyScoreRecord, HistorySlice } from './score-history.model';

interface ChartBar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

@Component({
  selector: 'app-score-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './score-history.component.html',
  styleUrl: './score-history.component.scss',
})
export class ScoreHistoryComponent {
  private readonly historyService = inject(ScoreHistoryService);
  private readonly locationService = inject(ActiveLocationService);

  @ViewChild('detailDialog') private readonly dialogRef?: ElementRef<HTMLDialogElement>;

  readonly selectedRange = signal<7 | 14 | 30>(7);
  readonly selectedRecord = signal<DailyScoreRecord | null>(null);

  private readonly slice = computed<HistorySlice | null>(() => {
    const coords = this.locationService.coords();
    if (!coords) return null;
    return this.historyService.getHistory(coords.latitude, coords.longitude, this.selectedRange());
  });

  /** Non-null only when there are records to show. */
  readonly activeSlice = computed<HistorySlice | null>(() => {
    const s = this.slice();
    return s && s.records.length > 0 ? s : null;
  });

  readonly chartBars = computed<ChartBar[]>(() => {
    const s = this.activeSlice();
    if (!s) return [];
    // Reverse to chronological order for the chart (oldest → newest)
    const records = [...s.records].reverse();
    const count = records.length;
    const svgWidth = 300;
    const svgHeight = 80;
    const gap = 3;
    const barWidth = Math.max(4, Math.floor((svgWidth - gap * (count - 1)) / count));
    return records.map((r, i) => {
      const barH = Math.max(2, Math.round((r.score / 100) * svgHeight));
      return {
        x: i * (barWidth + gap),
        y: svgHeight - barH,
        width: barWidth,
        height: barH,
      };
    });
  });

  setRange(days: 7 | 14 | 30): void {
    this.selectedRange.set(days);
  }

  openDetail(record: DailyScoreRecord): void {
    this.selectedRecord.set(record);
    this.dialogRef?.nativeElement.showModal();
  }

  closeDetail(): void {
    this.dialogRef?.nativeElement.close();
  }

  onDialogClose(): void {
    this.selectedRecord.set(null);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
}
