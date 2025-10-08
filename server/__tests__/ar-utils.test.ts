import { pointInPolygon, findNearestAnchor, computeOcclusionLevel } from '../../src/utils/ar-utils';

describe('ar-utils', () => {
  test('pointInPolygon detects inside/outside correctly', () => {
    const poly = [ {x:0,y:0}, {x:10,y:0}, {x:10,y:10}, {x:0,y:10} ];
    expect(pointInPolygon({x:5,y:5}, poly)).toBe(true);
    expect(pointInPolygon({x:-1,y:5}, poly)).toBe(false);
    expect(pointInPolygon({x:5,y:11}, poly)).toBe(false);
  });

  test('findNearestAnchor returns nearest point', () => {
    const scene = [ { name: 'A', polylines: [ [ {x:10,y:10}, {x:20,y:10} ] ] } ];
    const anchor = findNearestAnchor(scene as any, 12, 12);
    expect(anchor).not.toBeNull();
    expect(anchor.baseX).toBe(10);
  });

  test('computeOcclusionLevel scales with depth', () => {
    const scene = [ { name: 'A', polylines: [ [ {x:10,y:10}, {x:20,y:10}, {x:20,y:20}, {x:10,y:20} ] ] } ];
    const entity = { anchor: { objectIndex: 0, baseX: 12, baseY: 12, offsetX: 0, offsetY: 0, depth: 1.5 } };
    const level = computeOcclusionLevel(entity as any, scene as any);
    expect(level).toBeGreaterThan(0);
    expect(level).toBeCloseTo(0.5, 1);
  });
});
