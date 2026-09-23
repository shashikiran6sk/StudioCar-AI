import type { StudioBackgroundId, StudioTreatment } from "@studiocar/contracts";

import { DEFAULT_STUDIO_TREATMENTS } from "./studio-treatment.constants";

/**
 * Chooses a background. Its current floor is kept only when it belongs to
 * that background; otherwise the background's first floor is chosen, so a
 * floor from another studio can never be sent.
 */
export function selectStudioBackground(
  current: StudioTreatment | null,
  backgroundId: StudioBackgroundId,
): StudioTreatment {
  if (current?.backgroundId === backgroundId) return current;
  return DEFAULT_STUDIO_TREATMENTS[backgroundId];
}
