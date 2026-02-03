import { Component, ChangeDetectionStrategy, signal, inject, AfterViewInit, OnDestroy, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogbookComponent } from './components/logbook/logbook.component';
import { VisionComponent } from './components/vision/vision.component';
import { ToastComponent } from './components/toast/toast.component';
import { DeviceStateService } from './services/device-state.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { AudioService } from './services/audio.service';
import { SensorService } from './services/sensor.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';

type View = 'vision' | 'logbook';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LogbookComponent,
    VisionComponent,
    ToastComponent,
  ],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  activeView = signal<View>('vision');
  activeViewIndex = signal(0);

  deviceState = inject(DeviceStateService);
  audioService = inject(AudioService);
  private sensorService = inject(SensorService);
  anomalyService = inject(AnomalyDetectionService);
  private isAudioInitialized = false;

  @ViewChild('mainContent') mainContentRef!: ElementRef<HTMLElement>;

  constructor() {
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

  hasNewDetections = signal(false);

  trackNewDetection() {
    if (this.activeView() !== 'logbook') {
      this.hasNewDetections.set(true);
    }
  }

  viewLogbook() {
    this.initializeAudio();
    this.audioService.playUISound();
    this.activeView.set('logbook');
    this.activeViewIndex.set(1);
    this.hasNewDetections.set(false);
  }

  viewScanner() {
    this.initializeAudio();
    this.audioService.playUISound();
    this.activeView.set('vision');
    this.activeViewIndex.set(0);
  }
}
