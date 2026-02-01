import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnDeviceEVPGeneratorService } from '../../services/on-device-evp-generator.service';
import { EVPAnalysis } from '../../types';
import { UpgradeService } from '../../services/upgrade.service';

type RecordingState = 'idle' | 'recording' | 'analyzing' | 'result' | 'error';

@Component({
  selector: 'app-evp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evp.component.html',
  styleUrls: ['./evp.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvpComponent {
  state = signal<RecordingState>('idle');
  analysisResult = signal<EVPAnalysis | null>(null);
  error = signal<string | null>(null);
  
  private evpGenerator = inject(OnDeviceEVPGeneratorService);
  private upgradeService = inject(UpgradeService);
  
  readonly analysisCost = 2;

  // Mock recording functionality
  startRecording() {
    this.state.set('recording');
    setTimeout(() => {
      this.stopRecordingAndAnalyze();
    }, 5000); // Record for 5 seconds
  }

  async stopRecordingAndAnalyze() {
    if (this.state() !== 'recording') return;

    if (!this.upgradeService.spendCredits(this.analysisCost)) {
      this.error.set(`Insufficient Credits. Analysis requires ${this.analysisCost} NC.`);
      this.state.set('error');
      return;
    }

    this.state.set('analyzing');
    this.error.set(null);

    try {
      const result = await this.evpGenerator.getEVPMessage();
      this.analysisResult.set(result);
      this.state.set('result');
    } catch (err) {
      console.error('EVP analysis failed:', err);
      this.error.set('Analysis failed. Could not isolate paranormal voice phenomena.');
      this.state.set('error');
      this.upgradeService.addCredits(this.analysisCost); // Refund
    }
  }

  reset() {
    this.state.set('idle');
    this.analysisResult.set(null);
    this.error.set(null);
  }
}
