
import { Component, ChangeDetectionStrategy, Output, EventEmitter, signal, computed, inject, effect, OnDestroy, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectionEvent, DetectedEntity, AREntity, SceneObject, TemporalEcho } from '../../types';
import { SpectralMapComponent } from '../spectral-map/spectral-map.component';
import { GeoTriangulatorComponent } from '../geo-triangulator/geo-triangulator.component';
import { DeviceStateService } from '../../services/device-state.service';
import { SensorService } from '../../services/sensor.service';
import { UpgradeService } from '../../services/upgrade.service';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { OnDeviceEchoGeneratorService } from '../../services/on-device-echo-generator.service';

@Component({
  selector: 'app-master-scanner',
  standalone: true,
  imports: [CommonModule, SpectralMapComponent, GeoTriangulatorComponent],
  templateUrl: './master-scanner.component.html',
  styleUrls: ['./master-scanner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasterScannerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() detections!: DetectedEntity[];
  @Output() detection = new EventEmitter<DetectionEvent>();
  
  // Scanner properties
  status = signal('CALIBRATING...');
  private lastDetectionTime = 0;

  // Vision properties
  arEntities = signal<AREntity[]>([]);
  targetedEntity = signal<AREntity | null>(null);
  isCameraActive = false;
  cameraPermissionError = signal<string | null>(null);
  isScanningEnvironment = signal(false);
  scanError = signal<string | null>(null);
  sceneObjects = signal<SceneObject[]>([]);
  readonly scanCost = 5;

  // Echoes properties
  isScanningEcho = signal(false);
  echoError = signal<string | null>(null);
  temporalEcho = signal<TemporalEcho | null>(null);
  readonly echoScanCost = 3;

  // Services
  deviceState = inject(DeviceStateService);
  private sensorService = inject(SensorService);
  private upgradeService = inject(UpgradeService);
  private echoGenerator = inject(OnDeviceEchoGeneratorService);

  private appStateListener: PluginListenerHandle | null = null;
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
    // Scanner effect
    effect(() => {
      const reading = this.deviceState.emfReading();
      this.updateStatus(reading);
  
      const detectionCooldown = 10000; // 10 seconds
      const now = Date.now();
      
      if (reading > 90 && (now - this.lastDetectionTime > detectionCooldown)) {
        this.triggerDetection(reading);
        this.lastDetectionTime = now;
        this.deviceState.emfReading.set(20); 
      }
    });
  }

  async ngOnInit() {
    this.startCamera();
    this.startAnimationLoop();
    this.appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.cameraPermissionError() && !this.isCameraActive) {
        this.startCamera();
      }
    });
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopAnimationLoop();
    this.appStateListener?.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['detections']) {
      this.syncDetectionsToAREntities();
    }
  }

  // Scanner methods
  updateStatus(reading: number) {
    if (reading < 10) this.status.set('SYSTEM NOMINAL');
    else if (reading < 40) this.status.set('TRACE ENERGY DETECTED');
    else if (reading < 75) this.status.set('MODERATE FIELD DISTURBANCE');
    else if (reading < 90) this.status.set('HIGH EMF WARNING');
    else this.status.set('!!! CRITICAL EVENT IMMINENT !!!');
  }

  triggerDetection(reading: number) {
    let strength: DetectionEvent['strength'] = 'weak';
    if (reading > 98) strength = 'critical';
    else if (reading > 95) strength = 'strong';
    else if (reading > 90) strength = 'moderate';
    
    this.detection.emit({ emf: parseFloat(reading.toFixed(2)), strength });
  }

  // Vision methods
  async startCamera() {
    if (this.isCameraActive) return;
    try {
      await CameraPreview.start({
        position: 'rear',
        toBack: true,
        parent: 'master-scanner-camera-container',
      });
      this.isCameraActive = true;
      this.cameraPermissionError.set(null);
    } catch (e) {
      this.handleCameraError(e);
    }
  }

  async stopCamera() {
    if (!this.isCameraActive) return;
    this.isCameraActive = false;
    try {
      await CameraPreview.stop();
    } catch (e) {
      console.warn("Could not stop camera preview", e);
    }
  }

  private handleCameraError(err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.toLowerCase().includes('permission')) {
      this.cameraPermissionError.set("Camera permission denied. Please enable camera access in your device settings.");
    } else {
      this.cameraPermissionError.set("Failed to start the camera. Please ensure permissions are granted and try again.");
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

    // On-device simulation of environment scan
    setTimeout(() => {
      const reading = this.deviceState.emfReading();
      const objects: SceneObject[] = [];
      if (reading > 20) objects.push({ name: 'Cold Spot', confidence: Math.random() * 0.5 + 0.3 });
      if (reading > 50) objects.push({ name: 'Electronic Interference', confidence: Math.random() * 0.6 + 0.4 });
      if (reading > 80) objects.push({ name: 'Anomalous Object', confidence: Math.random() * 0.7 + 0.3 });
      
      this.sceneObjects.set(objects);
      this.isScanningEnvironment.set(false);
      setTimeout(() => this.sceneObjects.set([]), 10000);
    }, 1500 + Math.random() * 1000);
  }

  // Echoes methods
  async scanForEcho() {
    this.temporalEcho.set(null);
    this.echoError.set(null);

    if (!this.upgradeService.spendCredits(this.echoScanCost)) {
      this.echoError.set(`Insufficient Credits. Scan requires ${this.echoScanCost} NC.`);
      this.isScanningEcho.set(false);
      return;
    }

    this.isScanningEcho.set(true);

    try {
      const result = await this.echoGenerator.generateEcho();
      this.temporalEcho.set(result);
    } catch (err) {
      console.error('Temporal Echo scan failed:', err);
      this.echoError.set('Failed to resolve temporal distortions.');
      this.upgradeService.addCredits(this.echoScanCost); // Refund
    } finally {
      this.isScanningEcho.set(false);
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

  // Computed properties for template
  barColorClass = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading > 90) return 'bg-red-500';
    if (reading > 75) return 'bg-yellow-500';
    if (reading > 40) return 'bg-teal-400';
    return 'bg-green-500';
  });

   statusColorClass = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading > 90) return 'text-red-400 animate-pulse';
    if (reading > 75) return 'text-yellow-400';
    if (reading > 40) return 'text-teal-300';
    return 'text-green-400';
  });

  backgroundDistortionOpacity = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading < 10) return 0;
    return Math.min((reading / 100) * 0.3, 0.3);
  });
}
