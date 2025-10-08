import { Component, ChangeDetectionStrategy, inject, signal, input, effect, OnDestroy, OnInit, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStateService } from '../../services/device-state.service';
import { DetectedEntity, AREntity, SceneObject } from '../../types';
import { SensorService } from '../../services/sensor.service';
import { UpgradeService } from '../../services/upgrade.service';
import { GeminiService } from '../../services/gemini.service';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { Capacitor } from '@capacitor/core';
import { findNearestAnchor, computeOcclusionLevel } from '../../utils/ar-utils';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-vision',
  imports: [CommonModule],
  templateUrl: './vision.component.html',
  styleUrls: ['./vision.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisionComponent implements OnInit, OnDestroy {
  detections = input.required<DetectedEntity[]>();
  deviceState = inject(DeviceStateService);
  private sensorService = inject(SensorService);
  private upgradeService = inject(UpgradeService);
  private geminiService = inject(GeminiService);
  private audioService = inject(AudioService);

  arEntities = signal<AREntity[]>([]);
  targetedEntity = signal<AREntity | null>(null);
  currentTime = signal(Date.now());

  // State for environmental scanning
  isScanningEnvironment = signal(false);
  scanError = signal<string | null>(null);
  sceneObjects = signal<SceneObject[]>([]);
  readonly scanCost = 5;

  private animationFrameId: number | null = null;
  // Web fallback elements and stream
  @ViewChild('webPreview', { static: true }) private webPreviewRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('visionRoot', { static: true }) private visionRootRef?: ElementRef<HTMLElement>;
  private webVideoEl: HTMLVideoElement | null = null;
  private webCanvasEl: HTMLCanvasElement | null = null;
  private webStream: MediaStream | null = null;
  private previewMode: 'native' | 'web' | null = null;
  private webVideoCreatedByComponent = false;
  private visibilityObserver: IntersectionObserver | null = null;
  // Permission / preview state
  cameraPermissionDenied = signal(false);
  private previewStartedByVisibility = false;
  // Preview enabled setting (persisted)
  previewEnabled = signal<boolean>(true);
  
  private physics = {
    gravityTilt: 0.00005,
    downwardDrift: 0.00002,
    friction: 0.97,
    emfAgitation: 0.00015,
    maxSpeed: 0.2,
    // Properties for scene interaction - tuned for subtlety
    sceneRepulsion: 0.0001, // Reduced force for a more subtle push
    sceneRepulsionRadius: 12,   // Increased radius for a wider, gentler interaction field
  };
  
  constructor() {
    effect(() => {
      const currentDets = this.detections();
      
      this.arEntities.update(oldArEntities => {
        const oldArEntitiesMap = new Map(oldArEntities.map(e => [e.id, e]));
        
        return currentDets.map(detection => {
          const existingArEntity = oldArEntitiesMap.get(detection.id);
          
          if (existingArEntity) {
            return Object.assign({}, existingArEntity, detection);
          } else {
            const { x, y } = this.getNewSpawnPosition();
            // Deterministic nearest-anchor selection
            const scene = this.sceneObjects();
            const potentialAnchor = scene.length > 0 ? findNearestAnchor(scene, x, y) : null;
            const anchor = potentialAnchor ? {
              objectIndex: potentialAnchor.objectIndex,
              polylineIndex: potentialAnchor.polylineIndex,
              pointIndex: potentialAnchor.pointIndex,
              baseX: potentialAnchor.baseX,
              baseY: potentialAnchor.baseY,
              offsetX: potentialAnchor.offsetX,
              offsetY: potentialAnchor.offsetY,
              depth: potentialAnchor.depth
            } : undefined;

            return Object.assign({}, detection, {
              x,
              y,
              vx: (Math.random() - 0.5) * 0.05,
              vy: (Math.random() - 0.5) * 0.05,
              ax: 0,
              ay: 0,
              anchor,
              occluded: false,
              scale: 1 + (Math.random() - 0.5) * 0.18, // human height variance
              rotation: (Math.random() - 0.5) * 6, // small tilt
              bobPhase: Math.random() * Math.PI * 2,
              leftArmAngle: (Math.random() - 0.5) * 10,
              rightArmAngle: (Math.random() - 0.5) * 10,
              leftLegAngle: (Math.random() - 0.5) * 8,
              rightLegAngle: (Math.random() - 0.5) * 8,
              blink: Math.random() * 0.2,
              mouthOpen: Math.random() * 0.2,
            });
          }
        });
      });
    });
  }

  /**
   * Ray-casting point-in-polygon test for polygons expressed as arrays of {x,y} in percent coords.
   */
  private pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.0000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  ngOnInit() {
    this.startAnimationLoop();
    // Load previewEnabled from localStorage
    try {
      const stored = localStorage.getItem('necrometer.previewEnabled');
      if (stored !== null) this.previewEnabled.set(stored === 'true');
    } catch {}

    // Lazy start preview only when the component becomes visible
    try {
      if (this.visionRootRef && this.visionRootRef.nativeElement) {
        this.visibilityObserver = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              // visible -> start preview (only if enabled)
              if (!this.previewEnabled()) return;
              this.startPreview().then(() => {
                this.previewStartedByVisibility = true;
              }).catch(err => {
                console.warn('Lazy preview start failed:', err);
                if (err && (err.name === 'NotAllowedError' || /permission/i.test(String(err)))) {
                  this.cameraPermissionDenied.set(true);
                }
                this.scanError.set('Camera preview unavailable. Scans will still attempt a one-shot capture.');
                setTimeout(() => this.scanError.set(null), 4000);
              });
            } else {
              // not visible -> stop preview if it was started by visibility observer
              if (this.previewStartedByVisibility) {
                (async () => {
                  try {
                    if (this.previewMode === 'native') {
                      try { await CameraPreview.stop(); } catch {};
                    }
                  } catch {}
                  this.stopWebPreview();
                  this.previewMode = null;
                })();
                this.previewStartedByVisibility = false;
              }
            }
          }
        }, { threshold: 0.25 });
        this.visibilityObserver.observe(this.visionRootRef.nativeElement);
      } else {
        // Fallback to immediate start if we can't observe
        if (this.previewEnabled()) {
          this.startPreview().catch(err => {
            console.warn('Persistent preview start failed (no observer):', err);
          });
        }
      }
    } catch (e) {
      console.warn('Error setting up visibility observer:', e);
    }
  }

  ngOnDestroy() {
    this.stopAnimationLoop();
    // Stop any active preview
    (async () => {
      try {
        if (this.previewMode === 'native') {
          try { await CameraPreview.stop(); } catch {};
        }
      } catch {}
      this.stopWebPreview();
      this.previewMode = null;
    })();
    if (this.visibilityObserver && this.visionRootRef && this.visionRootRef.nativeElement) {
      try { this.visibilityObserver.unobserve(this.visionRootRef.nativeElement); } catch {}
      try { this.visibilityObserver.disconnect(); } catch {}
    }
  }

  distortionLevel = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading < 40) return 0;
    if (reading > 95) return 10;
    return Math.floor(((reading - 40) / 55) * 8) + 1; // 1-9 scale
  });

  async scanEnvironment() {
    if (this.isScanningEnvironment()) return;

    if (!this.upgradeService.spendCredits(this.scanCost)) {
      this.scanError.set(`Insufficient Credits. Requires ${this.scanCost} NC.`);
      setTimeout(() => this.scanError.set(null), 4000);
      return;
    }

    this.isScanningEnvironment.set(true);
    this.scanError.set(null);
    this.sceneObjects.set([]);

    try {
      // Ensure a preview is running or fall back to web camera capture
      let analysisResult;
      try {
        // If preview not started, attempt to start it (one-shot) – do not override permission-denied flag
        const mode = this.previewMode ? this.previewMode : await this.ensurePreviewStarted();
        this.previewMode = mode;

        if (mode === 'native') {
          const result = await CameraPreview.capture({ quality: 85 });
          analysisResult = await this.geminiService.analyzeScene(result.value);
        } else {
          // Web fallback: draw current video frame to canvas and convert to base64 JPG
          if (!this.webVideoEl || !this.webCanvasEl) throw new Error('Web camera not initialized');
          const ctx = this.webCanvasEl.getContext('2d');
          if (!ctx) throw new Error('Unable to get canvas context');
          // Ensure canvas matches video size
          this.webCanvasEl.width = this.webVideoEl.videoWidth || this.webCanvasEl.width || 1280;
          this.webCanvasEl.height = this.webVideoEl.videoHeight || this.webCanvasEl.height || 720;
          ctx.drawImage(this.webVideoEl, 0, 0, this.webCanvasEl.width, this.webCanvasEl.height);
          const dataUrl = this.webCanvasEl.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.split(',')[1];
          analysisResult = await this.geminiService.analyzeScene(base64);
        }
      } catch (previewErr) {
        console.warn('Preview capture failed, attempting direct CameraPreview.capture fallback or web fallback:', previewErr);
        // Try direct CameraPreview.capture as a last native attempt
        try {
          const result = await CameraPreview.capture({ quality: 85 });
          analysisResult = await this.geminiService.analyzeScene(result.value);
        } catch (finalErr) {
          // If everything fails, rethrow to be handled by outer catch
          if (finalErr && (finalErr.name === 'NotAllowedError' || /permission/i.test(String(finalErr)))) {
            this.cameraPermissionDenied.set(true);
          }
          throw finalErr;
        }
      }
      this.sceneObjects.set(analysisResult.objects);
      
      // Clear results after a delay
      setTimeout(() => this.sceneObjects.set([]), 15000);
    } catch (err) {
      console.error('Environment scan failed:', err);
      this.scanError.set('Scene analysis failed. Connection unstable.');
       // refund credits on failure
      this.upgradeService.addCredits(this.scanCost);
      setTimeout(() => this.scanError.set(null), 4000);
    } finally {
      this.isScanningEnvironment.set(false);
      // Keep persistent preview running; do not stop here. It will be stopped in ngOnDestroy.
    }
  }

  /** Start a persistent preview (native or web). Safe to call multiple times. */
  async startPreview(): Promise<'native' | 'web'> {
    const mode = await this.ensurePreviewStarted();
    this.previewMode = mode;
    return mode;
  }

  private async ensurePreviewStarted(): Promise<'native' | 'web'> {
    // Prefer native CameraPreview on non-web platforms when available
    try {
      const platform = (Capacitor && typeof (Capacitor as any).getPlatform === 'function')
        ? (Capacitor as any).getPlatform()
        : 'web';
      if (platform !== 'web') {
        try {
          await CameraPreview.start({ parent: 'app', toBack: false, position: 'rear' });
          return 'native';
        } catch (err) {
          console.warn('CameraPreview.start failed, falling back to web getUserMedia', err);
        }
      }
    } catch (e) {
      // ignore and try web fallback
    }

    // Web fallback using getUserMedia
    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('No camera available');
    }

    // If already started, reuse
    if (this.webStream && this.webVideoEl && this.webCanvasEl) return 'web';

    // Prefer a template-bound video element if present
    if (this.webPreviewRef && this.webPreviewRef.nativeElement) {
      this.webVideoEl = this.webPreviewRef.nativeElement;
      this.webVideoCreatedByComponent = false;
    } else {
      this.webVideoEl = document.createElement('video');
      this.webVideoCreatedByComponent = true;
    }
    this.webVideoEl.autoplay = true;
    this.webVideoEl.playsInline = true;
    try {
      this.webStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      this.webVideoEl.srcObject = this.webStream;
      await this.webVideoEl.play();
  this.webCanvasEl = document.createElement('canvas');
      // Set initial size; will update before capture
      this.webCanvasEl.width = this.webVideoEl.videoWidth || 1280;
      this.webCanvasEl.height = this.webVideoEl.videoHeight || 720;
      return 'web';
    } catch (err) {
      // If permission denied, surface it to the UI
      if (err && (err.name === 'NotAllowedError' || /permission/i.test(String(err)))) {
        this.cameraPermissionDenied.set(true);
      }
      // Clean up partially-created resources
      this.stopWebPreview();
      throw err;
    }
  }

  retryPreview() {
    // Clear prior permission denial and retry starting preview
    this.cameraPermissionDenied.set(false);
    this.startPreview().then(() => {
      this.scanError.set(null);
    }).catch(err => {
      console.warn('Retry preview failed:', err);
      this.scanError.set('Preview still unavailable. Check camera permissions.');
      setTimeout(() => this.scanError.set(null), 4000);
      if (err && (err.name === 'NotAllowedError' || /permission/i.test(String(err)))) {
        this.cameraPermissionDenied.set(true);
      }
    });
  }

  togglePreview() {
    const enabled = !this.previewEnabled();
    this.previewEnabled.set(enabled);
    try { localStorage.setItem('necrometer.previewEnabled', String(enabled)); } catch {}
    if (!enabled) {
      // stop any preview that's active
      (async () => {
        try {
          if (this.previewMode === 'native') {
            try { await CameraPreview.stop(); } catch {};
          }
        } catch {}
        this.stopWebPreview();
        this.previewMode = null;
      })();
    } else {
      // start preview if visible
      try {
        // If visibility observer is present and the element is visible, start
        if (this.visionRootRef && this.visionRootRef.nativeElement) {
          const rect = this.visionRootRef.nativeElement.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          if (isVisible) this.startPreview().catch(()=>{});
        } else {
          this.startPreview().catch(()=>{});
        }
      } catch {}
    }
  }

  private stopWebPreview() {
    try {
      if (this.webStream) {
        this.webStream.getTracks().forEach(t => t.stop());
      }
    } catch (e) {}
    this.webStream = null;
    if (this.webVideoEl) {
      try { this.webVideoEl.pause(); } catch {};
      try { this.webVideoEl.srcObject = null as any; } catch {}
      // If we created the element we can drop the reference; if it's template-bound, keep it (template owns it)
      if (this.webVideoCreatedByComponent) this.webVideoEl = null;
    }
    this.webCanvasEl = null;
  }

  isWebPreviewActive(): boolean {
    return this.previewMode === 'web' && !!this.webStream && !!this.webVideoEl;
  }

  pointsToString(points: { x: number; y: number }[]): string {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }

  private getNewSpawnPosition(): { x: number, y: number } {
    const activeSceneObjects = this.sceneObjects();
    // 70% chance to spawn near an object if any are detected
    const spawnBehindObject = activeSceneObjects.length > 0 && Math.random() < 0.7;

    if (spawnBehindObject) {
      // Pick a random object and a random polyline from it
      const randomObject = activeSceneObjects[Math.floor(Math.random() * activeSceneObjects.length)];
      if (randomObject.polylines.length > 0) {
        const randomPolyline = randomObject.polylines[Math.floor(Math.random() * randomObject.polylines.length)];
        
        if (randomPolyline.length > 0) {
          // Pick a random point on that polyline
          const randomPoint = randomPolyline[Math.floor(Math.random() * randomPolyline.length)];
          
          // Spawn near this point with a small offset
          const offsetX = (Math.random() - 0.5) * 8; // offset by up to 4%
          const offsetY = (Math.random() - 0.5) * 8;
          
          let x = randomPoint.x + offsetX;
          let y = randomPoint.y + offsetY;
          
          // Clamp values to be within the screen bounds but not on the very edge
          x = Math.max(5, Math.min(95, x));
          y = Math.max(5, Math.min(95, y));

          return { x, y };
        }
      }
    }

    // Fallback or if no objects are available: Peripheral spawning
    let x: number, y: number;
    // Define a 30% wide/tall exclusion zone in the center
    const centralExclusionZone = { xMin: 35, xMax: 65, yMin: 35, yMax: 65 };

    if (Math.random() < 0.5) { // Spawn on top/bottom edges
      x = Math.random() * 100;
      y = Math.random() < 0.5 
        ? Math.random() * (centralExclusionZone.yMin) // Top area
        : centralExclusionZone.yMax + Math.random() * (100 - centralExclusionZone.yMax); // Bottom area
    } else { // Spawn on left/right edges
      y = Math.random() * 100;
      x = Math.random() < 0.5 
        ? Math.random() * (centralExclusionZone.xMin) // Left area
        : centralExclusionZone.xMax + Math.random() * (100 - centralExclusionZone.xMax); // Right area
    }
    
    // Clamp to keep them from spawning exactly on the edge and being hard to see
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    
    return { x, y };
  }

  private startAnimationLoop() {
    const animate = () => {
      this.currentTime.set(Date.now());
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

    const activeSceneObjects = this.sceneObjects(); // Get scene objects once per frame

    this.arEntities.update(entities => {
      let closestEntity: AREntity | null = null;
      let minDistance = 15; // Targeting threshold in viewport % units

  const emfReading = this.deviceState.emfReading();
  const now = Date.now();
      
      const updatedEntities = entities.map(e => {
        let { x, y, vx, vy, ax, ay, interactionTime } = e;

        if (e.contained) {
          // Contained entities are not affected by physics and just drift to a stop.
          vx *= 0.9;
          vy *= 0.9;
          x += vx;
          y += vy;
          return { ...e, x, y, vx, vy, ax: 0, ay: 0, isInteracting: false };
        }
        
        ax = 0;
        ay = 0;

        // --- FORCES ---

        // 0. Anchor spring: if anchored, gently pull towards the anchor's projected position
        if (e.anchor) {
          const a = e.anchor;
          const sceneObj = activeSceneObjects[a.objectIndex];
          if (sceneObj && sceneObj.polylines && sceneObj.polylines[a.polylineIndex]) {
            const basePoint = sceneObj.polylines[a.polylineIndex][a.pointIndex];
            if (basePoint) {
              // Compute the anchor target on screen (base + stored offset)
              const anchorX = basePoint.x + a.offsetX;
              const anchorY = basePoint.y + a.offsetY;
              // Spring force proportional to distance
              const springDx = anchorX - x;
              const springDy = anchorY - y;
              const springStrength = 0.0008; // tuned for subtle hold
              ax += springDx * springStrength;
              ay += springDy * springStrength;
              // Slight damping towards anchor
              vx *= 0.995;
              vy *= 0.995;
            }
          }
        }

        // 1. Gravity from device tilt
        ax += gravityX * this.physics.gravityTilt;
        ay += gravityY * this.physics.gravityTilt;
        
        // 2. Constant downward drift to simulate being in a real space
        ay += this.physics.downwardDrift;

        // 3. EMF Agitation (random, erratic movements proportional to EMF)
        const agitation = emfReading * this.physics.emfAgitation;
        ax += (Math.random() - 0.5) * agitation;
        ay += (Math.random() - 0.5) * agitation;
        
        // 4. Repulsion from scene objects
        let hasInteractedThisFrame = false;
        if (activeSceneObjects.length > 0) {
          for (const obj of activeSceneObjects) {
            for (const polyline of obj.polylines) {
              for (const point of polyline) {
                const dx = x - point.x;
                const dy = y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.physics.sceneRepulsionRadius) {
                  hasInteractedThisFrame = true;
                  const forceMagnitude = (this.physics.sceneRepulsionRadius - distance) * this.physics.sceneRepulsion;
                  
                  // Play sound with a cooldown
                  if (!interactionTime || now - interactionTime > 500) {
                      this.audioService.playInteractionHum();
                      interactionTime = now;
                  }
                  
                  // Avoid division by zero if distance is exactly 0
                  if (distance > 0) {
                     const forceX = (dx / distance) * forceMagnitude;
                     const forceY = (dy / distance) * forceMagnitude;
                     ax += forceX;
                     ay += forceY;
                  }
                }
              }
            }
          }
        }
        
        // --- PHYSICS INTEGRATION ---
        
        vx += ax;
        vy += ay;
        
        vx *= this.physics.friction;
        vy *= this.physics.friction;

        // Clamp speed to a maximum
        const speed = Math.sqrt(vx*vx + vy*vy);
        if (speed > this.physics.maxSpeed) {
            vx = (vx / speed) * this.physics.maxSpeed;
            vy = (vy / speed) * this.physics.maxSpeed;
        }

        x += vx;
        y += vy;
        // --- PARALLAX ---
        // Apply a small parallax offset based on device orientation and anchored depth
        if (e.anchor) {
          const depth = e.anchor.depth || 1;
          // Parallax scale: closer objects (depth ~1) move more with device tilt; farther (depth>1) move less
          const parallaxScale = 1 / depth * 0.6; // tuned
          const parallaxX = gravityX * parallaxScale * 6; // amplify small tilt into percent offsets
          const parallaxY = gravityY * parallaxScale * 6;
          x += parallaxX;
          y += parallaxY;
        }
        
        // --- OFF-SCREEN BEHAVIOR ---
        // If an entity drifts off the bottom, left, or right edge, reset it to appear from the top.
        if (y > 105 || x < -5 || x > 105) {
            x = Math.random() * 80 + 10; // Respawn at a random horizontal position
            y = -5; // Start just above the screen
            vx = (Math.random() - 0.5) * 0.02; // Give it a new, gentle horizontal velocity
            vy = Math.random() * 0.05; // Ensure it drifts downwards
        }
        
        // --- SOFT OCCLUSION ---
        const occlusionLevel = computeOcclusionLevel(e, activeSceneObjects);
        const occluded = occlusionLevel > 0.25; // threshold to mark fully occluded for current logic

  // Update rendering helpers: bobbing and scale modulation
  const bobPhase = (e.bobPhase || 0) + 0.02 + (emfReading * 0.0001);
  const bobOffset = Math.sin(bobPhase) * 0.6 * (e.scale || 1);
  const scale = (e.scale || 1) * (1 + Math.abs(bobOffset) * 0.01);
  const rotation = (e.rotation || 0) + Math.sin(bobPhase * 0.5) * 0.2;

  // Limb swing amplitude scales with movement speed and instability
  const vel = Math.sqrt(vx*vx + vy*vy);
  const baseSwing = Math.min(1.0, vel * 30 + (e.instability || 0) * 0.004);
  const swing = Math.sin(bobPhase * 1.6) * 18 * baseSwing; // degrees
  const armSwing = swing * 0.9;
  const legSwing = swing;

  const leftArmAngle = (e.leftArmAngle || 0) + (armSwing - (e.leftArmAngle || 0)) * 0.2;
  const rightArmAngle = (e.rightArmAngle || 0) + (-armSwing - (e.rightArmAngle || 0)) * 0.2;
  const leftLegAngle = (e.leftLegAngle || 0) + (legSwing - (e.leftLegAngle || 0)) * 0.18;
  const rightLegAngle = (e.rightLegAngle || 0) + (-legSwing - (e.rightLegAngle || 0)) * 0.18;

  // Facial expressions: blink periodically and mouth open based on instability/EMF
  const blink = Math.max(0, Math.min(1, (Math.sin(bobPhase * 0.5 + vel * 5) * 0.5 + 0.5) * 0.2 - (e.instability || 0) * 0.001));
  const mouthOpen = Math.max(0, Math.min(1, Math.abs(Math.sin(bobPhase * 0.7)) * 0.2 + (e.instability || 0) * 0.003 + emfReading * 0.0005));

  const updatedEntity = { ...e, x, y, vx, vy, ax, ay, interactionTime, isInteracting: hasInteractedThisFrame, occluded, occlusionLevel, bobPhase, scale, rotation,
        leftArmAngle, rightArmAngle, leftLegAngle, rightLegAngle, blink, mouthOpen };

        // --- TARGETING ---
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