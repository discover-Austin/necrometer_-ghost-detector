import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeService } from '../../services/upgrade.service';
import { MonetizationService, FeatureKey } from '../../services/monetization.service';

@Component({
  selector: 'app-upgrade', // The selector remains app-upgrade, but it now functions as the store.
  imports: [CommonModule],
  templateUrl: './upgrade.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeComponent {
  upgradeService = inject(UpgradeService);
  monetization = inject(MonetizationService);

  purchaseCredits(amount: number) {
    this.upgradeService.addCredits(amount);
  }

  purchasePro() {
    this.upgradeService.subscribeToPro();
  }

  unlockFeature(feature: FeatureKey) {
    this.monetization.unlockFeatureWithCredits(feature);
  }
}
