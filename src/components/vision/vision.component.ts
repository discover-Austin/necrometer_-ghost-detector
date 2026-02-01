import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStateService } from '../../services/device-state.service';
import { DetectedEntity, AREntity, SceneObject } from '../../types';
import { SensorService } from '../../services/sensor.service';
import { UpgradeService } from '../../services/upgrade.service';
import { GeminiService } from '../../services/gemini.service';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { AudioService } from '../../services/audio.service';
import { findNearestAnchor, computeOcclusionLevel } from '../../utils/ar-utils';

@Component({
  selector: 'app-vision',
  imports: [CommonModule],
  templateUrl: './vision.component.html',
  styleUrls: ['./vision.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() detections!: DetectedEntity[];
  deviceState = inject(DeviceStateService);
  private sensorService = inject(SensorService);
  private upgradeService = inject(UpgradeService);
  private geminiService = inject(GeminiService);
  private audioService = inject(AudioService);

  arEntities = signal<AREntity[]>([]);
  targetedEntity = signal<AREntity | null>(null);
  currentTime = signal(Date.now());

  isCameraActive = false;
  cameraPermissionError = signal<string | null>(null);
  cameraStatusMessage = signal<string | null>(null);
  private appStateListener: any | null = null;

  isScanningEnvironment = signal(false);
  scanError = signal<string | null>(null);
  sceneObjects = signal<SceneObject[]>([]);
  readonly scanCost = 5;

  private animationFrameId: number | null = null;
  private physics = {
    gravityTilt: 0.00005,
    downwardDrift: 0.00002,
    friction: 0.97,
    emfAgitation: 0.00015,
    maxSpeed: 0.2,
    sceneRepulsion: 0.0001,
    sceneRepulsionRadius: 12,
  };

  constructor() {
    effect(() => {
      this.currentTime();
    });
  }

  ngOnInit() {
    this.startCamera();
    this.startAnimationLoop();
    this.appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.cameraPermissionError() && !this.isCameraActive) {
        this.startCamera();
      }
    });
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopAnimationLoop();
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['detections']) {
      this.syncDetectionsToAREntities();
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

  async scanEnvironment() {
    if (this.isScanningEnvironment() || !this.isCameraActive) return;

    if (!this.upgradeService.spendCredits(this.scanCost)) {
      this.scanError.set(`Insufficient Credits. Requires ${this.scanCost} NC.`);
      setTimeout(() => this.scanError.set(null), 4000);
      return;
    }

    this.isScanningEnvironment.set(true);
    this.scanError.set(null);
    this.sceneObjects.set([]);

    try {
      const result = await CameraPreview.capture({ quality: 85 });
      const base64Image = (result as any).value;
      const analysisResult = await this.geminiService.analyzeScene(base64Image);
      this.sceneObjects.set(analysisResult.objects);
      setTimeout(() => this.sceneObjects.set([]), 15000);
    } catch (err) {
      console.error('Environment scan failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      this.scanError.set(`Scene analysis failed: ${message}`);
      this.upgradeService.addCredits(this.scanCost); // Refund on failure
      setTimeout(() => this.scanError.set(null), 4000);
    } finally {
      this.isScanningEnvironment.set(false);
    }
  }

  private syncDetectionsToAREntities() {
    this.arEntities.update(currentEntities => {
      const detectionMap = new Map(this.detections.map(d => [d.id, d]));
      const newEntities = this.detections
        .filter(d => !currentEntities.some(e => e.id === d.id))
        .map(d => this.createAREntity(d));

      return [
        ...currentEntities.filter(e => detectionMap.has(e.id)),
        ...newEntities
      ];
    });
  }

  private createAREntity(detection: DetectedEntity): AREntity {
    return {
      ...detection,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      ax: 0,
      ay: 0,
    };
  }

  private startAnimationLoop() {
    const animate = () => {
      this.updateAREntities();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private updateAREntities() {
    const orientation = this.sensorService.orientation();
    const gravityX = orientation ? (orientation.gamma / 90) : 0;
    const gravityY = orientation ? (Math.max(-90, Math.min(90, orientation.beta)) / 90) : 0;

    this.arEntities.update(entities => {
      let closestEntity: AREntity | null = null;
      let minDistance = 15;

      const updatedEntities = entities.map(e => {
        let { x, y, vx, vy, ax, ay } = e;

        if (e.contained) {
          vx *= 0.9;
          vy *= 0.9;
          x += vx;
          y += vy;
          return { ...e, x, y, vx, vy };
        }

        ax = gravityX * this.physics.gravityTilt;
        ay = gravityY * this.physics.gravityTilt + this.physics.downwardDrift;

        const agitation = this.deviceState.emfReading() * this.physics.emfAgitation;
        ax += (Math.random() - 0.5) * agitation;
        ay += (Math.random() - 0.5) * agitation;

        vx += ax;
        vy += ay;
        vx *= this.physics.friction;
        vy *= this.physics.friction;

        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > this.physics.maxSpeed) {
          vx = (vx / speed) * this.physics.maxSpeed;
          vy = (vy / speed) * this.physics.maxSpeed;
        }

        x += vx;
        y += vy;

        if (y > 105 || x < -5 || x > 105) {
          x = Math.random() * 80 + 10;
          y = -5;
          vx = (Math.random() - 0.5) * 0.02;
          vy = Math.random() * 0.05;
        }

        const updatedEntity = { ...e, x, y, vx, vy, ax, ay };

        const distanceToCenter = Math.sqrt(Math.pow(updatedEntity.x - 50, 2) + Math.pow(updatedEntity.y - 45, 2));
        if (distanceToCenter < minDistance) {
          minDistance = distanceToCenter;
          closestEntity = updatedEntity;
        }

        return updatedEntity;
      });

      this.targetedEntity.set(closestEntity);
      return updatedEntities;
    });
  }
}
