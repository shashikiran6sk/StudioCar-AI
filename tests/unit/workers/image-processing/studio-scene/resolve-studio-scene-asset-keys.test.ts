import { describe, expect, it } from "vitest";

import type { StudioTreatment } from "../../../../../packages/contracts/src/processing";
import { resolveStudioSceneAssetKeys } from "../../../../../workers/image-processing/src/studio-scene/resolve-studio-scene-asset-keys";

const EXPECTED: [StudioTreatment, string, string, "STUDIO_FLOOR" | "TURNTABLE"][] = [
  [{ backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" }, "bg-premium-white.webp", "floor-white-studio.png", "STUDIO_FLOOR"],
  [{ backgroundId: "PREMIUM_WHITE", floorId: "WHITE_TURNTABLE" }, "bg-premium-white.webp", "floor-white-turntable.png", "TURNTABLE"],
  [{ backgroundId: "DARK_STUDIO", floorId: "DARK_STUDIO_FLOOR" }, "bg-dark-studio.webp", "floor-dark-studio.png", "STUDIO_FLOOR"],
  [{ backgroundId: "DARK_STUDIO", floorId: "DARK_TURNTABLE" }, "bg-dark-studio.webp", "floor-dark-turntable.png", "TURNTABLE"],
  [{ backgroundId: "GREY_STUDIO", floorId: "GREY_STUDIO_FLOOR" }, "bg-grey-studio.webp", "floor-grey-studio.png", "STUDIO_FLOOR"],
  [{ backgroundId: "GREY_STUDIO", floorId: "GREY_TURNTABLE" }, "bg-grey-studio.webp", "floor-grey-turntable.png", "TURNTABLE"],
];

describe("resolveStudioSceneAssetKeys", () => {
  it.each(EXPECTED)("maps %o to deterministic keys", (treatment, background, floor, kind) => {
    expect(resolveStudioSceneAssetKeys(treatment)).toEqual({
      backgroundKey: `studio-assets/v1/backgrounds/${background}`,
      floorKey: `studio-assets/v1/floors/${floor}`,
      floorKind: kind,
    });
  });

  it("resolves a different floor for a turntable than for the standard floor", () => {
    const standard = resolveStudioSceneAssetKeys({ backgroundId: "DARK_STUDIO", floorId: "DARK_STUDIO_FLOOR" });
    const turntable = resolveStudioSceneAssetKeys({ backgroundId: "DARK_STUDIO", floorId: "DARK_TURNTABLE" });

    expect(turntable.backgroundKey).toBe(standard.backgroundKey);
    expect(turntable.floorKey).not.toBe(standard.floorKey);
  });
});
