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
  @Input() isLoading = false;
  @Input() error: string | null = null;

  selectedEvent = signal<AnomalyEvent | null>(null);

  selectEvent(event: AnomalyEvent) {
    if (this.selectedEvent()?.id === event.id) {
      this.selectedEvent.set(null); // Toggle off
    } else {
      this.selectedEvent.set(event);
    }
  }

  onEventKeydown(event: KeyboardEvent, anomalyEvent: AnomalyEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectEvent(anomalyEvent);
    }
  }

  formatDuration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }
}