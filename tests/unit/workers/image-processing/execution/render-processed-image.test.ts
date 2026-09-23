import sharp from "sharp";
import { describe, expect, it } from "vitest";

import type { ProcessingSettings } from "../../../../../packages/contracts/src/processing";
import { renderProcessedImage } from "../../../../../workers/image-processing/src/execution/render-processed-image";
import { PROCESSING_STUDIO_ASSETS } from "../../../../../workers/image-processing/src/studio-scene/processing-studio-assets.constants";
import {
  countPixels,
  createStudioFixtures,
  createVehicleCutout,
  FIXTURE_COLOURS,
} from "../test-support/studio-fixtures";

const SETTINGS: ProcessingSettings = {
  crop: "FIT_VEHICLE",
  enhancement: false,
  outputFormat: "PNG",
  paddingPercent: 0,
  platePrivacy: false,
  quality: 90,
  shadow: "NONE",
};

async function scene(floorId: "GREY_STUDIO_FLOOR" | "GREY_TURNTABLE") {
  const fixtures = await createStudioFixtures();
  const floor = PROCESSING_STUDIO_ASSETS.floors[floorId];
  const background = fixtures.get(PROCESSING_STUDIO_ASSETS.backgrounds.GREY_STUDIO);
  const floorBytes = fixtures.get(floor.objectKey);
  if (!background || !floorBytes) throw new Error("Missing fixture.");
  return { background, floor: floorBytes, floorKind: floor.kind };
}

describe("renderProcessedImage", () => {
  it("renders a studio output and a bounded WebP preview", async () => {
    const result = await renderProcessedImage({
      bytes: await createVehicleCutout(),
      options: { ...SETTINGS, backgroundId: "GREY_STUDIO", floorId: "GREY_TURNTABLE" },
      previewMaxWidth: 320,
      scene: await scene("GREY_TURNTABLE"),
    });
    const preview = await sharp(result.previewBytes).metadata();

    expect(result.contentType).toBe("image/png");
    expect(result.width / result.height).toBeCloseTo(16 / 9, 1);
    expect(preview.format).toBe("webp");
    expect(preview.width).toBeLessThanOrEqual(320);
    expect(await countPixels(result.bytes, FIXTURE_COLOURS.turntable)).toBeGreaterThan(1_000);
  });

  it("refuses a studio background without its scene", async () => {
    await expect(
      renderProcessedImage({
        bytes: await createVehicleCutout(),
        options: { ...SETTINGS, backgroundId: "GREY_STUDIO", floorId: "GREY_STUDIO_FLOOR" },
        previewMaxWidth: 320,
        scene: null,
      }),
    ).rejects.toThrow();
  });

  it("keeps the original photograph for the original background", async () => {
    const photo = await sharp({
      create: { background: "#135579", channels: 3, height: 300, width: 400 },
    })
      .jpeg()
      .toBuffer();

    const result = await renderProcessedImage({
      bytes: photo,
      options: { ...SETTINGS, backgroundId: "ORIGINAL", crop: "MAINTAIN_COMPOSITION" },
      previewMaxWidth: 320,
      scene: null,
    });

    expect({ width: result.width, height: result.height }).toEqual({ width: 400, height: 300 });
  });
});
