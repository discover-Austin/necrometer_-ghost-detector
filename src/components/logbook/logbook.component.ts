import { Component, ChangeDetectionStrategy, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnomalyEvent } from '../../services/anomaly-detection.service';

@Component({
  selector: 'app-logbook',
  imports: [CommonModule],
  templateUrl: './logbook.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogbookComponent {
  @Input() anomalyEvents: AnomalyEvent[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  selectedEvent = signal<AnomalyEvent | null>(null);

  selectEvent(event: AnomalyEvent) {
    if (this.selectedEvent()?.id === event.id) {
      this.selectedEvent.set(null); // Toggle off
    } else {
      this.selectedEvent.set(event);
    }
  }

  formatDuration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  getEventClass(event: AnomalyEvent): string {
    return 'border-spectral-500/50';
  }
}