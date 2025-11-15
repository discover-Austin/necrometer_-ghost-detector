import { Injectable, inject } from '@angular/core';
import { EnvironmentService } from './environment.service';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Logger service for structured logging with different log levels
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private env = inject(EnvironmentService);
  private logLevel: LogLevel = LogLevel.DEBUG;

  constructor() {
    // Set log level based on environment
    this.logLevel = this.env.isProduction() ? LogLevel.WARN : LogLevel.DEBUG;
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${this.formatMessage(message)}`, error, ...args);

      // In production, you might want to send errors to a logging service
      if (this.env.isProduction()) {
        this.sendErrorToService(message, error);
      }
    }
  }

  /**
   * Log a performance metric
   */
  performance(label: string, duration: number): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.performance(label, duration);
    };
  }

  /**
   * Format message with timestamp
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }

  /**
   * Send error to external logging service (placeholder)
   */
  private sendErrorToService(message: string, error?: any): void {
    // TODO: Implement external error logging service integration
    // e.g., Sentry, LogRocket, etc.
    console.log('Error logged (would be sent to service):', message, error);
  }

  /**
   * Log paranormal activity detection
   */
  logDetection(entityType: string, strength: number, location?: any): void {
    this.info(`Paranormal detection: ${entityType} (strength: ${strength})`, location);
  }

  /**
   * Log sensor readings
   */
  logSensorData(sensorType: string, value: number): void {
    this.debug(`Sensor reading: ${sensorType} = ${value}`);
  }

  /**
   * Log API calls
   */
  logApiCall(endpoint: string, method: string, duration?: number): void {
    if (duration !== undefined) {
      this.debug(`API ${method} ${endpoint} completed in ${duration.toFixed(2)}ms`);
    } else {
      this.debug(`API ${method} ${endpoint} started`);
    }
  }
}
