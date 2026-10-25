import { hasConsistentPlateTilt } from "./has-consistent-plate-tilt";
import {
  PLATE_PROJECTED_MINIMUM_AVERAGE_SIDE_SHARE, PLATE_PROJECTED_MINIMUM_HULL_SHARE,
  PLATE_PROJECTED_MINIMUM_RECTIFIED_COVERAGE, PLATE_PROJECTED_MINIMUM_SIDE_SHARE,
} from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";
import { polygonArea } from "./polygon-area";

/** Remove the vertical rise from the box before judging a steep plate's height. */
export function hasProjectedPlateCoverage(corners: PlateQuadrilateral, width: number, height: number, hullArea: number): boolean {
  if (!hasConsistentPlateTilt(corners, width, height)) return false;
  const rise = Math.min(Math.abs(corners.topRight.y - corners.topLeft.y),
    Math.abs(corners.bottomRight.y - corners.bottomLeft.y));
  const rectifiedHeight = height - rise;
  if (rectifiedHeight <= 0) return false;
  const left = corners.bottomLeft.y - corners.topLeft.y;
  const right = corners.bottomRight.y - corners.topRight.y;
  const area = polygonArea([corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]);
  return Math.min(left, right) >= rectifiedHeight * PLATE_PROJECTED_MINIMUM_SIDE_SHARE &&
    (left + right) / 2 >= rectifiedHeight * PLATE_PROJECTED_MINIMUM_AVERAGE_SIDE_SHARE &&
    area >= width * rectifiedHeight * PLATE_PROJECTED_MINIMUM_RECTIFIED_COVERAGE &&
    hullArea >= area * PLATE_PROJECTED_MINIMUM_HULL_SHARE;
}
