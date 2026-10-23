import {
  PLATE_GEOMETRY_EPSILON, PLATE_OUTLINE_MAXIMUM_AREA_RATIO,
  PLATE_OUTLINE_MAXIMUM_CORNER_SHIFT_SHARE, PLATE_OUTLINE_MAXIMUM_RESIDUAL_SHARE,
  PLATE_OUTLINE_MINIMUM_DIRECTION_DOT, PLATE_OUTLINE_MINIMUM_SEGMENT_SHARE,
  PLATE_OUTLINE_MINIMUM_SUPPORT_SHARE,
} from "./plate-branding.constants";
import type { PlatePoint, PlateQuadrilateral } from "./plate-branding.types";
import { polygonArea } from "./polygon-area";

/** Recover rounded plate corners from supported hull edges, without a box overlay. */
export function fitTiltedPlateOutline(hull: readonly PlatePoint[], initial: PlateQuadrilateral, width: number, height: number): PlateQuadrilateral | null {
  const points = [initial.topLeft, initial.topRight, initial.bottomRight, initial.bottomLeft];
  const fitLine = (a: PlatePoint, b: PlatePoint) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length <= PLATE_GEOMETRY_EPSILON) return null;
    const samples: { point: PlatePoint; weight: number }[] = [];
    let support = 0;
    for (let i = 0; i < hull.length; i++) {
      const start = hull[i];
      const end = hull[(i + 1) % hull.length];
      if (!start || !end) continue;
      const sx = end.x - start.x;
      const sy = end.y - start.y;
      const segment = Math.hypot(sx, sy);
      if (segment < length * PLATE_OUTLINE_MINIMUM_SEGMENT_SHARE ||
          (sx * dx + sy * dy) / (segment * length) < PLATE_OUTLINE_MINIMUM_DIRECTION_DOT) continue;
      samples.push({ point: start, weight: segment }, { point: end, weight: segment });
      support += segment;
    }
    if (support < length * PLATE_OUTLINE_MINIMUM_SUPPORT_SHARE) return null;
    const total = support * 2;
    const x = samples.reduce((sum, sample) => sum + sample.point.x * sample.weight, 0) / total;
    const y = samples.reduce((sum, sample) => sum + sample.point.y * sample.weight, 0) / total;
    let xx = 0;
    let yy = 0;
    let xy = 0;
    for (const { point, weight } of samples) {
      xx += (point.x - x) ** 2 * weight;
      yy += (point.y - y) ** 2 * weight;
      xy += (point.x - x) * (point.y - y) * weight;
    }
    const angle = Math.atan2(2 * xy, xx - yy) / 2;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    if (samples.some(({ point }) => Math.abs((point.x - x) * uy - (point.y - y) * ux) >
        length * PLATE_OUTLINE_MAXIMUM_RESIDUAL_SHARE)) return null;
    return { x, y, dx: ux, dy: uy };
  };
  const lines = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return next ? fitLine(point, next) : null;
  });
  const intersections: PlatePoint[] = [];
  for (let i = 0; i < lines.length; i++) {
    const a = lines[(i + lines.length - 1) % lines.length];
    const b = lines[i];
    if (!a || !b) return null;
    const cross = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(cross) <= PLATE_GEOMETRY_EPSILON) return null;
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / cross;
    const point = { x: a.x + t * a.dx, y: a.y + t * a.dy };
    const original = points[i];
    if (!original || Math.abs(point.x - original.x) > width * PLATE_OUTLINE_MAXIMUM_CORNER_SHIFT_SHARE ||
        Math.abs(point.y - original.y) > height * PLATE_OUTLINE_MAXIMUM_CORNER_SHIFT_SHARE) return null;
    intersections.push(point);
  }
  const [topLeft, topRight, bottomRight, bottomLeft] = intersections;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft ||
      polygonArea(intersections) + PLATE_GEOMETRY_EPSILON < polygonArea(points) ||
      polygonArea(intersections) > polygonArea(hull) * PLATE_OUTLINE_MAXIMUM_AREA_RATIO) return null;
  return { topLeft, topRight, bottomRight, bottomLeft };
}
