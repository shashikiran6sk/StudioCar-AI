import { logger } from "@studiocar/observability";

import type { RawImage } from "../execution/vehicle-alpha.types";
import type { VehicleFraming } from "../execution/vehicle-framing.types";
import { applyPlateOverlay } from "./apply-plate-overlay";
import { PLATE_BRANDING_EVENT, PLATE_BRANDING_OUTCOMES } from "./plate-branding.constants";
import type { PlateOverlay } from "./plate-branding.types";

/** Even a rendering defect must preserve the existing successful render. */
export function safeApplyPlateOverlay(image: RawImage, overlay: PlateOverlay | null, framing: VehicleFraming): RawImage {
  if (!overlay) return image;
  try {
    const branded = applyPlateOverlay(image, overlay, framing);
    logger.log("info", PLATE_BRANDING_EVENT, {
      outcome: branded === image ? PLATE_BRANDING_OUTCOMES.NO_PLATE : PLATE_BRANDING_OUTCOMES.APPLIED,
    });
    return branded;
  } catch {
    logger.log("warn", PLATE_BRANDING_EVENT, { outcome: PLATE_BRANDING_OUTCOMES.ERROR });
    return image;
  }
}
