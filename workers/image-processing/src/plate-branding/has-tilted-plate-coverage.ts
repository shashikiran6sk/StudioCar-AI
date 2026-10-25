import { PLATE_TILTED_MINIMUM_SIDE_SHARE } from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";
import { hasConsistentPlateTilt } from "./has-consistent-plate-tilt";

/** Require a complete slanted outline, not a thin bright strip or flat patch. */
export function hasTiltedPlateCoverage(corners: PlateQuadrilateral, detectorWidth: number, detectorHeight: number): boolean {
  return hasConsistentPlateTilt(corners, detectorWidth, detectorHeight) &&
    corners.bottomLeft.y - corners.topLeft.y >= detectorHeight * PLATE_TILTED_MINIMUM_SIDE_SHARE &&
    corners.bottomRight.y - corners.topRight.y >= detectorHeight * PLATE_TILTED_MINIMUM_SIDE_SHARE;
}
