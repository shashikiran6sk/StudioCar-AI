import type { BackgroundTreatment } from "@studiocar/contracts";

import {
  STUDIO_SCENE_PALETTES,
  type StudioSceneBackground,
} from "./studio-scene.constants";

/** True for the backgrounds drawn as a studio with a wall and a floor. */
export function isStudioSceneBackground(
  background: BackgroundTreatment,
): background is StudioSceneBackground {
  return Object.hasOwn(STUDIO_SCENE_PALETTES, background);
}
