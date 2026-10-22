import { PLATE_GEOMETRY_EPSILON, PLATE_MAXIMUM_RENDER_PIXELS } from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";

/** Reject clipped, folded, degenerate or excessively large overlays. */
export function validatePlateQuadrilateral(corners: PlateQuadrilateral, width: number, height: number): boolean {
  const points = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];
  if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
      p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)) return false;
  for (let index = 0; index < points.length; index++) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const c = points[(index + 2) % points.length];
    if (!a || !b || !c || (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) <= PLATE_GEOMETRY_EPSILON) return false;
  }
  const boxWidth = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
  const boxHeight = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  return boxWidth >= 2 && boxHeight >= 2 && Math.ceil(boxWidth + 1) * Math.ceil(boxHeight + 1) <= PLATE_MAXIMUM_RENDER_PIXELS;
}
