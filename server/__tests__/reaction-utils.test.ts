import { computeMouthOpen, computeAgitation, ReactionConfig } from '../../src/utils/reaction-utils';

describe('reaction-utils', () => {
  const cfg: ReactionConfig = {
    emfShockThreshold: 50,
    shockMouthOpen: 0.9,
    shockLimbBoost: 2.0,
  };

  test('computeMouthOpen blends target when EMF over threshold', () => {
    const base = 0.1;
    const emf = 60;
    const mouth = computeMouthOpen(base, emf, cfg);
    // target contributes 0.9 * 0.8 = 0.72, so expect > base
    expect(mouth).toBeGreaterThan(base);
    expect(mouth).toBeCloseTo(Math.min(1, base + cfg.shockMouthOpen * 0.8));
  });

  test('computeMouthOpen unchanged when EMF below threshold', () => {
    const base = 0.2;
    const emf = 10;
    const mouth = computeMouthOpen(base, emf, cfg);
    expect(mouth).toBeCloseTo(base);
  });

  test('computeAgitation increases with shock', () => {
    const baseAg = 1.0;
    expect(computeAgitation(10, baseAg, cfg)).toBeCloseTo(baseAg);
    expect(computeAgitation(100, baseAg, cfg)).toBeCloseTo(baseAg + cfg.shockLimbBoost);
  });
});
