import type { PlateQuadrilateral } from "./plate-branding.types";

/** Measure the physical face, independent of an angled detector rectangle. */
export function plateSurfaceAspect(corners: PlateQuadrilateral): number {
  const width = Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y) +
    Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y);
  const height = Math.hypot(corners.bottomLeft.x - corners.topLeft.x, corners.bottomLeft.y - corners.topLeft.y) +
    Math.hypot(corners.bottomRight.x - corners.topRight.x, corners.bottomRight.y - corners.topRight.y);
  return width / height;
}
