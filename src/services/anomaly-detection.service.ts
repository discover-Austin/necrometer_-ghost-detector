import { Injectable, signal, inject } from '@angular/core';
import { SensorService } from './sensor.service';
import { CameraAnalysisService } from './camera-analysis.service';

export interface AnomalyEvent {
  id: number;
  timestamp: Date;
  type: 'blur' | 'shadow' | 'distortion' | 'edge-artifact';
  position: { x: number; y: number }; // percent coordinates (0-100)
  duration: number; // milliseconds
  intensity: number; // 0.18-0.42
  note: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnomalyDetectionService {
  private sensorService = inject(SensorService);
  private cameraAnalysis = inject(CameraAnalysisService);
  
  // Anomaly state
  anomalyEvents = signal<AnomalyEvent[]>([]);
  currentAnomaly = signal<AnomalyEvent | null>(null);
  
  // Internal state for anomaly engine
  private attentionLevel = 0.18;
  private lastAnomalyTimestamp = 0;
  private cooldownUntilTimestamp = 0;
  
  // Constants from problem statement
  private readonly ATTENTION_INCREMENT = 0.004;
  private readonly ATTENTION_MIN = 0.1;
  private readonly ATTENTION_MAX = 1.0;
  private readonly ATTENTION_THRESHOLD = 0.55;
  private readonly ATTENTION_DROP = 0.65;
  
  private readonly MIN_COOLDOWN = 90000; // 90 seconds
  private readonly MAX_COOLDOWN = 180000; // 180 seconds
  
  private readonly STABILITY_THRESHOLD = 0.72;
  private readonly DEVIATION_THRESHOLD = 2;
  private readonly VISUAL_NOISE_MIN = 0.12;
  private readonly VISUAL_NOISE_MAX = 0.45;
  
  private readonly ANOMALY_CHANCE_MULTIPLIER = 0.035;
  
  private readonly RENDER_DELAY_MIN = 220;
  private readonly RENDER_DELAY_MAX = 680;
  private readonly ACKNOWLEDGMENT_DELAY_MIN = 350;
  private readonly ACKNOWLEDGMENT_DELAY_MAX = 650;
  
  private readonly DURATION_MIN = 700;
  private readonly DURATION_MAX = 1100;
  private readonly INTENSITY_MIN = 0.18;
  private readonly INTENSITY_MAX = 0.42;
  
  private anomalyCheckInterval: any = null;
  private lastAnomalyPosition: { x: number; y: number } | null = null;

  constructor() {
    // Start anomaly detection loop - runs every 500ms
    this.startDetectionLoop();
  }

  private startDetectionLoop() {
    this.anomalyCheckInterval = setInterval(() => {
      this.checkAndTriggerAnomaly();
    }, 500); // 500ms as specified
  }

  private checkAndTriggerAnomaly() {
    const now = Date.now();
    
    // Increment attention level every tick
    this.attentionLevel = Math.min(
      this.ATTENTION_MAX,
      this.attentionLevel + this.ATTENTION_INCREMENT
    );
    
    // Gate 1: Cooldown period
    if (now < this.cooldownUntilTimestamp) {
      return;
    }
    
    // Gate 2: Attention level
    if (this.attentionLevel < this.ATTENTION_THRESHOLD) {
      return;
    }
    
    // Gate 3: Stability score
    const stability = this.sensorService.stabilityScore();
    if (stability < this.STABILITY_THRESHOLD) {
      return;
    }
    
    // Gate 4: Deviation count
    const deviationCount = this.sensorService.deviationCount();
    if (deviationCount < this.DEVIATION_THRESHOLD) {
      return;
    }
    
    // Gate 5: Visual noise score
    const visualNoise = this.cameraAnalysis.visualNoiseScore();
    if (visualNoise < this.VISUAL_NOISE_MIN || visualNoise > this.VISUAL_NOISE_MAX) {
      return;
    }
    
    // Random gate
    const anomalyChance = this.attentionLevel * this.ANOMALY_CHANCE_MULTIPLIER;
    if (Math.random() > anomalyChance) {
      return;
    }
    
    // All gates passed - trigger anomaly
    this.triggerAnomaly();
  }

  private triggerAnomaly() {
    const types: AnomalyEvent['type'][] = ['blur', 'shadow', 'distortion', 'edge-artifact'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random off-center position, never same region twice
    let x, y;
    do {
      // Position between 20-80% to avoid edges and center
      x = 20 + Math.random() * 60;
      y = 20 + Math.random() * 60;
    } while (
      this.lastAnomalyPosition && 
      Math.abs(x - this.lastAnomalyPosition.x) < 20 &&
      Math.abs(y - this.lastAnomalyPosition.y) < 20
    );
    
    this.lastAnomalyPosition = { x, y };
    
    // Random duration and intensity from spec
    const duration = this.DURATION_MIN + Math.random() * (this.DURATION_MAX - this.DURATION_MIN);
    const intensity = this.INTENSITY_MIN + Math.random() * (this.INTENSITY_MAX - this.INTENSITY_MIN);
    
    // Passive, uncertain language
    const notes = [
      'Transient distortion observed. Pattern degraded prior to stabilization.',
      'Visual irregularity noted. Resolution unclear.',
      'Anomalous signature recorded. Source inconclusive.',
      'Brief instability logged. Characteristics ambiguous.',
      'Unclassified variance detected. Analysis pending.',
      'Optical inconsistency flagged. Origin indeterminate.',
    ];
    
    const anomaly: AnomalyEvent = {
      id: Date.now(),
      timestamp: new Date(),
      type,
      position: { x, y },
      duration,
      intensity,
      note: notes[Math.floor(Math.random() * notes.length)],
    };

    // Wait before rendering (220-680ms)
    const renderDelay = this.RENDER_DELAY_MIN + 
      Math.random() * (this.RENDER_DELAY_MAX - this.RENDER_DELAY_MIN);
    
    setTimeout(() => {
      // Show the anomaly
      this.currentAnomaly.set(anomaly);
      
      // Hide after duration
      setTimeout(() => {
        this.currentAnomaly.set(null);
        
        // Wait additional time before acknowledgment
        const ackDelay = this.ACKNOWLEDGMENT_DELAY_MIN + 
          Math.random() * (this.ACKNOWLEDGMENT_DELAY_MAX - this.ACKNOWLEDGMENT_DELAY_MIN);
        
        setTimeout(() => {
          // Acknowledge: drop attention, start cooldown, log
          this.attentionLevel = Math.max(
            this.ATTENTION_MIN,
            this.attentionLevel - this.ATTENTION_DROP
          );
          
          const cooldownDuration = this.MIN_COOLDOWN + 
            Math.random() * (this.MAX_COOLDOWN - this.MIN_COOLDOWN);
          this.cooldownUntilTimestamp = Date.now() + cooldownDuration;
          
          this.lastAnomalyTimestamp = Date.now();
          
          // Add to log
          this.anomalyEvents.update(events => [anomaly, ...events]);
        }, ackDelay);
      }, duration);
    }, renderDelay);
  }

  stop() {
    if (this.anomalyCheckInterval) {
      clearInterval(this.anomalyCheckInterval);
    }
    this.cameraAnalysis.stopAnalysis();
  }
  
  start() {
    this.cameraAnalysis.startAnalysis();
    if (!this.anomalyCheckInterval) {
      this.startDetectionLoop();
    }
  }
}
