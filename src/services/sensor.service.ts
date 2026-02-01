import { Injectable, signal } from '@angular/core';

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

  private hasPermissions = signal(false);

  // Keep a reference to the magnetometer sensor so that we can
  // stop it later.  The type is loose because `Magnetometer` isn't
  // defined on the Window interface in TypeScript by default.
  private magnetometerSensor: any;

  // Using arrow functions to preserve `this` context in event handlers
  private handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
      this.orientation.set({ alpha: event.alpha, beta: event.beta, gamma: event.gamma });
    }
  };

  private handleMotion = (event: DeviceMotionEvent) => {
    if (event.accelerationIncludingGravity?.x) {
      this.motion.set({
        x: event.accelerationIncludingGravity.x,
        y: event.accelerationIncludingGravity.y!,
        z: event.accelerationIncludingGravity.z!,
      });
    }
  };

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
