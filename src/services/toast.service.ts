import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  dismissible: boolean;
}

/**
 * Toast notification service for displaying temporary messages to users
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastIdCounter = 0;
  toasts = signal<Toast[]>([]);

  /**
   * Show a success toast
   */
  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast
   */
  info(message: string, duration = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast with custom configuration
   */
  show(message: string, type: ToastType = 'info', duration = 3000, dismissible = true): void {
    const toast: Toast = {
      id: ++this.toastIdCounter,
      message,
      type,
      duration,
      dismissible
    };

    this.toasts.update(toasts => [...toasts, toast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, duration);
    }
  }

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts.set([]);
  }
}
