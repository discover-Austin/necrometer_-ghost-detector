import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { EnvironmentService } from './environment.service';
import { LoggerService } from './logger.service';

export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme service for managing dark/light mode
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private env = inject(EnvironmentService);
  private logger = inject(LoggerService);

  mode = signal<ThemeMode>('auto');
  isDark = signal(false);
  private mediaQueryListener?: (e: MediaQueryListEvent) => void;
  private mediaQuery?: MediaQueryList;

  constructor() {
    this.loadPreference();
    this.setupAutoDetection();

    // Apply theme changes
    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  /**
   * Set theme mode
   */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.env.setStorageItem('themeMode', mode);
    this.updateIsDark();
    this.logger.info(`Theme mode set to: ${mode}`);
  }

  /**
   * Toggle between light and dark
   */
  toggle(): void {
    const current = this.isDark();
    this.setMode(current ? 'light' : 'dark');
  }

  /**
   * Load saved theme preference
   */
  private loadPreference(): void {
    const saved = this.env.getStorageItem('themeMode') as ThemeMode;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.mode.set(saved);
    }
    this.updateIsDark();
  }

  /**
   * Setup auto detection based on system preference
   */
  private setupAutoDetection(): void {
    if (typeof window === 'undefined') return;

    try {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Initial check
      this.updateIsDark();

      // Listen for changes
      this.mediaQueryListener = () => {
        if (this.mode() === 'auto') {
          this.updateIsDark();
        }
      };
      
      this.mediaQuery.addEventListener('change', this.mediaQueryListener);
    } catch (error) {
      this.logger.warn('Failed to setup theme auto-detection', error);
      // Fallback to manual theme selection
    }
  }

  ngOnDestroy(): void {
    // Clean up media query listener
    if (this.mediaQuery && this.mediaQueryListener) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryListener);
    }
  }

  /**
   * Update isDark signal based on mode
   */
  private updateIsDark(): void {
    const mode = this.mode();

    if (mode === 'dark') {
      this.isDark.set(true);
    } else if (mode === 'light') {
      this.isDark.set(false);
    } else {
      // Auto mode - check system preference
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDark.set(prefersDark);
      }
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(isDark: boolean): void {
    if (typeof document === 'undefined') return;

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1a1a1a' : '#ffffff');
    }
  }
}
