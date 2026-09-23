import type { StudioSceneAssetKeys, StudioSceneAssets } from "./studio-scene.types";

/** Loads a studio treatment's layers from wherever processing assets live. */
export interface StudioSceneAssetSourcePort {
  load(keys: StudioSceneAssetKeys): Promise<StudioSceneAssets>;
}
