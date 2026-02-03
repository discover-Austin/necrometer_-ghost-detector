import { Injectable, signal, computed } from '@angular/core';

interface SensorHistory {
  current: number;
  shortTerm: number[]; // ~5 seconds of data
  longTerm: number[];  // ~30 seconds of data
}

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  orientation = signal<{ alpha: number; beta: number; gamma: number } | null>(null);
  motion = signal<{ x: number; y: number; z: number } | null>(null);

  /**
   * Magnetic field magnitude in microteslas (µT) measured via the
   * Generic Sensor API's Magnetometer.  Remains null if the API
   * isn't supported or permission is denied.
   */
  magnetometer = signal<number | null>(null);

  // Sensor history tracking for deviation calculation
  private accelerometerHistory = signal<SensorHistory>({
    current: 0,
    shortTerm: [],
    longTerm: []
  });
  
  private gyroscopeHistory = signal<SensorHistory>({
    current: 0,
    shortTerm: [],
    longTerm: []
  });
  
  private magnetometerHistory = signal<SensorHistory>({
    current: 0,
    shortTerm: [],
    longTerm: []
  });

  // Computed values for anomaly detection
  stabilityScore = computed(() => {
    const motion = this.motion();
    if (!motion) return 1.0;
    
    const magnitude = Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
    // Scale magnitude to 0-1 range (higher magnitude = lower stability)
    // Typical phone at rest: ~9.8 (gravity), moving: 10-20+
    const stability = Math.max(0, 1 - (Math.abs(magnitude - 9.8) / 10));
    return Math.min(1, stability);
  });

  deviationCount = computed(() => {
    let count = 0;
    
    // Check accelerometer deviation
    const accel = this.accelerometerHistory();
    if (accel.longTerm.length > 0) {
      const accelAvg = accel.longTerm.reduce((a, b) => a + b, 0) / accel.longTerm.length;
      const accelDev = Math.abs(accel.current - accelAvg) / (accelAvg || 1);
      if (accelDev > 0.15) count++;
    }
    
    // Check gyroscope deviation (from orientation changes)
    const gyro = this.gyroscopeHistory();
    if (gyro.longTerm.length > 0) {
      const gyroAvg = gyro.longTerm.reduce((a, b) => a + b, 0) / gyro.longTerm.length;
      const gyroDev = Math.abs(gyro.current - gyroAvg) / (gyroAvg || 1);
      if (gyroDev > 0.15) count++;
    }
    
    // Check magnetometer deviation
    const mag = this.magnetometerHistory();
    if (mag.longTerm.length > 0) {
      const magAvg = mag.longTerm.reduce((a, b) => a + b, 0) / mag.longTerm.length;
      const magDev = Math.abs(mag.current - magAvg) / (magAvg || 1);
      if (magDev > 0.15) count++;
    }
    
    return count;
  });

  private hasPermissions = signal(false);
  private updateInterval: any = null;

  // Keep a reference to the magnetometer sensor so that we can
  // stop it later.  The type is loose because `Magnetometer` isn't
  // defined on the Window interface in TypeScript by default.
  private magnetometerSensor: any;

  // Using arrow functions to preserve `this` context in event handlers
  private handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
      this.orientation.set({ alpha: event.alpha, beta: event.beta, gamma: event.gamma });
      
      // Track gyroscope (orientation change rate)
      const gyroMagnitude = Math.sqrt(
        (event.alpha || 0) ** 2 + 
        (event.beta || 0) ** 2 + 
        (event.gamma || 0) ** 2
      );
      this.updateHistory(this.gyroscopeHistory, gyroMagnitude);
    }
  };

  private handleMotion = (event: DeviceMotionEvent) => {
    if (event.accelerationIncludingGravity?.x) {
      const motion = {
        x: event.accelerationIncludingGravity.x,
        y: event.accelerationIncludingGravity.y!,
        z: event.accelerationIncludingGravity.z!,
      };
      this.motion.set(motion);
      
      // Track accelerometer
      const magnitude = Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
      this.updateHistory(this.accelerometerHistory, magnitude);
    }
  };

  private updateHistory(historySignal: any, value: number) {
    historySignal.update((history: SensorHistory) => {
      const newShortTerm = [...history.shortTerm, value];
      const newLongTerm = [...history.longTerm, value];
      
      // Keep ~5 seconds at 10Hz = 50 samples for short term
      if (newShortTerm.length > 50) {
        newShortTerm.shift();
      }
      
      // Keep ~30 seconds at 10Hz = 300 samples for long term
      if (newLongTerm.length > 300) {
        newLongTerm.shift();
      }
      
      return {
        current: value,
        shortTerm: newShortTerm,
        longTerm: newLongTerm
      };
    });
  }

  async start(): Promise<void> {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      console.warn('Device Orientation API not supported.');
      return;
    }

    // For iOS 13+ we need to request permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          this.hasPermissions.set(true);
        } else {
          console.warn('Permission for Device Orientation not granted.');
          return;
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        return;
      }
    } else {
      // For other browsers, permission is often granted by default or handled differently
      this.hasPermissions.set(true);
    }

    if (this.hasPermissions()) {
      window.addEventListener('deviceorientation', this.handleOrientation, true);
      window.addEventListener('devicemotion', this.handleMotion, true);
    }

    // Attempt to start the magnetometer sensor if supported
    if ('Magnetometer' in window) {
      try {
        // Cast window.Magnetometer to any because TypeScript doesn't know about it.
        this.magnetometerSensor = new (window as any).Magnetometer({ frequency: 10 });
        this.magnetometerSensor.addEventListener('reading', () => {
          // Compute the magnitude of the magnetic field vector
          const x: number = this.magnetometerSensor.x ?? 0;
          const y: number = this.magnetometerSensor.y ?? 0;
          const z: number = this.magnetometerSensor.z ?? 0;
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          this.magnetometer.set(magnitude);
          
          // Track magnetometer history
          this.updateHistory(this.magnetometerHistory, magnitude);
        });
        this.magnetometerSensor.addEventListener('error', (event: any) => {
          console.error('Magnetometer error:', event.error);
        });
        this.magnetometerSensor.start();
      } catch (err) {
        console.error('Failed to start magnetometer:', err);
      }
    } else {
      console.warn('Magnetometer API not supported in this browser.');
    }
  }

  stop(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.handleOrientation, true);
      window.removeEventListener('devicemotion', this.handleMotion, true);
    }

    if (this.magnetometerSensor && typeof this.magnetometerSensor.stop === 'function') {
      try {
        this.magnetometerSensor.stop();
      } catch (err) {
        console.error('Failed to stop magnetometer:', err);
      }
    }
  }
}
