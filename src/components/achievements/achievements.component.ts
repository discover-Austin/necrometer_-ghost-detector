import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from '../../services/achievement.service';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-bold text-[var(--color-primary-400)]">Achievements</h2>
        <div class="flex items-center justify-center gap-3">
          <div class="text-sm text-gray-400">
            <span class="text-2xl font-bold text-[var(--color-primary-300)]">{{ service.getUnlockedCount() }}</span>
            <span class="text-gray-500"> / {{ service.getTotalCount() }}</span>
          </div>
          <div class="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-400)] transition-all duration-500"
              [style.width.%]="service.getCompletionPercentage()">
            </div>
          </div>
          <span class="text-sm font-mono text-[var(--color-primary-400)]">
            {{ service.getCompletionPercentage().toFixed(0) }}%
          </span>
        </div>
      </div>

      <!-- Achievement Categories -->
      @for (category of categories; track category.id) {
        <section class="space-y-3">
          <h3 class="text-lg font-semibold text-[var(--color-primary-300)] flex items-center gap-2">
            <span class="text-2xl">{{ category.icon }}</span>
            {{ category.name }}
          </h3>

          <div class="grid gap-3">
            @for (achievement of service.getByCategory(category.id); track achievement.id) {
              <div
                class="bg-black/40 border rounded-lg p-4 transition-all duration-300"
                [class.border-[var(--color-primary-500)]="achievement.unlocked"
                [class.border-gray-700]="!achievement.unlocked"
                [class.opacity-50]="!achievement.unlocked">

                <div class="flex items-start gap-4">
                  <!-- Icon -->
                  <div
                    class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all"
                    [class.bg-[var(--color-primary-600)]="achievement.unlocked"
                    [class.bg-gray-800]="!achievement.unlocked"
                    [class.shadow-lg]="achievement.unlocked"
                    [class.shadow-[var(--color-primary-500)]/50]="achievement.unlocked">
                    {{ achievement.icon }}
                  </div>

                  <!-- Content -->
                  <div class="flex-grow">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="font-bold"
                            [class.text-[var(--color-primary-300)]="achievement.unlocked"
                            [class.text-gray-500]="!achievement.unlocked">
                          {{ achievement.title }}
                        </h4>
                        <p class="text-sm text-gray-400 mt-1">{{ achievement.description }}</p>
                      </div>

                      @if (achievement.unlocked) {
                        <div class="flex-shrink-0 ml-3">
                          <svg class="w-6 h-6 text-[var(--color-primary-400)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                          </svg>
                        </div>
                      }
                    </div>

                    <!-- Progress Bar -->
                    @if (!achievement.unlocked && achievement.maxProgress > 1) {
                      <div class="mt-3">
                        <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span class="font-mono">{{ achievement.progress }} / {{ achievement.maxProgress }}</span>
                        </div>
                        <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-[var(--color-primary-600)] transition-all duration-500"
                            [style.width.%]="(achievement.progress / achievement.maxProgress) * 100">
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Unlock Date -->
                    @if (achievement.unlocked && achievement.unlockedAt) {
                      <p class="text-xs text-gray-600 mt-2">
                        Unlocked {{ formatDate(achievement.unlockedAt) }}
                      </p>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Hidden Achievements Hint -->
      @if (hiddenCount() > 0) {
        <div class="text-center p-4 bg-black/40 border border-dashed border-gray-700 rounded-lg">
          <p class="text-sm text-gray-500">
            🔒 {{ hiddenCount() }} more achievement{{ hiddenCount() > 1 ? 's' : '' }} to discover...
          </p>
        </div>
      }
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
export class AchievementsComponent {
  service = inject(AchievementService);

  categories = [
    { id: 'detection' as const, name: 'Detection', icon: '🔍' },
    { id: 'containment' as const, name: 'Containment', icon: '🛡️' },
    { id: 'exploration' as const, name: 'Exploration', icon: '🗺️' },
    { id: 'mastery' as const, name: 'Mastery', icon: '⭐' }
  ];

  hiddenCount = computed(() => {
    // Could add "hidden" achievements that don't show until unlocked
    return 0;
  });

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
