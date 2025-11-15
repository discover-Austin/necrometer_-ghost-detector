import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectedEntity, CrossReferenceResult, EmotionalResonanceResult, ContainmentRitual } from '../../types';
import { UpgradeService } from '../../services/upgrade.service';
import { GeminiService } from '../../services/gemini.service';
import { AudioService } from '../../services/audio.service';
import { ExportImportService } from '../../services/export-import.service';
import { ShareService } from '../../services/share.service';
import { AnalyticsService } from '../../services/analytics.service';
import { HapticService } from '../../services/haptic.service';
import { ToastService } from '../../services/toast.service';

type LabState = 'idle' | 'cross-referencing' | 'scanning-resonance' | 'containing';

@Component({
  selector: 'app-logbook',
  imports: [CommonModule],
  templateUrl: './logbook.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogbookComponent {
  @Input() detections: DetectedEntity[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Output() containEntity = new EventEmitter<DetectedEntity>();

  selectedEntity = signal<DetectedEntity | null>(null);
  labState = signal<LabState>('idle');
  labError = signal<string | null>(null);
  showActions = signal(false);

  crossReferenceResult = signal<CrossReferenceResult | null>(null);
  emotionalResonanceResult = signal<EmotionalResonanceResult | null>(null);
  containmentResult = signal<ContainmentRitual | null>(null);

  private upgradeService = inject(UpgradeService);
  private geminiService = inject(GeminiService);
  private audioService = inject(AudioService);
  private exportImport = inject(ExportImportService);
  private share = inject(ShareService);
  private analytics = inject(AnalyticsService);
  private haptic = inject(HapticService);
  private toast = inject(ToastService);

  selectEntity(entity: DetectedEntity) {
    if (this.selectedEntity()?.id === entity.id) {
      this.selectedEntity.set(null); // Toggle off
    } else {
      this.selectedEntity.set(entity);
      // Reset lab state when a new entity is selected
      this.labError.set(null);
      this.crossReferenceResult.set(null);
      this.emotionalResonanceResult.set(null);
      this.containmentResult.set(null);
      this.labState.set('idle');
    }
  }

  runCrossReference() {
    const cost = 1;
    if (!this.upgradeService.spendCredits(cost)) {
      this.labError.set(`Insufficient Credits. Requires ${cost} NC.`);
      return;
    }
    this.labState.set('cross-referencing');
    this.labError.set(null);
    this.geminiService.crossReferenceEntity(this.selectedEntity()!)
      .then(result => {
        this.crossReferenceResult.set(result);
        this.audioService.playSuccessSound();
      })
      .catch(() => this.labError.set('Database connection failed.'))
      .finally(() => this.labState.set('idle'));
  }

  runEmotionalResonanceScan() {
    const cost = 2;
     if (!this.upgradeService.spendCredits(cost)) {
      this.labError.set(`Insufficient Credits. Requires ${cost} NC.`);
      return;
    }
    this.labState.set('scanning-resonance');
    this.labError.set(null);
    this.geminiService.getEmotionalResonance(this.selectedEntity()!)
      .then(result => {
        this.emotionalResonanceResult.set(result);
        this.audioService.playSuccessSound();
      })
      .catch(() => this.labError.set('Resonance scan failed.'))
      .finally(() => this.labState.set('idle'));
  }
  
  runContainmentRitual() {
    const cost = 10;
    const entity = this.selectedEntity();
    if (!entity) return;

    if (!this.upgradeService.spendCredits(cost)) {
      this.labError.set(`Insufficient Credits. Requires ${cost} NC.`);
      return;
    }
    this.labState.set('containing');
    this.labError.set(null);
    this.geminiService.getContainmentRitual(entity)
      .then(result => {
        this.containmentResult.set(result);
        this.containEntity.emit(entity);
        this.audioService.playContainSound();
      })
      .catch(() => this.labError.set('Containment ritual failed. Energy field unstable.'))
      .finally(() => this.labState.set('idle'));
  }

  getEntryClass(entity: DetectedEntity): string {
    if (entity.contained) {
      return 'border-blue-400/80';
    }
    if (entity.emfReading > 98) return 'border-red-500/50';
    if (entity.emfReading > 95) return 'border-yellow-500/50';
    if (entity.emfReading > 90) return 'border-teal-400/50';
    return 'border-[var(--color-primary-500)]/50';
  }

  // Computed statistics
  totalDetections = computed(() => this.detections.length);
  containedCount = computed(() => this.detections.filter(d => d.contained).length);
  activeThreats = computed(() => this.detections.filter(d => !d.contained).length);

  toggleActions() {
    this.showActions.update(v => !v);
    this.haptic.light();
  }

  async exportJSON() {
    try {
      await this.exportImport.exportToJSON(this.detections);
      this.analytics.trackEvent('export_logbook', 'data', { format: 'json', count: this.detections.length });
      this.toast.success('Logbook exported to JSON');
      this.haptic.medium();
    } catch (error) {
      this.toast.error('Failed to export logbook');
      this.analytics.trackError('export_failed', 'logbook');
    }
  }

  async exportCSV() {
    try {
      await this.exportImport.exportToCSV(this.detections);
      this.analytics.trackEvent('export_logbook', 'data', { format: 'csv', count: this.detections.length });
      this.toast.success('Logbook exported to CSV');
      this.haptic.medium();
    } catch (error) {
      this.toast.error('Failed to export logbook');
      this.analytics.trackError('export_failed', 'logbook');
    }
  }

  async shareEntity() {
    const entity = this.selectedEntity();
    if (!entity) return;

    try {
      await this.share.shareEntity(entity);
      this.analytics.trackEvent('share_entity', 'social', { entityType: entity.type });
      this.haptic.light();
    } catch (error) {
      this.toast.error('Failed to share entity');
    }
  }

  async shareAll() {
    try {
      await this.share.shareMultipleEntities(this.detections);
      this.analytics.trackEvent('share_all_entities', 'social', { count: this.detections.length });
      this.toast.success('Logbook shared successfully');
      this.haptic.medium();
    } catch (error) {
      this.toast.error('Failed to share logbook');
    }
  }
}