import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { SensorService } from './sensor.service';
import { AudioService } from './audio.service';

export interface AnomalyEvent {
  id: number;
  timestamp: Date;
  type: 'blur' | 'shadow' | 'distortion' | 'edge-artifact';
  position: { x: number; y: number }; // percent coordinates (0-100)
  duration: number; // milliseconds
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnomalyDetectionService {
  private sensorService = inject(SensorService);
  private audioService = inject(AudioService);

  // Sensor baseline tracking
  private magnetometerBaseline = signal<number[]>([]);
  private motionBaseline = signal<number[]>([]);
  private audioBaseline = signal<number[]>([]);
  
  // Anomaly state
  anomalyEvents = signal<AnomalyEvent[]>([]);
  currentAnomaly = signal<AnomalyEvent | null>(null);
  lastAnomalyTime = signal<number>(0);
  
  // Detection parameters
  private readonly BASELINE_WINDOW = 10; // seconds
  private readonly MIN_COOLDOWN = 90000; // 90 seconds
  private readonly MAX_COOLDOWN = 180000; // 180 seconds
  private readonly VARIANCE_THRESHOLD = 1.5; // multiplier for variance detection
  private readonly STILLNESS_THRESHOLD = 0.5; // threshold for user movement
  
  // Random probability gate
  private probabilityAccumulator = signal<number>(0);
  private readonly PROBABILITY_INCREMENT = 0.01; // increases over time
  
  private anomalyCheckInterval: any = null;

  constructor() {
    // Monitor sensors and update baselines
    effect(() => {
      const mag = this.sensorService.magnetometer();
      if (mag !== null) {
        this.updateBaseline(this.magnetometerBaseline, mag);
      }
    });

    effect(() => {
      const motion = this.sensorService.motion();
      if (motion !== null) {
        const magnitude = Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
        this.updateBaseline(this.motionBaseline, magnitude);
      }
    });

    // Start anomaly detection loop
    this.startDetectionLoop();
  }

  private updateBaseline(baseline: any, value: number) {
    baseline.update((prev: number[]) => {
      const updated = [...prev, value];
      // Keep only last N seconds of data (assuming ~10 readings per second)
      if (updated.length > this.BASELINE_WINDOW * 10) {
        updated.shift();
      }
      return updated;
    });
  }

  private getVariance(baseline: number[], currentValue: number): number {
    if (baseline.length < 10) return 0; // Not enough data yet
    
    const average = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const variance = Math.abs(currentValue - average) / (average || 1);
    return variance;
  }

  private isUserStill(): boolean {
    const motion = this.sensorService.motion();
    if (!motion) return false;
    
    const magnitude = Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
    return magnitude < this.STILLNESS_THRESHOLD;
  }

  private checkAnomalyConditions(): boolean {
    const now = Date.now();
    const timeSinceLastAnomaly = now - this.lastAnomalyTime();
    
    // Gate 1: Cooldown period
    const cooldownPeriod = this.MIN_COOLDOWN + Math.random() * (this.MAX_COOLDOWN - this.MIN_COOLDOWN);
    if (timeSinceLastAnomaly < cooldownPeriod) {
      return false;
    }

    // Gate 2: At least two sensors showing elevated variance
    let elevatedSensorCount = 0;
    
    const mag = this.sensorService.magnetometer();
    if (mag !== null) {
      const magVariance = this.getVariance(this.magnetometerBaseline(), mag);
      if (magVariance > this.VARIANCE_THRESHOLD) elevatedSensorCount++;
    }

    const motion = this.sensorService.motion();
    if (motion !== null) {
      const magnitude = Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
      const motionVariance = this.getVariance(this.motionBaseline(), magnitude);
      if (motionVariance > this.VARIANCE_THRESHOLD) elevatedSensorCount++;
    }

    if (elevatedSensorCount < 2) {
      return false;
    }

    // Gate 3: User is relatively still
    if (!this.isUserStill()) {
      return false;
    }

    // Gate 4: Random probability gate
    this.probabilityAccumulator.update(p => Math.min(p + this.PROBABILITY_INCREMENT, 1.0));
    const shouldTrigger = Math.random() < this.probabilityAccumulator();
    
    if (shouldTrigger) {
      this.probabilityAccumulator.set(0); // Reset probability
      return true;
    }

    return false;
  }

  private startDetectionLoop() {
    // Check for anomaly conditions every 5 seconds
    this.anomalyCheckInterval = setInterval(() => {
      if (this.checkAnomalyConditions()) {
        this.triggerAnomaly();
      }
    }, 5000);
  }

  private triggerAnomaly() {
    const types: AnomalyEvent['type'][] = ['blur', 'shadow', 'distortion'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random off-center position
    const x = 20 + Math.random() * 60; // 20-80% range
    const y = 20 + Math.random() * 60;
    
    // Random duration between 300-1200ms
    const duration = 300 + Math.random() * 900;
    
    const descriptions = [
      'Unclassified visual irregularity observed',
      'Anomalous pattern flagged',
      'Irregularity detected and resolved',
      'Visual distortion logged',
      'Transient anomaly recorded',
    ];
    
    const anomaly: AnomalyEvent = {
      id: Date.now(),
      timestamp: new Date(),
      type,
      position: { x, y },
      duration,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
    };

    // Show the anomaly
    this.currentAnomaly.set(anomaly);
    this.lastAnomalyTime.set(Date.now());

    // Hide the anomaly after its duration
    setTimeout(() => {
      this.currentAnomaly.set(null);
      
      // After a delay, acknowledge it and add to log
      const acknowledgmentDelay = 500 + Math.random() * 700; // 500-1200ms
      setTimeout(() => {
        this.anomalyEvents.update(events => [anomaly, ...events]);
      }, acknowledgmentDelay);
    }, duration);
  }

  stop() {
    if (this.anomalyCheckInterval) {
      clearInterval(this.anomalyCheckInterval);
    }
  }
}
