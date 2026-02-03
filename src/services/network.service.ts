import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Network, ConnectionStatus, PluginListenerHandle } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';

/**
 * Network status monitoring service
 * Tracks online/offline status and connection quality
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkService implements OnDestroy {
  private logger = inject(LoggerService);
  private toast = inject(ToastService);

  isOnline = signal(true);
  connectionType = signal<string>('unknown');
  private networkListener?: PluginListenerHandle;
  private onlineListener?: () => void;
  private offlineListener?: () => void;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Get initial status
      const status = await Network.getStatus();
      this.updateStatus(status);

      // Listen for network changes
      this.networkListener = await Network.addListener('networkStatusChange', (status) => {
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

      this.onlineListener = () => {
        this.isOnline.set(true);
        this.toast.success('Connection restored');
      };
      
      this.offlineListener = () => {
        this.isOnline.set(false);
        this.toast.warning('You are offline');
      };

      window.addEventListener('online', this.onlineListener);
      window.addEventListener('offline', this.offlineListener);
    }
  }

  ngOnDestroy(): void {
    // Remove Capacitor listener
    if (this.networkListener) {
      this.networkListener.remove();
    }

    // Remove browser listeners
    if (typeof window !== 'undefined') {
      if (this.onlineListener) {
        window.removeEventListener('online', this.onlineListener);
      }
      if (this.offlineListener) {
        window.removeEventListener('offline', this.offlineListener);
      }
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
