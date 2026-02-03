import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Global error handler that catches all unhandled errors
 * Provides user-friendly error messages and logs to telemetry
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);

  handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error) ? String((error as any).message) : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    // Log the error
    this.logger.error('Unhandled error caught by GlobalErrorHandler', {
      message: errorMessage,
      stack: errorStack,
      error
    });

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or Rollbar
    this.sendToErrorTrackingService(error);

    // Show user-friendly error notification
    this.showUserErrorNotification(error);

    // Re-throw in development for debugging
    if (!this.isProduction()) {
      console.error('ERROR:', error);
    }
  }

  private sendToErrorTrackingService(error: unknown): void {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error);
  }

  private showUserErrorNotification(error: unknown): void {
    // This will be handled by the toast service once it's implemented
    const message = this.getUserFriendlyMessage(error);

    // For now, we'll dispatch a custom event that can be caught by a toast component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: { message, severity: 'error' }
      }));
    }
  }

  private getUserFriendlyMessage(error: unknown): string {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

    // Map technical errors to user-friendly messages
    if (message.includes('api key')) {
      return 'Please configure your Gemini API key in settings.';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection.';
    }

    if (message.includes('permission')) {
      return 'Permission denied. Please check your device settings.';
    }

    if (message.includes('camera')) {
      return 'Camera access issue. Please grant camera permissions.';
    }

    // Default message for paranormal theme
    return 'A disturbance in the spectral plane has occurred. Please try again.';
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' &&
           window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1';
  }
}
