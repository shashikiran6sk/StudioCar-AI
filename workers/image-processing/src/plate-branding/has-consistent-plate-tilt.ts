import {
  PLATE_TILTED_MAXIMUM_RISE_DIFFERENCE_SHARE, PLATE_TILTED_MINIMUM_RISE_SHARE,
  PLATE_TILTED_MINIMUM_WIDTH_SHARE,
} from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";

/** Broad top/bottom edges must slope consistently in either viewing direction. */
export function hasConsistentPlateTilt(corners: PlateQuadrilateral, width: number, height: number): boolean {
  const topRise = corners.topRight.y - corners.topLeft.y;
  const bottomRise = corners.bottomRight.y - corners.bottomLeft.y;
  return corners.topRight.x - corners.topLeft.x >= width * PLATE_TILTED_MINIMUM_WIDTH_SHARE &&
    corners.bottomRight.x - corners.bottomLeft.x >= width * PLATE_TILTED_MINIMUM_WIDTH_SHARE &&
    topRise * bottomRise > 0 &&
    Math.min(Math.abs(topRise), Math.abs(bottomRise)) >= height * PLATE_TILTED_MINIMUM_RISE_SHARE &&
    Math.abs(topRise - bottomRise) <= height * PLATE_TILTED_MAXIMUM_RISE_DIFFERENCE_SHARE;
}
