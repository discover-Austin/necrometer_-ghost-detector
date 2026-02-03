export interface Point {
  x: number;
  y: number;
}

export interface Polyline {
  name: string;
  polylines: Point[][];
}

export interface Anchor {
  objectIndex: number;
  baseX: number;
  baseY: number;
  offsetX: number;
  offsetY: number;
  depth: number;
}

/**
 * Point-in-polygon test using ray casting algorithm
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Find nearest anchor point from polylines to given coordinates
 */
export function findNearestAnchor(
  scene: Polyline[],
  x: number,
  y: number
): Anchor | null {
  let nearest: Anchor | null = null;
  let minDistance = Infinity;

  scene.forEach((obj, objectIndex) => {
    obj.polylines.forEach((polyline) => {
      polyline.forEach((point) => {
        const distance = Math.sqrt(
          Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = {
            objectIndex,
            baseX: point.x,
            baseY: point.y,
            offsetX: x - point.x,
            offsetY: y - point.y,
            depth: 1.0,
          };
        }
      });
    });
  });

  return nearest;
}

/**
 * Compute occlusion level based on entity depth and scene geometry
 */
export function computeOcclusionLevel(
  entity: { anchor: Anchor },
  scene: Polyline[]
): number {
  if (!entity.anchor || !scene[entity.anchor.objectIndex]) {
    return 0;
  }

  const depth = entity.anchor.depth;
  const baseLevel = Math.min(1.0, depth / 3.0);

  return baseLevel;
}