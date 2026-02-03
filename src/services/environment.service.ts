import { Injectable, inject } from '@angular/core';

/**
 * Environment configuration service
 * Handles environment-specific configuration including API keys
 */
@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private logger?: any; // Late initialization to avoid circular dependency
  private readonly STORAGE_KEY_PREFIX = 'necrometer.';

  /**
   * Check if the app is running in development mode
   */
  isDevelopment(): boolean {
    return !this.isProduction();
  }

  /**
   * Check if the app is running in production mode
   */
  isProduction(): boolean {
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('stackblitz') &&
           !window.location.hostname.includes('webcontainer');
  }

  /**
   * Check if running on mobile device
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if running as Capacitor native app
   */
  isNative(): boolean {
    return (window as any)?.Capacitor?.isNativePlatform?.() ?? false;
  }

  /**
   * Get API base URL based on environment
   */
  getApiBaseUrl(): string {
    if (this.isProduction()) {
      return 'https://generativelanguage.googleapis.com';
    }
    return 'https://generativelanguage.googleapis.com';
  }

  /**
   * Get value from localStorage with error handling
   */
  getStorageItem(key: string): string | null {
    try {
      return localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${key}`);
    } catch (error) {
      this.getLogger()?.warn(`Failed to get storage item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in localStorage with error handling
   */
  setStorageItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${key}`, value);
      return true;
    } catch (error) {
      this.getLogger()?.error(`Failed to set storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove value from localStorage with error handling
   */
  removeStorageItem(key: string): boolean {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${key}`);
      return true;
    } catch (error) {
      this.getLogger()?.warn(`Failed to remove storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all app data from localStorage
   */
  clearAllStorage(): boolean {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      this.getLogger()?.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Lazy load LoggerService to avoid circular dependency
   */
  private getLogger() {
    if (!this.logger) {
      try {
        // Dynamic import to break circular dependency
        const { LoggerService } = require('./logger.service');
        this.logger = inject(LoggerService);
      } catch {
        // If injection fails, return null
        return null;
      }
    }
    return this.logger;
  }

  /**
   * Get app version
   */
  getAppVersion(): string {
    return '1.0.0';
  }

  /**
   * Get app name
   */
  getAppName(): string {
    return 'Necrometer';
  }
}
