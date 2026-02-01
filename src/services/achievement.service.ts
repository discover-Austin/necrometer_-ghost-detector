import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';
import { EnvironmentService } from './environment.service';
import { HapticService } from './haptic.service';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: 'detection' | 'containment' | 'exploration' | 'mastery';
}

/**
 * Achievement and gamification service
 * Tracks user progress and unlocks achievements
 */
@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private logger = inject(LoggerService);
  private toast = inject(ToastService);
  private env = inject(EnvironmentService);
  private haptic = inject(HapticService);

  achievements = signal<Achievement[]>([]);
  private readonly STORAGE_KEY = 'necrometer.achievements';

  constructor() {
    this.initializeAchievements();
    this.loadProgress();
  }

  /**
   * Initialize all available achievements
   */
  private initializeAchievements(): void {
    const defaultAchievements: Achievement[] = [
      // Detection achievements
      {
        id: 'first_detection',
        title: 'First Contact',
        description: 'Detect your first paranormal entity',
        icon: '👻',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        category: 'detection'
      },
      {
        id: 'detection_10',
        title: 'Novice Investigator',
        description: 'Detect 10 paranormal entities',
        icon: '🔍',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        category: 'detection'
      },
      {
        id: 'detection_50',
        title: 'Expert Hunter',
        description: 'Detect 50 paranormal entities',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        category: 'detection'
      },
      {
        id: 'detection_100',
        title: 'Master Detector',
        description: 'Detect 100 paranormal entities',
        icon: '⭐',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
        category: 'detection'
      },

      // Containment achievements
      {
        id: 'first_containment',
        title: 'Spirit Wrangler',
        description: 'Contain your first entity',
        icon: '🛡️',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        category: 'containment'
      },
      {
        id: 'containment_25',
        title: 'Containment Specialist',
        description: 'Contain 25 entities',
        icon: '🔒',
        unlocked: false,
        progress: 0,
        maxProgress: 25,
        category: 'containment'
      },

      // Exploration achievements
      {
        id: 'use_all_modes',
        title: 'Multi-Tool Expert',
        description: 'Use all detection modes',
        icon: '🎮',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        category: 'exploration'
      },
      {
        id: 'night_hunter',
        title: 'Night Hunter',
        description: 'Perform 10 detections after midnight',
        icon: '🌙',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        category: 'exploration'
      },

      // Mastery achievements
      {
        id: 'perfect_week',
        title: 'Dedicated Investigator',
        description: 'Use the app for 7 consecutive days',
        icon: '📅',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
        category: 'mastery'
      },
      {
        id: 'high_emf',
        title: 'EMF Anomaly',
        description: 'Detect an entity with EMF reading over 90',
        icon: '⚡',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        category: 'mastery'
      }
    ];

    this.achievements.set(defaultAchievements);
  }

  /**
   * Track entity detection for achievements
   */
  trackDetection(emfReading: number): void {
    this.incrementAchievement('first_detection');
    this.incrementAchievement('detection_10');
    this.incrementAchievement('detection_50');
    this.incrementAchievement('detection_100');

    // Check for night detection
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      this.incrementAchievement('night_hunter');
    }

    // Check for high EMF
    if (emfReading > 90) {
      this.incrementAchievement('high_emf');
    }
  }

  /**
   * Track entity containment
   */
  trackContainment(): void {
    this.incrementAchievement('first_containment');
    this.incrementAchievement('containment_25');
  }

  /**
   * Track feature usage
   */
  trackFeatureUse(feature: string): void {
    // Track for "use all modes" achievement
    this.incrementAchievement('use_all_modes');
  }

  /**
   * Increment achievement progress
   */
  private incrementAchievement(achievementId: string): void {
    this.achievements.update(achievements => {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlocked) return achievements;

      achievement.progress = Math.min(achievement.progress + 1, achievement.maxProgress);

      // Check if unlocked
      if (achievement.progress >= achievement.maxProgress) {
        this.unlockAchievement(achievement);
      }

      return [...achievements];
    });

    this.saveProgress();
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievement: Achievement): void {
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();

    this.logger.info(`Achievement unlocked: ${achievement.title}`);
    this.toast.success(`🏆 Achievement Unlocked: ${achievement.title}!`);
    this.haptic.success();

    // Add celebration effect
    this.triggerCelebration();
  }

  /**
   * Get unlocked achievements count
   */
  getUnlockedCount(): number {
    return this.achievements().filter(a => a.unlocked).length;
  }

  /**
   * Get total achievements count
   */
  getTotalCount(): number {
    return this.achievements().length;
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return (this.getUnlockedCount() / total) * 100;
  }

  /**
   * Get achievements by category
   */
  getByCategory(category: Achievement['category']): Achievement[] {
    return this.achievements().filter(a => a.category === category);
  }

  /**
   * Reset all achievements
   */
  resetAll(): void {
    this.achievements.update(achievements =>
      achievements.map(a => ({
        ...a,
        unlocked: false,
        unlockedAt: undefined,
        progress: 0
      }))
    );

    this.saveProgress();
    this.logger.info('All achievements reset');
  }

  /**
   * Save progress to storage
   */
  private saveProgress(): void {
    this.env.setStorageItem(this.STORAGE_KEY, JSON.stringify(this.achievements()));
  }

  /**
   * Load progress from storage
   */
  private loadProgress(): void {
    const stored = this.env.getStorageItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const savedAchievements: Achievement[] = JSON.parse(stored);

        // Merge with current achievements (in case new ones were added)
        this.achievements.update(current => {
          return current.map(achievement => {
            const saved = savedAchievements.find(s => s.id === achievement.id);
            return saved ? { ...achievement, ...saved } : achievement;
          });
        });

        this.logger.info('Achievement progress loaded');
      } catch (error) {
        this.logger.error('Failed to load achievement progress', error);
      }
    }
  }

  /**
   * Trigger celebration animation/effect
   */
  private triggerCelebration(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievement-unlocked'));
    }
  }
}
