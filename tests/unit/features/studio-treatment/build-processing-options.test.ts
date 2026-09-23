import { describe, expect, it } from "vitest";

import type { ProcessingSettings } from "../../../../packages/contracts/src/processing";
import { buildProcessingOptions } from "../../../../apps/web/src/features/studio-treatment/build-processing-options";

const SETTINGS: ProcessingSettings = {
  crop: "MAINTAIN_COMPOSITION",
  enhancement: true,
  outputFormat: "JPEG",
  paddingPercent: 8,
  platePrivacy: true,
  quality: 90,
  shadow: "NATURAL",
};

describe("buildProcessingOptions", () => {
  it("sends both semantic IDs for a studio", () => {
    expect(
      buildProcessingOptions({
        settings: SETTINGS,
        studio: { backgroundId: "GREY_STUDIO", floorId: "GREY_TURNTABLE" },
        studioBackgroundEnabled: true,
      }),
    ).toEqual({ ...SETTINGS, backgroundId: "GREY_STUDIO", floorId: "GREY_TURNTABLE" });
  });

  it("is not ready until a studio background is chosen", () => {
    expect(
      buildProcessingOptions({ settings: SETTINGS, studio: null, studioBackgroundEnabled: true }),
    ).toBeNull();
  });

  it("keeps the original background, without a floor, when the studio is off", () => {
    expect(
      buildProcessingOptions({
        settings: SETTINGS,
        studio: { backgroundId: "GREY_STUDIO", floorId: "GREY_TURNTABLE" },
        studioBackgroundEnabled: false,
      }),
    ).toEqual({ ...SETTINGS, backgroundId: "ORIGINAL" });
  });
});
