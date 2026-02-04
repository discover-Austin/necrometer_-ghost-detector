import { Component, ChangeDetectionStrategy, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnomalyEvent } from '../../services/anomaly-detection.service';
import { SessionLogService } from '../../services/session-log.service';
import { ExportImportService } from '../../services/export-import.service';
import { MonetizationService } from '../../services/monetization.service';
import { ToastService } from '../../services/toast.service';

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
  sessionLog = inject(SessionLogService);
  exportService = inject(ExportImportService);
  monetization = inject(MonetizationService);
  toast = inject(ToastService);
  activeTab = signal<'anomalies' | 'sessions'>('anomalies');

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

  setTab(tab: 'anomalies' | 'sessions') {
    this.activeTab.set(tab);
  }

  async exportSessions(): Promise<void> {
    if (!this.monetization.isFeatureUnlocked('exportLogs')) {
      this.toast.warning('Export unlocked in the store.');
      return;
    }
    const sessions = this.sessionLog.sessions();
    const detections = sessions.flatMap(session => session.words.map(word => ({
      id: word.timestamp,
      timestamp: new Date(word.timestamp),
      name: word.word,
      type: 'signal',
      backstory: session.id,
      instability: Math.round(word.intensity * 100),
      contained: false,
      emfReading: session.peakEmf,
      glyphB64: '',
    })));
    await this.exportService.exportToJSON(detections, { sessions });
  }
}
