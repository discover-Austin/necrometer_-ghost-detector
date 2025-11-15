import { Injectable, inject, signal } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Geolocation tracking service
 * Tracks user location for paranormal investigations
 */
@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private logger = inject(LoggerService);
  private toast = inject(ToastService);

  currentLocation = signal<LocationData | null>(null);
  isTracking = signal(false);
  private watchId: string | null = null;

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<LocationData | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const location = this.extractLocationData(position);
      this.currentLocation.set(location);
      this.logger.info('Current position obtained', location);
      return location;
    } catch (error: any) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Start continuous position tracking
   */
  async startTracking(): Promise<void> {
    if (this.isTracking()) {
      this.logger.warn('Geolocation tracking already active');
      return;
    }

    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        },
        (position, error) => {
          if (error) {
            this.logger.error('Position watch error', error);
            return;
          }

          if (position) {
            const location = this.extractLocationData(position);
            this.currentLocation.set(location);
            this.logger.debug('Position updated', location);
          }
        }
      );

      this.isTracking.set(true);
      this.logger.info('Started geolocation tracking');
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Stop position tracking
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking() || !this.watchId) return;

    try {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      this.isTracking.set(false);
      this.logger.info('Stopped geolocation tracking');
    } catch (error) {
      this.logger.error('Failed to stop tracking', error);
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if user has moved significantly
   */
  hasMovedSignificantly(
    previousLocation: LocationData,
    threshold: number = 10 // meters
  ): boolean {
    const current = this.currentLocation();
    if (!current) return false;

    const distance = this.calculateDistance(
      previousLocation.latitude,
      previousLocation.longitude,
      current.latitude,
      current.longitude
    );

    return distance > threshold;
  }

  /**
   * Extract location data from Capacitor Position
   */
  private extractLocationData(position: Position): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  }

  /**
   * Handle geolocation errors
   */
  private handleError(error: any): void {
    const message = error?.message || String(error);

    if (message.includes('permission')) {
      this.toast.error('Location permission denied. Please enable in settings.');
      this.logger.error('Location permission denied', error);
    } else if (message.includes('unavailable')) {
      this.toast.warning('Location services unavailable');
      this.logger.warn('Location services unavailable', error);
    } else {
      this.toast.error('Failed to get location');
      this.logger.error('Geolocation error', error);
    }
  }

  /**
   * Request location permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (error) {
      this.logger.error('Failed to request location permission', error);
      return false;
    }
  }
}
