import type { StudioTreatment } from "@studiocar/contracts";

import { PROCESSING_STUDIO_ASSETS } from "./processing-studio-assets.constants";
import type { StudioSceneAssetKeys } from "./studio-scene.types";

/**
 * The storage keys for a background and its floor. Both IDs are always used:
 * the floor is never inferred from the background.
 */
export function resolveStudioSceneAssetKeys(
  treatment: StudioTreatment,
): StudioSceneAssetKeys {
  const floor = PROCESSING_STUDIO_ASSETS.floors[treatment.floorId];
  return {
    backgroundKey: PROCESSING_STUDIO_ASSETS.backgrounds[treatment.backgroundId],
    floorKey: floor.objectKey,
    floorKind: floor.kind,
  };
}
