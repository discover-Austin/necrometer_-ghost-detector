import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStateService } from '../../services/device-state.service';
import { SensorService } from '../../services/sensor.service';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { App } from '@capacitor/app';
import { AnomalyDetectionService, AnomalyEvent } from '../../services/anomaly-detection.service';
import { LoggerService } from '../../services/logger.service';
import { PermissionService } from '../../services/permission.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-vision',
  imports: [CommonModule],
  templateUrl: './vision.component.html',
  styleUrls: ['./vision.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisionComponent implements OnInit, OnDestroy {
  deviceState = inject(DeviceStateService);
  sensorService = inject(SensorService);
  private anomalyService = inject(AnomalyDetectionService);
  private logger = inject(LoggerService);
  private permissionService = inject(PermissionService);
  private audioService = inject(AudioService);

  isCameraActive = false;
  cameraPermissionError = signal<string | null>(null);
  cameraStatusMessage = signal<string | null>(null);
  private appStateListener: PromiseLike<{ remove(): void }> | { remove(): void } | null = null;

  // Ambient instability
  brightnessFluctuation = signal<number>(0);
  noiseOpacity = signal<number>(0.03);
  chromaticAberration = signal<number>(0);
  
  // Anomaly display
  currentAnomaly = signal<AnomalyEvent | null>(null);

  private animationFrameId: number | null = null;
  private instabilityTime = 0;

  constructor() {
    // Subscribe to anomaly events
    effect(() => {
      const anomaly = this.anomalyService.currentAnomaly();
      this.currentAnomaly.set(anomaly);
    });
  }

  async ngOnInit() {
    this.startCamera();
    this.startAmbientInstability();
    this.anomalyService.start();
    this.permissionService.updateSensors(this.deviceState.emfAvailable() ? 'granted' : 'denied');
    
    // Setup app state listener
    try {
      this.appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && this.cameraPermissionError() && !this.isCameraActive) {
          this.startCamera();
        }
      });
    } catch (error) {
      this.logger.warn('Failed to add app state listener', error);
    }
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopAmbientInstability();
    this.anomalyService.stop();
    
    // Clean up app state listener
    if (this.appStateListener) {
      if ('remove' in this.appStateListener) {
        this.appStateListener.remove();
      } else {
        // It's a Promise, wait for it then remove
        this.appStateListener.then(listener => listener.remove());
      }
    }
  }

  async startCamera() {
    if (this.isCameraActive) return;
    try {
      this.cameraStatusMessage.set('Requesting camera permission...');
      await CameraPreview.stop().catch(() => undefined);
      await CameraPreview.start({
        position: 'rear',
        toBack: false,
        parent: 'vision-camera-container',
        className: 'camera-preview',
      });
      this.isCameraActive = true;
      this.cameraPermissionError.set(null);
      this.cameraStatusMessage.set(null);
      this.permissionService.updateCamera('granted');
    } catch (e) {
      this.handleCameraError(e);
    }
  }

  async stopCamera() {
    if (!this.isCameraActive) return;
    this.isCameraActive = false;
    this.cameraStatusMessage.set(null);
    try {
      await CameraPreview.stop();
    } catch (e) {
      this.logger.warn("Could not stop camera preview", e);
    }
  }

  private handleCameraError(err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.isCameraActive = false;
    this.cameraStatusMessage.set(null);
    if (errorMessage.toLowerCase().includes('permission')) {
      this.cameraPermissionError.set("Camera permission denied. Please enable camera access in your device settings.");
      this.permissionService.updateCamera('denied');
      return;
    }
    if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('requested device not found')) {
      this.cameraPermissionError.set('Camera preview not supported on this device.');
      this.permissionService.updateCamera('denied');
      return;
    } else {
      this.cameraPermissionError.set(`Failed to start the camera: ${errorMessage}`);
      this.permissionService.updateCamera('denied');
    }
  }

  private startAmbientInstability() {
    const animate = () => {
      this.instabilityTime += 0.016; // ~60fps
      
      // Subtle brightness fluctuation (±2-4%)
      const brightnessCycle = Math.sin(this.instabilityTime * 0.5) * 0.02 + Math.sin(this.instabilityTime * 0.3) * 0.02;
      this.brightnessFluctuation.set(brightnessCycle);
      
      // Light digital noise (varies slightly)
      const noiseCycle = 0.03 + Math.sin(this.instabilityTime * 0.7) * 0.01;
      this.noiseOpacity.set(noiseCycle);
      
      // Subtle chromatic aberration at edges
      const aberrationCycle = Math.sin(this.instabilityTime * 0.4) * 0.5;
      this.chromaticAberration.set(aberrationCycle);
      this.audioService.updateStaticLevel(this.deviceState.emfReading());
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private stopAmbientInstability() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
