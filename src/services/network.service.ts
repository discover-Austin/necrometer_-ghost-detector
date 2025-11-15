import { Injectable, inject, signal } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';

/**
 * Network status monitoring service
 * Tracks online/offline status and connection quality
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private logger = inject(LoggerService);
  private toast = inject(ToastService);

  isOnline = signal(true);
  connectionType = signal<string>('unknown');

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Get initial status
      const status = await Network.getStatus();
      this.updateStatus(status);

      // Listen for network changes
      Network.addListener('networkStatusChange', (status) => {
        this.updateStatus(status);
      });

      this.logger.info('Network monitoring initialized');
    } catch (error) {
      this.logger.warn('Network monitoring not available', error);
      // Fallback to browser API
      this.useBrowserAPI();
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    const wasOnline = this.isOnline();
    this.isOnline.set(status.connected);
    this.connectionType.set(status.connectionType);

    // Notify user of status changes
    if (!wasOnline && status.connected) {
      this.toast.success('Connection restored');
      this.logger.info('Network connection restored');
    } else if (wasOnline && !status.connected) {
      this.toast.warning('You are offline. Some features may be limited.');
      this.logger.warn('Network connection lost');
    }
  }

  private useBrowserAPI(): void {
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      this.isOnline.set(navigator.onLine);

      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.toast.success('Connection restored');
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.toast.warning('You are offline');
      });
    }
  }

  /**
   * Check if currently online
   */
  async checkConnection(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      return navigator.onLine;
    }
  }
}
