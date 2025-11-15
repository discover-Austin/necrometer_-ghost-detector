import { Component, ChangeDetectionStrategy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestigationSessionService } from '../../services/investigation-session.service';
import { HapticService } from '../../services/haptic.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-session-control',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-3">
      @if (sessions.currentSession(); as session) {
        <!-- Active Session -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span class="text-sm font-semibold text-[var(--color-primary-300)]">Active Session</span>
            </div>
            <button
              (click)="endSession()"
              class="px-3 py-1 bg-red-700/50 hover:bg-red-600/50 text-xs rounded transition-colors">
              End Session
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="bg-black/30 rounded p-2">
              <div class="text-gray-400">Duration</div>
              <div class="text-[var(--color-primary-300)] font-mono font-bold">{{ sessionDuration() }}</div>
            </div>
            <div class="bg-black/30 rounded p-2">
              <div class="text-gray-400">Detections</div>
              <div class="text-[var(--color-primary-300)] font-mono font-bold">{{ session.detections.length }}</div>
            </div>
            <div class="bg-black/30 rounded p-2">
              <div class="text-gray-400">Avg EMF</div>
              <div class="text-[var(--color-primary-300)] font-mono font-bold">{{ averageEMF() }}</div>
            </div>
          </div>

          @if (showDetails()) {
            <div class="text-xs space-y-1 pt-2 border-t border-[var(--color-primary-500)]/20 animate-fade-in">
              <div class="flex justify-between">
                <span class="text-gray-400">Session Name:</span>
                <span class="text-[var(--color-primary-300)]">{{ session.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Started:</span>
                <span class="text-[var(--color-primary-300)]">{{ session.startTime | date:'short' }}</span>
              </div>
              @if (session.location) {
                <div class="flex justify-between">
                  <span class="text-gray-400">Location:</span>
                  <span class="text-[var(--color-primary-300)] font-mono text-[10px]">
                    {{ session.location.latitude.toFixed(4) }}°, {{ session.location.longitude.toFixed(4) }}°
                  </span>
                </div>
              }
            </div>
          }

          <button
            (click)="toggleDetails()"
            class="w-full text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)] transition-colors">
            {{ showDetails() ? 'Hide Details' : 'Show Details' }}
          </button>
        </div>
      } @else {
        <!-- No Active Session -->
        <div class="text-center space-y-3">
          <div class="flex items-center justify-center gap-2">
            <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span class="text-sm text-gray-400">No Active Session</span>
          </div>

          @if (showStartForm()) {
            <div class="space-y-2 animate-fade-in">
              <input
                #sessionInput
                type="text"
                placeholder="Session name (optional)"
                class="w-full px-3 py-2 bg-black/30 border border-[var(--color-primary-500)]/30 rounded text-sm focus:outline-none focus:border-[var(--color-primary-500)] text-white placeholder-gray-500">
              <div class="flex gap-2">
                <button
                  (click)="startSession(sessionInput.value)"
                  class="flex-1 px-3 py-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-sm rounded transition-colors">
                  Start
                </button>
                <button
                  (click)="cancelStart()"
                  class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          } @else {
            <button
              (click)="showStartForm.set(true)"
              class="w-full px-4 py-2 bg-[var(--color-primary-700)]/50 hover:bg-[var(--color-primary-600)]/50 text-sm rounded transition-colors">
              Start New Session
            </button>
          }

          @if (pastSessionCount() > 0) {
            <div class="text-xs text-gray-500 pt-2 border-t border-gray-700">
              {{ pastSessionCount() }} past session{{ pastSessionCount() > 1 ? 's' : '' }} recorded
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SessionControlComponent {
  sessions = inject(InvestigationSessionService);
  private haptic = inject(HapticService);
  private toast = inject(ToastService);
  private analytics = inject(AnalyticsService);

  showDetails = signal(false);
  showStartForm = signal(false);

  sessionDuration = computed(() => {
    const session = this.sessions.currentSession();
    if (!session) return '0:00';

    const duration = Date.now() - session.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  averageEMF = computed(() => {
    const session = this.sessions.currentSession();
    if (!session || session.detections.length === 0) return '0.00';

    const sum = session.detections.reduce((acc, d) => acc + d.emfReading, 0);
    const avg = sum / session.detections.length;
    return avg.toFixed(2);
  });

  pastSessionCount = computed(() => {
    return this.sessions.getAllSessions().length;
  });

  constructor() {
    // Update session duration every second
    effect(() => {
      if (this.sessions.currentSession()) {
        const interval = setInterval(() => {
          // Force recomputation by accessing the signal
          this.sessions.currentSession();
        }, 1000);

        return () => clearInterval(interval);
      }
    });
  }

  toggleDetails() {
    this.showDetails.update(v => !v);
    this.haptic.light();
  }

  async startSession(name: string = '') {
    const sessionName = name.trim() || `Investigation ${new Date().toLocaleString()}`;
    await this.sessions.startSession(sessionName);

    this.toast.success('Investigation session started');
    this.analytics.trackEvent('session_started', 'investigation', { name: sessionName });
    this.haptic.medium();

    this.showStartForm.set(false);
  }

  cancelStart() {
    this.showStartForm.set(false);
    this.haptic.light();
  }

  async endSession() {
    const session = this.sessions.currentSession();
    if (!session) return;

    await this.sessions.endSession();

    this.toast.success('Investigation session ended');
    this.analytics.trackEvent('session_ended', 'investigation', {
      duration: Date.now() - session.startTime,
      detections: session.detections.length
    });
    this.haptic.medium();

    this.showDetails.set(false);
  }
}
