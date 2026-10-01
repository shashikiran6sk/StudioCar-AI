import { extractAlpha } from "./extract-alpha";
import { findAlphaBounds } from "./find-alpha-bounds";
import {
  CONTENT_ALPHA_THRESHOLD,
  MINIMUM_VEHICLE_COVERAGE,
  VEHICLE_ALPHA_THRESHOLD,
} from "./image-execution.constants";
import type { CutoutMeasurement, RawImage } from "./vehicle-alpha.types";

/**
 * Where the vehicle body and everything worth keeping are in a cutout, or
 * null when the provider returned no vehicle at all. RGB never decides this:
 * only alpha does, so glass and shadow colours cannot move the bounds.
 */
export function measureCutout(cutout: RawImage): CutoutMeasurement | null {
  const alpha = extractAlpha(cutout);
  const vehicle = findAlphaBounds(
    alpha,
    cutout.width,
    cutout.height,
    VEHICLE_ALPHA_THRESHOLD,
  );
  const content = findAlphaBounds(
    alpha,
    cutout.width,
    cutout.height,
    CONTENT_ALPHA_THRESHOLD,
  );
  if (vehicle === null || content === null) return null;
  const vehicleCoverage = vehicle.pixelCount / (cutout.width * cutout.height);
  if (vehicleCoverage < MINIMUM_VEHICLE_COVERAGE) return null;
  return { content: content.box, vehicle: vehicle.box, vehicleCoverage };
}
