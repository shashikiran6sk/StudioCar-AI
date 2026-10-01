import type { BackgroundTreatment } from "@studiocar/contracts";

import { STUDIO_BACKGROUND_ASSETS } from "./studio-background.constants";
import type { StudioBackground } from "./studio-background.types";

/** True for the backgrounds StudioCar composes a vehicle onto. */
export function isStudioBackground(
  background: BackgroundTreatment,
): background is StudioBackground {
  return Object.hasOwn(STUDIO_BACKGROUND_ASSETS, background);
}
