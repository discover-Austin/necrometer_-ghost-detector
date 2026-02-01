import { Injectable, inject } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { EnvironmentService } from './environment.service';
import { LoggerService } from './logger.service';

/**
 * Haptic feedback service for tactile user feedback
 * Provides various haptic patterns for different events
 */
@Injectable({
  providedIn: 'root'
})
export class HapticService {
  private env = inject(EnvironmentService);
  private logger = inject(LoggerService);
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  private async checkSupport(): Promise<void> {
    this.isSupported = this.env.isNative();
  }

  /**
   * Light impact - for subtle interactions
   */
  async light(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Medium impact - for standard interactions
   */
  async medium(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Heavy impact - for important events
   */
  async heavy(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Success notification
   */
  async success(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Warning notification
   */
  async warning(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Error notification
   */
  async error(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Custom vibration pattern for paranormal detection
   * Creates a pulsing sensation
   */
  async paranormalPulse(): Promise<void> {
    if (!this.isSupported) return;
    try {
      // Create a pattern: light-pause-medium-pause-heavy
      await this.light();
      await this.delay(100);
      await this.medium();
      await this.delay(100);
      await this.heavy();
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Vibration for entity containment success
   */
  async containmentSuccess(): Promise<void> {
    if (!this.isSupported) return;
    try {
      await this.success();
      await this.delay(150);
      await this.light();
    } catch (error) {
      this.logger.debug('Haptic feedback failed', error);
    }
  }

  /**
   * Selection vibration for UI interactions
   */
  async selection(): Promise<void> {
    await this.light();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
