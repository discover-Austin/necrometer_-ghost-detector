import { Component, ChangeDetectionStrategy, signal, inject, AfterViewInit, OnDestroy, computed, effect, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogbookComponent } from './components/logbook/logbook.component';
import { VisionComponent } from './components/vision/vision.component';
import { UpgradeComponent } from './components/upgrade/upgrade.component';
import { ToastComponent } from './components/toast/toast.component';
import { DeviceStateService } from './services/device-state.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { UpgradeService } from './services/upgrade.service';
import { AudioService } from './services/audio.service';
import { PersistenceService } from './services/persistence.service';
import { SensorService } from './services/sensor.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { App } from '@capacitor/app';

type View = 'vision' | 'logbook' | 'store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LogbookComponent,
    VisionComponent,
    UpgradeComponent,
    ToastComponent,
  ],
  host: {
    '[class.pro-theme]': 'upgradeService.isPro()',
  }
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private persistenceService = inject(PersistenceService);
  activeView = signal<View>('vision');
  activeViewIndex = signal(0);
  isLoading = signal(false);
  error = signal<string | null>(null);

  deviceState = inject(DeviceStateService);
  upgradeService = inject(UpgradeService);
  audioService = inject(AudioService);
  private sensorService = inject(SensorService);
  anomalyService = inject(AnomalyDetectionService);
  private isAudioInitialized = false;

  @ViewChild('mainContent') mainContentRef!: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      this.audioService.updateStaticLevel(this.deviceState.emfReading());
    });

    // Animate view changes
    effect(() => {
      this.activeView(); // depend on activeView
      if (this.mainContentRef) {
        const element = this.mainContentRef.nativeElement;
        element.classList.remove('view-fade-in');
        // Trigger reflow to restart animation
        void element.offsetWidth;
        element.classList.add('view-fade-in');
      }
    });
  }

  ngAfterViewInit() {
    SplashScreen.hide();
    this.sensorService.start();
  }

  ngOnDestroy() {
    this.sensorService.stop();
    this.anomalyService.stop();
  }
  private async initializeAudio() {
    if (!this.isAudioInitialized) {
      await this.audioService.init();
      this.isAudioInitialized = true;
    }
  }

  changeView(view: View, index: number) {
    this.initializeAudio();
    this.audioService.playUISound();
    this.activeView.set(view);
    this.activeViewIndex.set(index);
  }

  hasNewDetections = signal(false);

  trackNewDetection() {
    if (this.activeView() !== 'logbook') {
      this.hasNewDetections.set(true);
    }
  }

  viewLogbook(index: number) {
    this.initializeAudio();
    this.audioService.playUISound();
    this.changeView('logbook', index);
    this.hasNewDetections.set(false);
  }

  // Global visual effects driven by EMF reading
  globalStaticOpacity = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading < 20) return 0;
    return Math.min((reading / 100) * 0.4, 0.4);
  });

  globalNoiseOpacity = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading < 40) return 0;
    return Math.min(((reading - 40) / 60) * 0.15, 0.15);
  });
}
