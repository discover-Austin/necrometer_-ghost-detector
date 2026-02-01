import { Component, ChangeDetectionStrategy, signal, inject, AfterViewInit, OnDestroy, computed, effect, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterScannerComponent } from './components/master-scanner/master-scanner.component';
import { LogbookComponent } from './components/logbook/logbook.component';
import { EvpComponent } from './components/evp/evp.component';
import { UpgradeComponent } from './components/upgrade/upgrade.component';
import { VisionComponent } from './components/vision/vision.component';
import { OnDeviceProfileGeneratorService } from './services/on-device-profile-generator.service';
import { DetectedEntity, DetectionEvent } from './types';
import { DeviceStateService } from './services/device-state.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { UpgradeService } from './services/upgrade.service';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { AudioService } from './services/audio.service';
import { PersistenceService } from './services/persistence.service';
import { SensorService } from './services/sensor.service';
import { PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';

type View = 'scanner' | 'vision' | 'logbook' | 'evp' | 'echoes' | 'store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MasterScannerComponent,
    LogbookComponent,
    EvpComponent,
    UpgradeComponent,
    VisionComponent,
  ],
  host: {
    '[class.pro-theme]': 'upgradeService.isPro()',
  }
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private persistenceService = inject(PersistenceService);
    activeView = signal<View>('scanner');
    activeViewIndex = signal(0);
    detections = signal<DetectedEntity[]>(this.persistenceService.loadDetections());
    isLoading = signal(false);
    error = signal<string | null>(null);
    manifestationImage = signal<string | null>(null);
    cameraPermissionError = signal<string | null>(null);
    
    private profileGenerator = inject(OnDeviceProfileGeneratorService);
    deviceState = inject(DeviceStateService);
    upgradeService = inject(UpgradeService);
    audioService = inject(AudioService);
    private sensorService = inject(SensorService);
    isCameraActive = false;
    private isAudioInitialized = false;
    private appStateListener: any | null = null;
  
    @ViewChild('mainContent') mainContentRef!: ElementRef<HTMLElement>;
  
      constructor() {
        effect(() => {
          this.audioService.updateStaticLevel(this.deviceState.emfReading());
        });
    
        // Save detections to local storage whenever they change
        effect(() => {
          this.persistenceService.saveDetections(this.detections());
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
      }  
    private async initializeAudio() {
      if (!this.isAudioInitialized) {
        await this.audioService.init();
        this.isAudioInitialized = true;
      }
    }
  
    async startCamera() {
      if (this.isCameraActive) return;
  
      const attemptStart = async (position: 'rear' | 'front') => {
        const cameraPreviewOptions: CameraPreviewOptions = {
          position,
          toBack: true,
          parent: 'camera-container',
          className: 'camera-preview-class',
        };
        await CameraPreview.start(cameraPreviewOptions);
      };
  
      try {
        // First, try to get the rear camera
        await attemptStart('rear');
        this.isCameraActive = true;
        this.cameraPermissionError.set(null);
      } catch (rearError) {
        const rearErrorMessage = rearError instanceof Error ? rearError.message : String(rearError);
        
        if (rearErrorMessage.toLowerCase().includes('requested device not found')) {
          console.warn("Rear camera not found, attempting front camera.");
          try {
            // Fallback to the front camera
            await attemptStart('front');
            this.isCameraActive = true;
            this.cameraPermissionError.set(null);
          } catch (frontError) {
             const frontErrorMessage = frontError instanceof Error ? frontError.message : String(frontError);
             if (frontErrorMessage.toLowerCase().includes('requested device not found')) {
                // If front camera also fails with "not found", gracefully fail without an error overlay.
                // This is common in web/dev environments.
                console.warn("No camera device found (tried rear and front). Proceeding without camera preview.");
                this.isCameraActive = false;
                this.cameraPermissionError.set(null); // Ensure no error is shown
             } else {
               // It was a different error with the front camera (like permissions)
               console.error("Error starting front camera preview:", frontError);
               this.handleCameraError(frontError);
             }
          }
        } else {
          // Handle other errors from the rear camera attempt (like permission denied)
           console.error("Error starting rear camera preview:", rearError);
          this.handleCameraError(rearError);
        }
      }
    }
  
    private handleCameraError(err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.toLowerCase().includes('permission')) {
        this.cameraPermissionError.set("Camera permission has been denied. To use the Necrometer, please enable camera access in your device or browser's app settings.");
      } else if (errorMessage.toLowerCase().includes('requested device not found')) {
         this.cameraPermissionError.set("No suitable camera was found on your device. The Necrometer requires a camera to function.");
      }
    }
  
    async stopCamera() {
      if (!this.isCameraActive) return;
      this.isCameraActive = false;
      try {
          await CameraPreview.stop();
      } catch(e) {
          console.warn("Could not stop camera preview", e);
      }
    }
  
    handleDetection(event: DetectionEvent) {
      if (this.isLoading()) return;
      
      this.isLoading.set(true);
      this.error.set(null);
      this.activeView.set('logbook');
      this.audioService.playDetectionSound();
  
      const strengthValue = {
        'weak': 25,
        'moderate': 50,
        'strong': 75,
        'critical': 100
      }[event.strength];

      this.profileGenerator.generateProfile(strengthValue)
        .then(profile => {
          const newDetection: DetectedEntity = {
            ...profile,
            id: Date.now(),
            timestamp: new Date(),
            emfReading: event.emf,
            contained: false,
            instability: Math.random() * 100
          };
          this.detections.update(currentDetections => [newDetection, ...currentDetections]);
          this.trackNewDetection();
        })
        .catch(err => {
          console.error('Error getting entity profile:', err);
          this.error.set('On-device analysis failed. The connection to the spectral plane may be unstable.');
        })
        .finally(() => {
          this.isLoading.set(false);
        });
    }
  
    handleContainEntity(entityToContain: DetectedEntity) {
      this.detections.update(currentDetections =>
        currentDetections.map(d =>
          d.id === entityToContain.id ? { ...d, contained: true, instability: 0 } : d
        )
      );
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