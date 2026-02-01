import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectedEntity } from '../../types';
import { OnDeviceLogbookGeneratorService } from '../../services/on-device-logbook-generator.service';
import { UpgradeService } from '../../services/upgrade.service';
import { CrossReferenceResult, EmotionalResonanceResult, ContainmentRitual } from '../../types';

@Component({
  selector: 'app-logbook',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logbook.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogbookComponent {
  @Input() detections!: DetectedEntity[];
  @Input() isLoading!: boolean;
  @Input() error!: string | null;
  @Output() containEntity = new EventEmitter<DetectedEntity>();

  private logbookGenerator = inject(OnDeviceLogbookGeneratorService);
  private upgradeService = inject(UpgradeService);
  
  selectedEntity = signal<DetectedEntity | null>(null);
  
  // Analysis signals
  isAnalyzing = signal(false);
  crossReferenceResult = signal<CrossReferenceResult | null>(null);
  emotionalResonance = signal<EmotionalResonanceResult | null>(null);
  containmentRitual = signal<ContainmentRitual | null>(null);
  analysisError = signal<string | null>(null);

  selectEntity(entity: DetectedEntity) {
    this.selectedEntity.set(entity);
    this.resetAnalysis();
  }

  deselectEntity() {
    this.selectedEntity.set(null);
    this.resetAnalysis();
  }

  resetAnalysis() {
    this.isAnalyzing.set(false);
    this.crossReferenceResult.set(null);
    this.emotionalResonance.set(null);
    this.containmentRitual.set(null);
    this.analysisError.set(null);
  }

  async runAnalysis(type: 'cross-reference' | 'resonance' | 'ritual') {
    if (!this.selectedEntity() || this.isAnalyzing()) return;

    const cost = 5;
    if (!this.upgradeService.spendCredits(cost)) {
      this.analysisError.set(`Insufficient Credits. Requires ${cost} NC.`);
      return;
    }

    this.isAnalyzing.set(true);
    this.analysisError.set(null);

    try {
      switch (type) {
        case 'cross-reference':
          const crResult = await this.logbookGenerator.crossReferenceEntity(this.selectedEntity()!.name);
          this.crossReferenceResult.set(crResult);
          break;
        case 'resonance':
          const erResult = await this.logbookGenerator.getEmotionalResonance(this.selectedEntity()!.name);
          this.emotionalResonance.set(erResult);
          break;
        case 'ritual':
          const ritualResult = await this.logbookGenerator.getContainmentRitual(this.selectedEntity()!.name);
          this.containmentRitual.set(ritualResult);
          break;
      }
    } catch (err) {
      console.error(`Analysis failed for type: ${type}`, err);
      this.analysisError.set('Analysis failed. Spectral interference.');
      this.upgradeService.addCredits(cost); // Refund
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  initiateContainment(entity: DetectedEntity) {
    this.containEntity.emit(entity);
  }
}