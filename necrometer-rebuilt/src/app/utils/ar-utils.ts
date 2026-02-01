export interface ScenePoint { x: number; y: number }
export interface SceneObject { name: string; polylines: ScenePoint[][] }

export function pointInPolygon(point: ScenePoint, polygon: ScenePoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findNearestAnchor(sceneObjects: SceneObject[], spawnX: number, spawnY: number) {
  let best = null as any;
  let bestDist = Infinity;
  for (let oi = 0; oi < sceneObjects.length; oi++) {
    const obj = sceneObjects[oi];
    for (let pi = 0; pi < obj.polylines.length; pi++) {
      const poly = obj.polylines[pi];
      for (let pt = 0; pt < poly.length; pt++) {
        const p = poly[pt];
        const dx = spawnX - p.x;
        const dy = spawnY - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = { objectIndex: oi, polylineIndex: pi, pointIndex: pt, baseX: p.x, baseY: p.y };
        }
      }
    }
  }
  if (!best) return null;
  // Add a deterministic depth based on objectIndex to vary anchors predictably
  best.offsetX = spawnX - best.baseX;
  best.offsetY = spawnY - best.baseY;
  best.depth = 1 + ((best.objectIndex % 3) * 0.45); // 1.0,1.45,1.9 repeatable
  return best;
}

export function computeOcclusionLevel(entity: { anchor?: any }, sceneObjects: SceneObject[]) {
  if (!entity.anchor) return 0;
  const a = entity.anchor;
  const obj = sceneObjects[a.objectIndex];
  if (!obj) return 0;
  for (const poly of obj.polylines) {
    if (poly && poly.length >= 3) {
      if (pointInPolygon({ x: a.baseX + a.offsetX, y: a.baseY + a.offsetY }, poly)) {
        // occlusion scales with depth: depth <=1 => 0; depth 1..2 => 0..1
        const depth = a.depth || 1;
        return Math.max(0, Math.min(1, (depth - 1) / 1.0));
      }
    }
  }
  return 0;
}
