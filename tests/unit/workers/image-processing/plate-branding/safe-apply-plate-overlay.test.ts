import { afterEach, describe, expect, it, vi } from "vitest";
import * as renderer from "../../../../../workers/image-processing/src/plate-branding/apply-plate-overlay";
import { safeApplyPlateOverlay } from "../../../../../workers/image-processing/src/plate-branding/safe-apply-plate-overlay";
import { createPlatePhoto, PHOTO_CORNERS } from "../test-support/create-plate-photo";

describe("safe plate renderer", () => {
  afterEach(() => vi.restoreAllMocks());
  it("preserves the completed studio pixels on a renderer exception", () => {
    const image = createPlatePhoto();
    vi.spyOn(renderer, "applyPlateOverlay").mockImplementation(() => { throw new Error("renderer"); });
    expect(safeApplyPlateOverlay(image, { artwork: image, corners: PHOTO_CORNERS }, {
      canvasHeight: image.height, canvasWidth: image.width, offsetX: 0, offsetY: 0, scale: 1,
    })).toBe(image);
  });
  it("is an exact no-op when there is no overlay", () => {
    const image = createPlatePhoto();
    expect(safeApplyPlateOverlay(image, null, { canvasHeight: image.height, canvasWidth: image.width, offsetX: 0, offsetY: 0, scale: 1 })).toBe(image);
  });
});
