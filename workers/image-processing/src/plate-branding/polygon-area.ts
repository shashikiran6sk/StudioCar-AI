import type { PlatePoint } from "./plate-branding.types";

export function polygonArea(points: readonly PlatePoint[]): number {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return next ? sum + point.x * next.y - next.x * point.y : sum;
  }, 0)) / 2;
}
