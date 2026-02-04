import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { UpgradeService } from './upgrade.service';
import { EnvironmentService } from './environment.service';
import { ToastService } from './toast.service';

export type FeatureKey = 'spiritBox' | 'audioAnalyzer' | 'exportLogs' | 'premiumThemes';

const FEATURE_COSTS: Record<FeatureKey, number> = {
  spiritBox: 20,
  audioAnalyzer: 15,
  exportLogs: 10,
  premiumThemes: 10,
};

interface MonetizationState {
  unlockedFeatures: FeatureKey[];
}

@Injectable({
  providedIn: 'root',
})
export class MonetizationService {
  private upgrade = inject(UpgradeService);
  private env = inject(EnvironmentService);
  private toast = inject(ToastService);
  private readonly storageKey = 'monetization';

  unlockedFeatures = signal<FeatureKey[]>([]);
  private temporaryUnlocks = signal<Partial<Record<FeatureKey, number>>>({});
  featureCosts = FEATURE_COSTS;

  adsEnabled = computed(() => !this.upgrade.isPro());

  constructor() {
    this.loadState();
    effect(() => {
      this.saveState();
    });
  }

  isFeatureUnlocked(feature: FeatureKey): boolean {
    if (this.upgrade.isPro()) {
      return true;
    }
    if (this.unlockedFeatures().includes(feature)) {
      return true;
    }
    const unlocks = this.temporaryUnlocks();
    const expiresAt = unlocks[feature];
    return typeof expiresAt === 'number' && expiresAt > Date.now();
  }

  unlockFeatureWithCredits(feature: FeatureKey): boolean {
    if (this.isFeatureUnlocked(feature)) {
      return true;
    }
    const cost = FEATURE_COSTS[feature];
    if (this.upgrade.spendCredits(cost)) {
      this.unlockedFeatures.update(features => [...features, feature]);
      this.toast.success(`Unlocked ${this.describeFeature(feature)} for ${cost} NC`);
      return true;
    }
    this.toast.warning('Not enough credits. Visit the store to refuel.');
    return false;
  }

  unlockFeatureWithAd(feature: FeatureKey): void {
    const expiresAt = Date.now() + 20 * 60 * 1000;
    this.temporaryUnlocks.update(unlocks => ({ ...unlocks, [feature]: expiresAt }));
    this.toast.info('Sponsor access granted for 20 minutes.');
  }

  getFeatureCost(feature: FeatureKey): number {
    return FEATURE_COSTS[feature];
  }

  private describeFeature(feature: FeatureKey): string {
    switch (feature) {
      case 'spiritBox':
        return 'Spirit Box';
      case 'audioAnalyzer':
        return 'Audio Analyzer';
      case 'exportLogs':
        return 'Session Export';
      case 'premiumThemes':
        return 'Premium Themes';
      default:
        return 'Feature';
    }
  }

  private loadState(): void {
    const stored = this.env.getStorageItem(this.storageKey);
    if (!stored) return;
    try {
      const state = JSON.parse(stored) as MonetizationState;
      if (Array.isArray(state.unlockedFeatures)) {
        this.unlockedFeatures.set(state.unlockedFeatures);
      }
    } catch {
      this.toast.warning('Failed to load monetization state.');
    }
  }

  private saveState(): void {
    const state: MonetizationState = {
      unlockedFeatures: this.unlockedFeatures(),
    };
    this.env.setStorageItem(this.storageKey, JSON.stringify(state));
  }
}
