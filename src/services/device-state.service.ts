import { Injectable, signal, effect, OnDestroy, inject } from '@angular/core';
import { SensorService } from './sensor.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceStateService implements OnDestroy {
  private sensorService = inject(SensorService);
  emfReading = signal(0);
  emfHistory = signal<number[]>([]);
  highestEmf = signal(0);
  meterRotation = signal(0);
  emfAvailable = signal(true);

  // Latest magnetometer magnitude (µT) reported by SensorService.magnetometer().
  private latestMagnetometer = 0;
  // Exponentially smoothed baseline value to compensate for the Earth's magnetic field.
  // The baseline will slowly adapt to environmental changes.
  private baselineMagnetometer: number | null = null;
  private updateInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Start the update loop when the service is created
    this.updateInterval = setInterval(() => this.updateEmf(), 100);

    // React to changes in the magnetometer reading.  Update the latest
    // magnitude and slowly adjust the baseline value to compensate for
    // the Earth's magnetic field.  The baseline is updated using a very
    // low smoothing factor (0.001) so that it adapts over minutes rather
    // than seconds.  If baseline is not yet set, initialize it on first
    // reading.
    effect(() => {
      const mag = this.sensorService.magnetometer();
      this.emfAvailable.set(this.sensorService.magnetometerSupported());
      if (mag != null) {
        this.latestMagnetometer = mag;
        if (this.baselineMagnetometer == null) {
          this.baselineMagnetometer = mag;
        } else {
          // exponential smoothing: baseline += (mag - baseline) * alpha
          const alpha = 0.001;
          this.baselineMagnetometer =
            this.baselineMagnetometer +
            (mag - this.baselineMagnetometer) * alpha;
        }
      }
    });
  }

  // Smoothly update the EMF reading towards a value derived from the
  // magnetometer.  The target EMF value is the difference between the
  // latest magnitude and the slowly-adapting baseline, scaled up to a
  // 0–100 range to match the UI.  A small amount of noise is added
  // proportional to the current target to mimic sensor jitter.
  private updateEmf(): void {
    this.emfReading.update(current => {
      // Ensure we have a baseline; if not, fall back to raw magnitude
      const baseline =
        this.baselineMagnetometer != null ? this.baselineMagnetometer : 0;
      let target = 0;
      // compute difference; clamp to zero
      const diff = this.latestMagnetometer - baseline;
      if (diff > 0) {
        // Scale difference to the UI range.  Earth's field ranges from
        // ~25–65 µT, so differences of a few microteslas should produce
        // modest readings.  Multiply by 3 and cap at 100.
        target = Math.min(diff * 3, 100);
      }
      // move 10% towards the target each tick for smoothing
      const smoothed = current + (target - current) * 0.1;
      // noise scales with target: more agitation when target is high
      const noise = (Math.random() - 0.5) * (0.3 + 0.05 * target);
      const value = smoothed + noise;
      const clamped = value < 0 ? 0 : value;
      this.trackEmfHistory(clamped);
      this.updateMeter(clamped);
      return clamped;
    });
  }

  private trackEmfHistory(value: number): void {
    this.emfHistory.update(history => {
      const next = [...history, value];
      if (next.length > 120) {
        next.shift();
      }
      return next;
    });
    if (value > this.highestEmf()) {
      this.highestEmf.set(value);
    }
  }

  private updateMeter(value: number): void {
    const rotation = -60 + (value / 100) * 120;
    this.meterRotation.set(rotation);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
