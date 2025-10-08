export interface ReactionConfig {
  emfShockThreshold: number;
  shockMouthOpen: number;
  shockLimbBoost: number;
}

export function computeMouthOpen(baseMouth: number, emfReading: number, cfg: ReactionConfig): number {
  let mouthOpenTarget = 0;
  if (emfReading >= cfg.emfShockThreshold) {
    mouthOpenTarget = cfg.shockMouthOpen;
  }
  // Blend base mouth with target (80% target influence)
  return Math.max(0, Math.min(1, baseMouth + mouthOpenTarget * 0.8));
}

export function computeAgitation(emfReading: number, baseAgitation: number, cfg: ReactionConfig): number {
  const agitation = baseAgitation + (emfReading >= cfg.emfShockThreshold ? cfg.shockLimbBoost : 0);
  return agitation;
}
