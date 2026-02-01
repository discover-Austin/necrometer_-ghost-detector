import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { EnvironmentService } from './environment.service';

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: number;
}

/**
 * Analytics and telemetry service
 * Tracks user interactions and app performance
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private logger = inject(LoggerService);
  private env = inject(EnvironmentService);
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  /**
   * Track a custom event
   */
  trackEvent(name: string, category: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      category,
      properties,
      timestamp: Date.now()
    };

    this.events.push(event);
    this.enforceMaxEvents();

    this.logger.debug(`Analytics event: ${category}/${name}`, properties);

    // In production, send to analytics service (Google Analytics, Mixpanel, etc.)
    if (this.env.isProduction()) {
      this.sendToAnalyticsService(event);
    }
  }

  /**
   * Track entity detection
   */
  trackDetection(entityType: string, strength: string, emfReading: number): void {
    this.trackEvent('entity_detected', 'paranormal', {
      entityType,
      strength,
      emfReading
    });
  }

  /**
   * Track entity containment
   */
  trackContainment(entityType: string, entityName: string): void {
    this.trackEvent('entity_contained', 'paranormal', {
      entityType,
      entityName
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUse(featureName: string): void {
    this.trackEvent('feature_used', 'engagement', {
      feature: featureName
    });
  }

  /**
   * Track API performance
   */
  trackApiPerformance(endpoint: string, duration: number, success: boolean): void {
    this.trackEvent('api_call', 'performance', {
      endpoint,
      duration,
      success
    });
  }

  /**
   * Track user session start
   */
  trackSessionStart(): void {
    this.trackEvent('session_start', 'engagement', {
      platform: this.env.isNative() ? 'native' : 'web',
      isMobile: this.env.isMobile()
    });
  }

  /**
   * Track error occurrences
   */
  trackError(errorMessage: string, errorType: string): void {
    this.trackEvent('error_occurred', 'errors', {
      message: errorMessage,
      type: errorType
    });
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalEvents: number;
    categories: Record<string, number>;
    recentEvents: AnalyticsEvent[];
  } {
    const categories: Record<string, number> = {};

    for (const event of this.events) {
      categories[event.category] = (categories[event.category] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      categories,
      recentEvents: this.events.slice(-10)
    };
  }

  /**
   * Export analytics data
   */
  exportData(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear analytics data
   */
  clear(): void {
    this.events = [];
    this.logger.info('Analytics data cleared');
  }

  /**
   * Send event to external analytics service
   */
  private sendToAnalyticsService(event: AnalyticsEvent): void {
    // TODO: Integrate with analytics service
    // Example: Google Analytics 4
    // gtag('event', event.name, {
    //   event_category: event.category,
    //   ...event.properties
    // });

    // Example: Mixpanel
    // mixpanel.track(event.name, {
    //   category: event.category,
    //   ...event.properties
    // });
  }

  /**
   * Enforce maximum number of stored events
   */
  private enforceMaxEvents(): void {
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }
}
