import { PLATE_GEOMETRY_EPSILON } from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";

/** Sine of the side-edge angle difference, independent of image rotation and scale. */
export function plateSideShear(corners: PlateQuadrilateral): number {
  const lx = corners.bottomLeft.x - corners.topLeft.x;
  const ly = corners.bottomLeft.y - corners.topLeft.y;
  const rx = corners.bottomRight.x - corners.topRight.x;
  const ry = corners.bottomRight.y - corners.topRight.y;
  const length = Math.hypot(lx, ly) * Math.hypot(rx, ry);
  return length > PLATE_GEOMETRY_EPSILON ? Math.abs(lx * ry - ly * rx) / length : Infinity;
}
