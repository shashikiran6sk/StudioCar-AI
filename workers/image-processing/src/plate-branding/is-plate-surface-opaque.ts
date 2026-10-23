import type { RawImage } from "../execution/vehicle-alpha.types";
import { PLATE_OPAQUE_ALPHA, PLATE_SURFACE_OPAQUE_SAMPLE_POSITIONS } from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";

/** Check the actual plate rather than the empty corners of its detector box. */
export function isPlateSurfaceOpaque(image: RawImage, corners: PlateQuadrilateral): boolean {
  if (image.channels === 3) return true;
  for (const v of PLATE_SURFACE_OPAQUE_SAMPLE_POSITIONS) for (const u of PLATE_SURFACE_OPAQUE_SAMPLE_POSITIONS) {
    const topX = corners.topLeft.x * (1 - u) + corners.topRight.x * u;
    const topY = corners.topLeft.y * (1 - u) + corners.topRight.y * u;
    const bottomX = corners.bottomLeft.x * (1 - u) + corners.bottomRight.x * u;
    const bottomY = corners.bottomLeft.y * (1 - u) + corners.bottomRight.y * u;
    const x = Math.floor(topX * (1 - v) + bottomX * v);
    const y = Math.floor(topY * (1 - v) + bottomY * v);
    if (x < 0 || y < 0 || x >= image.width || y >= image.height ||
        (image.data[(y * image.width + x) * 4 + 3] ?? 0) < PLATE_OPAQUE_ALPHA) return false;
  }
  return true;
}
