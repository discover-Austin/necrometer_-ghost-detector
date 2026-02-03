import { Component, ChangeDetectionStrategy, signal, inject, AfterViewInit, OnDestroy, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogbookComponent } from './components/logbook/logbook.component';
import { VisionComponent } from './components/vision/vision.component';
import { ToastComponent } from './components/toast/toast.component';
import { ToolkitComponent } from './components/toolkit/toolkit.component';
import { UpgradeComponent } from './components/upgrade/upgrade.component';
import { DeviceStateService } from './services/device-state.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { AudioService } from './services/audio.service';
import { SensorService } from './services/sensor.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { LoggerService } from './services/logger.service';
import { ToastService } from './services/toast.service';
import { PermissionService } from './services/permission.service';
import { UpgradeService } from './services/upgrade.service';

type View = 'vision' | 'toolkit' | 'logbook' | 'store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LogbookComponent,
    VisionComponent,
    ToastComponent,
    ToolkitComponent,
    UpgradeComponent,
  ],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  activeView = signal<View>('vision');
  activeViewIndex = signal(0);
  isLoading = signal(false);
  error = signal<string | null>(null);

  deviceState = inject(DeviceStateService);
  audioService = inject(AudioService);
  private sensorService = inject(SensorService);
  anomalyService = inject(AnomalyDetectionService);
  private logger = inject(LoggerService);
  private toast = inject(ToastService);
  private permissionService = inject(PermissionService);
  upgradeService = inject(UpgradeService);
  private isAudioInitialized = false;

  @ViewChild('mainContent') mainContentRef!: ElementRef<HTMLElement>;

  constructor() {
    // Track new anomaly events for badge
    effect(() => {
      const events = this.anomalyService.anomalyEvents();
      if (events.length > 0 && this.activeView() !== 'logbook') {
        this.hasNewDetections.set(true);
      }
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

    effect(() => {
      const permissionState = this.sensorService.permissionState();
      if (permissionState !== 'unknown') {
        this.permissionService.updateSensors(permissionState);
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
      try {
        await this.audioService.init();
        this.isAudioInitialized = true;
      } catch (error) {
        this.logger.error('Failed to initialize audio', error);
        this.toast.warning('Audio features unavailable');
        // Mark as initialized anyway to prevent repeated attempts
        this.isAudioInitialized = true;
      }
    }
  }

  hasNewDetections = signal(false);

  viewLogbook() {
    this.initializeAudio().catch(error => {
      this.logger.error('Error during audio initialization in viewLogbook', error);
    });
    this.audioService.playUISound();
    this.activeView.set('logbook');
    this.activeViewIndex.set(2);
    this.hasNewDetections.set(false);
  }

  viewScanner() {
    this.initializeAudio().catch(error => {
      this.logger.error('Error during audio initialization in viewScanner', error);
    });
    this.audioService.playUISound();
    this.activeView.set('vision');
    this.activeViewIndex.set(0);
  }

  viewToolkit() {
    this.initializeAudio().catch(error => {
      this.logger.error('Error during audio initialization in viewToolkit', error);
    });
    this.audioService.playUISound();
    this.activeView.set('toolkit');
    this.activeViewIndex.set(1);
  }

  viewStore() {
    this.initializeAudio().catch(error => {
      this.logger.error('Error during audio initialization in viewStore', error);
    });
    this.audioService.playUISound();
    this.activeView.set('store');
    this.activeViewIndex.set(3);
  }

  onNavigationKeydown(event: KeyboardEvent, view: View) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (view === 'vision') {
        this.viewScanner();
      } else if (view === 'toolkit') {
        this.viewToolkit();
      } else if (view === 'logbook') {
        this.viewLogbook();
      } else if (view === 'store') {
        this.viewStore();
      }
    }
    // Arrow key navigation
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const order: View[] = ['vision', 'toolkit', 'logbook', 'store'];
      const currentIndex = order.indexOf(this.activeView());
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + order.length) % order.length;
      const nextView = order[nextIndex];
      if (nextView === 'vision') {
        this.viewScanner();
      } else if (nextView === 'toolkit') {
        this.viewToolkit();
      } else if (nextView === 'logbook') {
        this.viewLogbook();
      } else {
        this.viewStore();
      }
    }
  }

  skipToMain() {
    if (this.mainContentRef) {
      this.mainContentRef.nativeElement.focus();
      this.mainContentRef.nativeElement.scrollIntoView();
    }
  }

  completeOnboarding() {
    this.permissionService.completeOnboarding();
  }
}
