import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { composeStudioScene } from "../../../../../workers/image-processing/src/studio-scene/compose-studio-scene";
import { PROCESSING_STUDIO_ASSETS } from "../../../../../workers/image-processing/src/studio-scene/processing-studio-assets.constants";
import {
  countPixels,
  createStudioFixtures,
  createVehicleCutout,
  FIXTURE_COLOURS,
} from "../test-support/studio-fixtures";

async function compose(floorId: "WHITE_STUDIO" | "WHITE_TURNTABLE", shadow: "NONE" | "STUDIO" = "NONE") {
  const fixtures = await createStudioFixtures();
  const floor = PROCESSING_STUDIO_ASSETS.floors[floorId];
  const background = fixtures.get(PROCESSING_STUDIO_ASSETS.backgrounds.PREMIUM_WHITE);
  const floorBytes = fixtures.get(floor.objectKey);
  if (!background || !floorBytes) throw new Error("Missing fixture.");
  return composeStudioScene({
    crop: "FIT_VEHICLE",
    cutout: await createVehicleCutout(),
    enhancement: false,
    scene: { background, floor: floorBytes, floorKind: floor.kind },
    shadow,
  });
}

describe("composeStudioScene", () => {
  it("draws the wall, the floor, and the vehicle in one opaque frame", async () => {
    const output = await compose("WHITE_STUDIO");
    const metadata = await sharp(output).metadata();

    expect(metadata.hasAlpha).toBe(false);
    expect(await countPixels(output, FIXTURE_COLOURS.wall)).toBeGreaterThan(1_000);
    expect(await countPixels(output, FIXTURE_COLOURS.floor)).toBeGreaterThan(1_000);
    expect(await countPixels(output, FIXTURE_COLOURS.vehicle)).toBeGreaterThan(1_000);
  });

  it("keeps the turntable's transparency, so it sits on the floor in front of the wall", async () => {
    const output = await compose("WHITE_TURNTABLE");

    // The transparent parts of the turntable layer show the wall and floor.
    expect(await countPixels(output, FIXTURE_COLOURS.wall)).toBeGreaterThan(1_000);
    expect(await countPixels(output, FIXTURE_COLOURS.turntable)).toBeGreaterThan(1_000);
    expect(await countPixels(output, FIXTURE_COLOURS.vehicle)).toBeGreaterThan(1_000);
  });

  it("draws the vehicle over the turntable, not behind it", async () => {
    const output = await compose("WHITE_TURNTABLE");
    const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
    // The tyre line stands on the platform: just above it is the vehicle.
    const x = Math.round(info.width / 2);
    const contactY = Math.round(info.height * (0.78 + 0.45 / 9));
    const index = ((contactY - 3) * info.width + x) * info.channels;

    expect(data[index]).toBeGreaterThan(150);
    expect(data[index + 1]).toBeLessThan(80);
  });

  it("darkens the floor under the tyres only when a shadow is wanted", async () => {
    const plain = await compose("WHITE_STUDIO", "NONE");
    const shaded = await compose("WHITE_STUDIO", "STUDIO");

    expect(await countPixels(shaded, FIXTURE_COLOURS.floor, 4)).toBeLessThan(
      await countPixels(plain, FIXTURE_COLOURS.floor, 4),
    );
  });
});
