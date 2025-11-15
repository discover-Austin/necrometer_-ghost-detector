import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PerformanceService } from '../../services/performance.service';
import { CacheService } from '../../services/cache.service';
import { ExportImportService } from '../../services/export-import.service';
import { AchievementService } from '../../services/achievement.service';
import { InvestigationSessionService } from '../../services/investigation-session.service';
import { ToastService } from '../../services/toast.service';
import { GeminiService } from '../../services/gemini.service';
import { EnvironmentService } from '../../services/environment.service';
import { SessionControlComponent } from '../session-control/session-control.component';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SessionControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-6 max-w-2xl mx-auto overflow-y-auto">
      <!-- Header -->
      <div class="border-b border-[var(--color-primary-500)]/30 pb-4">
        <h2 class="text-2xl font-bold text-[var(--color-primary-400)]">Settings</h2>
        <p class="text-sm text-gray-400">Configure your paranormal investigation preferences</p>
      </div>

      <!-- Session Control -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          Investigation Session
        </h3>
        <app-session-control></app-session-control>
      </section>

      <!-- API Configuration -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          AI Configuration
        </h3>
        <button
          (click)="configureApiKey()"
          class="w-full px-4 py-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-white rounded-lg transition-colors">
          Configure Gemini API Key
        </button>
        <p class="text-xs text-gray-500">API key is stored securely in localStorage</p>
      </section>

      <!-- Theme Settings -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
          Appearance
        </h3>
        <div class="space-y-2">
          <label class="block text-sm text-gray-300">Theme Mode</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              (click)="theme.setMode('light')"
              [class.bg-[var(--color-primary-600)]]="theme.mode() === 'light'"
              [class.bg-gray-700]="theme.mode() !== 'light'"
              class="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-primary-700)]">
              Light
            </button>
            <button
              (click)="theme.setMode('dark')"
              [class.bg-[var(--color-primary-600)]]="theme.mode() === 'dark'"
              [class.bg-gray-700]="theme.mode() !== 'dark'"
              class="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-primary-700)]">
              Dark
            </button>
            <button
              (click)="theme.setMode('auto')"
              [class.bg-[var(--color-primary-600)]]="theme.mode() === 'auto'"
              [class.bg-gray-700]="theme.mode() !== 'auto'"
              class="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-primary-700)]">
              Auto
            </button>
          </div>
        </div>
      </section>

      <!-- Data Management -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
          </svg>
          Data Management
        </h3>
        <div class="space-y-2">
          <button
            (click)="clearCache()"
            class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
            Clear Cache ({{ cacheStats().size }}/{{ cacheStats().maxSize }} items)
          </button>
          <button
            (click)="clearAllSessions()"
            class="w-full px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm">
            Clear All Investigation Sessions
          </button>
          <button
            (click)="resetAchievements()"
            class="w-full px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm">
            Reset All Achievements
          </button>
        </div>
      </section>

      <!-- Analytics & Performance -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Analytics & Performance
        </h3>
        <div class="space-y-2 text-sm text-gray-300">
          <div class="flex justify-between">
            <span>Events tracked:</span>
            <span class="font-mono text-[var(--color-primary-400)]">{{ analyticsSummary().totalEvents }}</span>
          </div>
          <div class="flex justify-between">
            <span>Performance measures:</span>
            <span class="font-mono text-[var(--color-primary-400)]">{{ perfSummary().totalMeasures }}</span>
          </div>
        </div>
        <button
          (click)="viewPerformanceDetails()"
          class="w-full px-4 py-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-white rounded-lg transition-colors text-sm">
          View Performance Details
        </button>
      </section>

      <!-- App Info -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-2">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)]">About</h3>
        <div class="space-y-1 text-sm text-gray-400">
          <div class="flex justify-between">
            <span>App Version:</span>
            <span class="font-mono">{{ env.getAppVersion() }}</span>
          </div>
          <div class="flex justify-between">
            <span>Platform:</span>
            <span class="font-mono">{{ env.isNative() ? 'Native' : 'Web' }}</span>
          </div>
          <div class="flex justify-between">
            <span>Environment:</span>
            <span class="font-mono">{{ env.isProduction() ? 'Production' : 'Development' }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      overflow-y: auto;
      height: 100%;
    }
  `]
})
export class SettingsComponent {
  theme = inject(ThemeService);
  private analytics = inject(AnalyticsService);
  private performance = inject(PerformanceService);
  private cache = inject(CacheService);
  private exportImport = inject(ExportImportService);
  private achievements = inject(AchievementService);
  private sessions = inject(InvestigationSessionService);
  private toast = inject(ToastService);
  private gemini = inject(GeminiService);
  env = inject(EnvironmentService);
  private dialog = inject(DialogService);

  showPerfDetails = signal(false);

  cacheStats = signal(this.cache.getStats());
  analyticsSummary = signal(this.analytics.getSummary());
  perfSummary = signal(this.performance.getSummary());

  configureApiKey() {
    try {
      const existing = this.env.getStorageItem('apiKey');
      const promptText = existing
        ? 'Current API key detected. Enter new key or cancel to keep:'
        : 'Enter your Gemini API key:';
      const key = window.prompt(promptText, existing || '');

      if (key && key.trim()) {
        this.gemini.setApiKey(key.trim(), true);
        this.toast.success('API key configured successfully!');
      }
    } catch (e) {
      this.toast.error('Failed to configure API key');
    }
  }

  clearCache() {
    this.cache.clear();
    this.cacheStats.set(this.cache.getStats());
    this.toast.success('Cache cleared');
  }

  async clearAllSessions() {
    const confirmed = await this.dialog.confirm({
      title: 'Clear All Sessions',
      message: 'This will permanently delete all investigation sessions. This action cannot be undone.',
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.sessions.clearAllSessions();
      this.toast.success('All sessions cleared');
    }
  }

  async resetAchievements() {
    const confirmed = await this.dialog.confirm({
      title: 'Reset Achievements',
      message: 'This will reset all achievement progress to zero. This action cannot be undone.',
      confirmText: 'Reset All',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (confirmed) {
      this.achievements.resetAll();
      this.toast.success('Achievements reset');
    }
  }

  viewPerformanceDetails() {
    this.showPerfDetails.set(true);
    const summary = this.performance.getSummary();
    console.table(summary.operations);
  }
}
