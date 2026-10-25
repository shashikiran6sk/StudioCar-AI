import type { PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";
import {
  PLATE_MAXIMUM_AMBIGUOUS_SURFACE_CHECKS,
  PLATE_STANDARD_SURFACE_FIT_PASSES, PLATE_SURFACE_FIT_PASSES,
} from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";
import { refinePlateQuadrilateral } from "./refine-plate-quadrilateral";
import { selectVisiblePlate } from "./select-visible-plate";

/** A badge without a physical plate surface must not create ambiguity. */
export function findVisiblePlateSurface(image: RawImage, detections: readonly PlateDetection[]): PlateQuadrilateral | null {
  const candidates = detections.filter((box) => selectVisiblePlate(image, [box]) !== null)
    .sort((a, b) => b.score - a.score);
  const primary = candidates[0];
  if (!primary) return null;
  // Never promote a lower-ranked background plate if the primary is unreliable.
  const standard = refinePlateQuadrilateral(image, primary, PLATE_STANDARD_SURFACE_FIT_PASSES);
  // The full fit retains an immediate ambiguity exit in either prior pass.
  const corners = standard ?? refinePlateQuadrilateral(image, primary);
  if (!corners) return null;
  // New secondary fits must not invalidate a previously successful primary.
  // When the primary needs the new fallback, use it for rivals too.
  const secondaryPasses = standard ? PLATE_STANDARD_SURFACE_FIT_PASSES : PLATE_SURFACE_FIT_PASSES;
  let checks = 0;
  for (const secondary of candidates.slice(1)) {
    if (selectVisiblePlate(image, [primary, secondary])) continue;
    // Bound additional fitting work; excessive ambiguity remains a safe skip.
    if (++checks > PLATE_MAXIMUM_AMBIGUOUS_SURFACE_CHECKS ||
        refinePlateQuadrilateral(image, secondary, secondaryPasses)) return null;
  }
  return corners;
}
