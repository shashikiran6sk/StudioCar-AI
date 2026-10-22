import { logger } from "@studiocar/observability";

import type { RawImage } from "../execution/vehicle-alpha.types";
import { PLATE_BRANDING_EVENT, PLATE_BRANDING_OUTCOMES } from "./plate-branding.constants";
import type { PlateBrandingPort, PlateOverlay } from "./plate-branding.types";

/** Branding must never reclassify a successful background removal as a failure. */
export async function preparePlateOverlay(branding: PlateBrandingPort | undefined, image: RawImage): Promise<PlateOverlay | null> {
  if (!branding) return null;
  const started = performance.now();
  try {
    const overlay = await branding.prepare(image);
    logger.log("info", PLATE_BRANDING_EVENT, {
      durationMs: performance.now() - started,
      outcome: overlay ? PLATE_BRANDING_OUTCOMES.PREPARED : PLATE_BRANDING_OUTCOMES.NO_PLATE,
    });
    return overlay;
  } catch {
    // No detector error text, image data or recognized plate characters are logged.
    logger.log("warn", PLATE_BRANDING_EVENT, {
      durationMs: performance.now() - started, outcome: PLATE_BRANDING_OUTCOMES.ERROR,
    });
    return null;
  }
}
