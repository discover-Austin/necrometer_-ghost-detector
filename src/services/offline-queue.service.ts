import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { NetworkService } from './network.service';
import { ToastService } from './toast.service';
import { effect } from '@angular/core';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

/**
 * Offline queue service for API requests
 * Queues requests when offline and syncs when connection is restored
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private logger = inject(LoggerService);
  private network = inject(NetworkService);
  private toast = inject(ToastService);

  private queue: QueuedRequest[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly STORAGE_KEY = 'necrometer.offlineQueue';
  private isSyncing = false;

  constructor() {
    this.loadQueue();

    // Sync when connection is restored
    effect(() => {
      if (this.network.isOnline() && this.queue.length > 0 && !this.isSyncing) {
        this.logger.info('Connection restored, syncing queued requests');
        this.syncQueue();
      }
    });
  }

  /**
   * Add request to queue
   */
  enqueue(url: string, method: string, body?: any, headers?: Record<string, string>): void {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(request);
    this.saveQueue();
    this.logger.info(`Request queued (offline): ${method} ${url}`);
  }

  /**
   * Sync all queued requests
   */
  async syncQueue(): Promise<void> {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;
    this.logger.info(`Syncing ${this.queue.length} queued requests`);

    const results = await Promise.allSettled(
      this.queue.map(req => this.processRequest(req))
    );

    // Remove successful requests
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      this.toast.success(`Synced ${successCount} queued requests`);
    }

    if (failedCount > 0) {
      this.logger.warn(`${failedCount} queued requests failed`);
    }

    // Remove requests that succeeded or exceeded max retries
    this.queue = this.queue.filter(req => req.retries < this.MAX_RETRIES);
    this.saveQueue();
    this.isSyncing = false;
  }

  /**
   * Process a single queued request
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.logger.info(`Successfully synced request: ${request.method} ${request.url}`);
    } catch (error) {
      request.retries++;
      this.logger.error(`Failed to sync request (attempt ${request.retries}/${this.MAX_RETRIES})`, error);
      throw error;
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear all queued requests
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.logger.info('Offline queue cleared');
  }

  /**
   * Save queue to storage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      this.logger.error('Failed to save offline queue', error);
    }
  }

  /**
   * Load queue from storage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.logger.info(`Loaded ${this.queue.length} requests from offline queue`);
      }
    } catch (error) {
      this.logger.error('Failed to load offline queue', error);
      this.queue = [];
    }
  }
}
