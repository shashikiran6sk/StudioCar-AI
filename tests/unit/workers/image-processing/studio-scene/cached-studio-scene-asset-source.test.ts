import { describe, expect, it, vi } from "vitest";

import { CachedStudioSceneAssetSource } from "../../../../../workers/image-processing/src/studio-scene/cached-studio-scene-asset-source";
import type { StudioSceneAssetKeys } from "../../../../../workers/image-processing/src/studio-scene/studio-scene.types";

const KEYS: StudioSceneAssetKeys = {
  backgroundKey: "studio-assets/v1/backgrounds/bg-dark-studio.webp",
  floorKey: "studio-assets/v1/floors/floor-dark-turntable.png",
  floorKind: "TURNTABLE",
};

function storedObject(label: string) {
  return { bytes: new TextEncoder().encode(label), contentType: null, metadata: {} };
}

describe("CachedStudioSceneAssetSource", () => {
  it("reads both layers from storage and keeps the floor kind", async () => {
    const getRequired = vi.fn((key: string) => Promise.resolve(storedObject(key)));
    const source = new CachedStudioSceneAssetSource({ getRequired });

    const scene = await source.load(KEYS);

    expect(new TextDecoder().decode(scene.background)).toBe(KEYS.backgroundKey);
    expect(new TextDecoder().decode(scene.floor)).toBe(KEYS.floorKey);
    expect(scene.floorKind).toBe("TURNTABLE");
  });

  it("downloads each immutable asset once per process", async () => {
    const getRequired = vi.fn((key: string) => Promise.resolve(storedObject(key)));
    const source = new CachedStudioSceneAssetSource({ getRequired });

    await source.load(KEYS);
    await source.load(KEYS);

    expect(getRequired).toHaveBeenCalledTimes(2);
  });

  it("forgets a failed read so the next job tries storage again", async () => {
    const getRequired = vi
      .fn<(key: string) => Promise<ReturnType<typeof storedObject>>>()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockImplementation((key) => Promise.resolve(storedObject(key)));
    const source = new CachedStudioSceneAssetSource({ getRequired });

    await expect(source.load(KEYS)).rejects.toThrow("unavailable");
    await expect(source.load(KEYS)).resolves.toMatchObject({ floorKind: "TURNTABLE" });
  });
});
