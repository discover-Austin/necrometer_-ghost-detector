import { Injectable, inject, OnDestroy } from '@angular/core';
import { LoggerService } from './logger.service';
import { AnalyticsService } from './analytics.service';

interface PerformanceMark {
  name: string;
  startTime: number;
}

interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

/**
 * Performance monitoring service
 * Tracks and reports app performance metrics
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService implements OnDestroy {
  private logger = inject(LoggerService);
  private analytics = inject(AnalyticsService);

  private marks = new Map<string, PerformanceMark>();
  private measures: PerformanceMeasure[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Start a performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, {
      name,
      startTime: performance.now()
    });

    this.logger.debug(`Performance mark: ${name}`);
  }

  /**
   * End a performance measurement
   */
  measure(name: string, label?: string): number {
    const mark = this.marks.get(name);
    if (!mark) {
      this.logger.warn(`No mark found for: ${name}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;

    const measure: PerformanceMeasure = {
      name: label || name,
      duration,
      startTime: mark.startTime,
      endTime
    };

    this.measures.push(measure);
    this.marks.delete(name);

    this.logger.performance(measure.name, duration);

    // Track in analytics if duration is significant
    if (duration > 100) {
      this.analytics.trackEvent('slow_operation', 'performance', {
        operation: measure.name,
        duration
      });
    }

    return duration;
  }

  /**
   * Create a timer that automatically measures on completion
   */
  startTimer(name: string): () => number {
    this.mark(name);
    return () => this.measure(name);
  }

  /**
   * Get all performance measures
   */
  getMeasures(): PerformanceMeasure[] {
    return [...this.measures];
  }

  /**
   * Get average duration for a specific operation
   */
  getAverageDuration(operationName: string): number {
    const filtered = this.measures.filter(m => m.name === operationName);
    if (filtered.length === 0) return 0;

    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMeasures: number;
    operations: Record<string, { count: number; avgDuration: number; maxDuration: number }>;
  } {
    const operations: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};

    for (const measure of this.measures) {
      if (!operations[measure.name]) {
        operations[measure.name] = {
          count: 0,
          avgDuration: 0,
          maxDuration: 0
        };
      }

      const op = operations[measure.name];
      op.count++;
      op.avgDuration = (op.avgDuration * (op.count - 1) + measure.duration) / op.count;
      op.maxDuration = Math.max(op.maxDuration, measure.duration);
    }

    return {
      totalMeasures: this.measures.length,
      operations
    };
  }

  /**
   * Clear all performance data
   */
  clear(): void {
    this.marks.clear();
    this.measures = [];
    this.logger.info('Performance data cleared');
  }

  /**
   * Monitor long tasks (experimental)
   */
  monitorLongTasks(): void {
    if (typeof PerformanceObserver === 'undefined') {
      this.logger.warn('PerformanceObserver not supported');
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime
          });

          this.analytics.trackEvent('long_task', 'performance', {
            duration: entry.duration
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
      this.logger.info('Long task monitoring enabled');
    } catch (error) {
      this.logger.debug('Long task monitoring not available', error);
    }
  }

  /**
   * Get Core Web Vitals (if available)
   */
  getCoreWebVitals(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.logger.info('LCP:', lastEntry.startTime);
        this.analytics.trackEvent('web_vital', 'performance', {
          metric: 'LCP',
          value: lastEntry.startTime
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          // Type guard: check if entry has processingStart property
          if ('processingStart' in entry && 'startTime' in entry) {
            const fidEntry = entry as PerformanceEventTiming;
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.logger.info('FID:', fid);
            this.analytics.trackEvent('web_vital', 'performance', {
              metric: 'FID',
              value: fid
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      this.logger.debug('Core Web Vitals monitoring not available', error);
    }
  }

  ngOnDestroy(): void {
    // Disconnect all performance observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}
