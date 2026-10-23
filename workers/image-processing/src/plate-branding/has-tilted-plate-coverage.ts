import {
  PLATE_TILTED_MAXIMUM_RISE_DIFFERENCE_SHARE, PLATE_TILTED_MINIMUM_RISE_SHARE,
  PLATE_TILTED_MINIMUM_SIDE_SHARE, PLATE_TILTED_MINIMUM_WIDTH_SHARE,
} from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";

/** Require a complete slanted outline, not a thin bright strip or flat patch. */
export function hasTiltedPlateCoverage(corners: PlateQuadrilateral, detectorWidth: number, detectorHeight: number): boolean {
  const topRise = corners.topRight.y - corners.topLeft.y;
  const bottomRise = corners.bottomRight.y - corners.bottomLeft.y;
  return corners.topRight.x - corners.topLeft.x >= detectorWidth * PLATE_TILTED_MINIMUM_WIDTH_SHARE &&
    corners.bottomRight.x - corners.bottomLeft.x >= detectorWidth * PLATE_TILTED_MINIMUM_WIDTH_SHARE &&
    corners.bottomLeft.y - corners.topLeft.y >= detectorHeight * PLATE_TILTED_MINIMUM_SIDE_SHARE &&
    corners.bottomRight.y - corners.topRight.y >= detectorHeight * PLATE_TILTED_MINIMUM_SIDE_SHARE &&
    topRise * bottomRise > 0 &&
    Math.min(Math.abs(topRise), Math.abs(bottomRise)) >= detectorHeight * PLATE_TILTED_MINIMUM_RISE_SHARE &&
    Math.abs(topRise - bottomRise) <= detectorHeight * PLATE_TILTED_MAXIMUM_RISE_DIFFERENCE_SHARE;
}
