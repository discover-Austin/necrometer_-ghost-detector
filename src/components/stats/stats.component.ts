import { Component, ChangeDetectionStrategy, inject, computed, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectedEntity } from '../../types';
import { InvestigationSessionService } from '../../services/investigation-session.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AchievementService } from '../../services/achievement.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-6 overflow-y-auto h-full">
      <!-- Header -->
      <div class="border-b border-[var(--color-primary-500)]/30 pb-4">
        <h2 class="text-2xl font-bold text-[var(--color-primary-400)]">Investigation Statistics</h2>
        <p class="text-sm text-gray-400">Your paranormal investigation metrics</p>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Total Detections</div>
          <div class="text-3xl font-bold text-[var(--color-primary-300)] mt-1">{{ totalDetections() }}</div>
        </div>

        <div class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Contained</div>
          <div class="text-3xl font-bold text-green-400 mt-1">{{ containedCount() }}</div>
        </div>

        <div class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Active Threats</div>
          <div class="text-3xl font-bold text-red-400 mt-1">{{ activeCount() }}</div>
        </div>

        <div class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Success Rate</div>
          <div class="text-3xl font-bold text-[var(--color-primary-300)] mt-1">
            {{ successRate() }}%
          </div>
        </div>
      </div>

      <!-- EMF Statistics -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
          </svg>
          EMF Readings
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Average EMF:</span>
            <span class="font-mono text-[var(--color-primary-400)]">{{ averageEMF() }} mG</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Highest Reading:</span>
            <span class="font-mono text-red-400">{{ highestEMF() }} mG</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Lowest Reading:</span>
            <span class="font-mono text-blue-400">{{ lowestEMF() }} mG</span>
          </div>
        </div>
      </section>

      <!-- Entity Types Distribution -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          Entity Types
        </h3>
        <div class="space-y-2">
          @for (type of entityTypes(); track type.name) {
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-300">{{ type.name }}</span>
                <span class="font-mono text-[var(--color-primary-400)]">{{ type.count }}</span>
              </div>
              <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-[var(--color-primary-600)] transition-all"
                  [style.width.%]="type.percentage">
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Investigation Sessions -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          Investigation Sessions
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Total Sessions:</span>
            <span class="font-mono text-[var(--color-primary-400)]">{{ sessions.getAllSessions().length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Active Session:</span>
            <span class="font-mono text-[var(--color-primary-400)]">
              {{ sessions.currentSession() ? 'In Progress' : 'None' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Achievement Progress -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Achievements
        </h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">Progress:</span>
            <span class="font-mono text-[var(--color-primary-400)]">
              {{ achievements.getUnlockedCount() }} / {{ achievements.getTotalCount() }}
            </span>
          </div>
          <div class="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-400)] transition-all"
              [style.width.%]="achievements.getCompletionPercentage()">
            </div>
          </div>
        </div>
      </section>

      <!-- Analytics Summary -->
      <section class="bg-black/40 border border-[var(--color-primary-500)]/20 rounded-lg p-4 space-y-3">
        <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Analytics
        </h3>
        <div class="space-y-2 text-sm">
          @for (cat of analyticsCategories(); track cat.category) {
            <div class="flex justify-between">
              <span class="text-gray-400 capitalize">{{ cat.category }}:</span>
              <span class="font-mono text-[var(--color-primary-400)]">{{ cat.count }} events</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class StatsComponent {
  @Input() detections: DetectedEntity[] = [];

  sessions = inject(InvestigationSessionService);
  private analytics = inject(AnalyticsService);
  achievements = inject(AchievementService);

  totalDetections = computed(() => this.detections.length);
  containedCount = computed(() => this.detections.filter(d => d.contained).length);
  activeCount = computed(() => this.detections.filter(d => !d.contained).length);
  successRate = computed(() => {
    const total = this.totalDetections();
    if (total === 0) return 0;
    return Math.round((this.containedCount() / total) * 100);
  });

  averageEMF = computed(() => {
    const total = this.totalDetections();
    if (total === 0) return 0;
    const sum = this.detections.reduce((acc, d) => acc + d.emfReading, 0);
    return (sum / total).toFixed(2);
  });

  highestEMF = computed(() => {
    if (this.detections.length === 0) return 0;
    return Math.max(...this.detections.map(d => d.emfReading)).toFixed(2);
  });

  lowestEMF = computed(() => {
    if (this.detections.length === 0) return 0;
    return Math.min(...this.detections.map(d => d.emfReading)).toFixed(2);
  });

  entityTypes = computed(() => {
    const types: Record<string, number> = {};
    const total = this.detections.length;

    this.detections.forEach(d => {
      types[d.type] = (types[d.type] || 0) + 1;
    });

    return Object.entries(types)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  });

  analyticsCategories = computed(() => {
    const summary = this.analytics.getSummary();
    return Object.entries(summary.categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  });
}
