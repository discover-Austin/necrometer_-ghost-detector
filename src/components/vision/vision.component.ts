import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStateService } from '../../services/device-state.service';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { App } from '@capacitor/app';
import { AnomalyDetectionService, AnomalyEvent } from '../../services/anomaly-detection.service';

@Component({
  selector: 'app-vision',
  imports: [CommonModule],
  templateUrl: './vision.component.html',
  styleUrls: ['./vision.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisionComponent implements OnInit, OnDestroy {
  deviceState = inject(DeviceStateService);
  private anomalyService = inject(AnomalyDetectionService);

  isCameraActive = false;
  cameraPermissionError = signal<string | null>(null);
  cameraStatusMessage = signal<string | null>(null);
  private appStateListener: any | null = null;

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

  ngOnInit() {
    this.startCamera();
    this.startAmbientInstability();
    this.anomalyService.start(); // Start camera analysis and anomaly detection
    this.appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.cameraPermissionError() && !this.isCameraActive) {
        this.startCamera();
      }
    });
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopAmbientInstability();
    this.anomalyService.stop();
    if (this.appStateListener) {
      this.appStateListener.remove();
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
      console.warn("Could not stop camera preview", e);
    }
  }

  private handleCameraError(err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.isCameraActive = false;
    this.cameraStatusMessage.set(null);
    if (errorMessage.toLowerCase().includes('permission')) {
      this.cameraPermissionError.set("Camera permission denied. Please enable camera access in your device settings.");
      return;
    }
    if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('requested device not found')) {
      this.cameraPermissionError.set('Camera preview not supported on this device.');
      return;
    } else {
      this.cameraPermissionError.set(`Failed to start the camera: ${errorMessage}`);
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
