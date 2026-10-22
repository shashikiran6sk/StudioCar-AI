import type { PlatePoint } from "./plate-branding.types";

/** Monotone-chain hull; shared by the plate-surface boundary fit. */
export function convexHull(points: readonly PlatePoint[]): PlatePoint[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (a: PlatePoint, b: PlatePoint, c: PlatePoint): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const half = (vertices: readonly PlatePoint[]): PlatePoint[] => {
    const hull: PlatePoint[] = [];
    for (const vertex of vertices) {
      for (;;) {
        const a = hull.at(-2);
        const b = hull.at(-1);
        if (!a || !b || cross(a, b, vertex) > 0) break;
        hull.pop();
      }
      hull.push(vertex);
    }
    return hull;
  };
  return [...half(sorted).slice(0, -1), ...half(sorted.reverse()).slice(0, -1)];
}
