import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { EnvironmentService } from './environment.service';

export interface PermissionSnapshot {
  sensors: 'unknown' | 'granted' | 'denied';
  camera: 'unknown' | 'granted' | 'denied';
  microphone: 'unknown' | 'granted' | 'denied';
}

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private logger = inject(LoggerService);
  private env = inject(EnvironmentService);
  private readonly storageKey = 'permission.onboarding';

  status = signal<PermissionSnapshot>({
    sensors: 'unknown',
    camera: 'unknown',
    microphone: 'unknown',
  });

  onboardingComplete = signal(false);

  constructor() {
    this.loadOnboarding();
  }

  updateSensors(state: PermissionSnapshot['sensors']): void {
    this.status.update(current => ({ ...current, sensors: state }));
  }

  updateCamera(state: PermissionSnapshot['camera']): void {
    this.status.update(current => ({ ...current, camera: state }));
  }

  updateMicrophone(state: PermissionSnapshot['microphone']): void {
    this.status.update(current => ({ ...current, microphone: state }));
  }

  completeOnboarding(): void {
    this.onboardingComplete.set(true);
    this.env.setStorageItem(this.storageKey, 'true');
  }

  private loadOnboarding(): void {
    try {
      const stored = this.env.getStorageItem(this.storageKey);
      if (stored === 'true') {
        this.onboardingComplete.set(true);
      }
    } catch (error) {
      this.logger.warn('Failed to load permission onboarding state', error);
    }
  }
}
