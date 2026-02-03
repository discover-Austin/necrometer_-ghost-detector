import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStateService } from '../../services/device-state.service';
import { SensorService } from '../../services/sensor.service';
import { SpiritBoxService } from '../../services/spirit-box.service';
import { SessionLogService } from '../../services/session-log.service';
import { EmfLogService } from '../../services/emf-log.service';
import { MonetizationService, FeatureKey } from '../../services/monetization.service';
import { AudioAnalyzerService } from '../../services/audio-analyzer.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-toolkit',
  imports: [CommonModule],
  templateUrl: './toolkit.component.html',
  styleUrls: ['./toolkit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitComponent implements OnInit, OnDestroy {
  deviceState = inject(DeviceStateService);
  sensorService = inject(SensorService);
  spiritBox = inject(SpiritBoxService);
  sessionLog = inject(SessionLogService);
  emfLog = inject(EmfLogService);
  monetization = inject(MonetizationService);
  audioAnalyzer = inject(AudioAnalyzerService);
  toast = inject(ToastService);
  themeService = inject(ThemeService);
  permissionService = inject(PermissionService);

  activePanel = signal<'emf' | 'spirit' | 'audio' | 'session' | 'settings'>('emf');

  ngOnInit(): void {
    this.sessionLog.startSession();
    this.emfLog.start();
    this.spiritBox.start();
  }

  ngOnDestroy(): void {
    this.emfLog.stop();
    this.spiritBox.stop();
  }

  setPanel(panel: 'emf' | 'spirit' | 'audio' | 'session' | 'settings'): void {
    this.activePanel.set(panel);
  }

  unlockFeature(feature: FeatureKey): void {
    this.monetization.unlockFeatureWithCredits(feature);
  }

  grantAdUnlock(feature: FeatureKey): void {
    this.monetization.unlockFeatureWithAd(feature);
  }

  toggleSession(): void {
    if (this.sessionLog.sessionActive()) {
      this.sessionLog.endSession();
      this.toast.info('Session archived to logbook.');
      return;
    }
    this.sessionLog.startSession();
    this.toast.success('New investigation session started.');
  }

  async toggleAudioAnalyzer(): Promise<void> {
    if (this.audioAnalyzer.isActive()) {
      this.audioAnalyzer.stop();
      return;
    }
    if (!this.monetization.isFeatureUnlocked('audioAnalyzer')) {
      this.toast.warning('Audio analyzer locked.');
      return;
    }
    await this.audioAnalyzer.start();
  }

  setTheme(mode: ThemeMode): void {
    if (mode !== 'auto' && !this.monetization.isFeatureUnlocked('premiumThemes')) {
      this.toast.warning('Premium themes are locked.');
      return;
    }
    this.themeService.setMode(mode);
    this.toast.success(`Theme set to ${mode}.`);
  }
}
