import type { ProcessingObjectStoragePort } from "../storage/processing-object-storage.types";
import type { StudioSceneAssetSourcePort } from "./studio-scene-asset-source.types";
import type { StudioSceneAssetKeys, StudioSceneAssets } from "./studio-scene.types";

/**
 * Reads studio layers from object storage once per process.
 *
 * Processing assets are immutable under their versioned keys, so a warm
 * worker reuses what it has already downloaded. A failed read is forgotten,
 * so the next job tries storage again instead of repeating the failure.
 */
export class CachedStudioSceneAssetSource implements StudioSceneAssetSourcePort {
  private readonly objects = new Map<string, Promise<Uint8Array>>();

  public constructor(
    private readonly storage: Pick<ProcessingObjectStoragePort, "getRequired">,
  ) {}

  public async load(keys: StudioSceneAssetKeys): Promise<StudioSceneAssets> {
    const [background, floor] = await Promise.all([
      this.object(keys.backgroundKey),
      this.object(keys.floorKey),
    ]);
    return { background, floor, floorKind: keys.floorKind };
  }

  private object(key: string): Promise<Uint8Array> {
    const cached = this.objects.get(key);
    if (cached) return cached;

    const pending = this.storage.getRequired(key).then((object) => object.bytes);
    this.objects.set(key, pending);
    pending.catch(() => {
      this.objects.delete(key);
    });
    return pending;
  }
}
