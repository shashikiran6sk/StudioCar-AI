import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { measureVehicleFootprint } from "../../../../../workers/image-processing/src/studio-scene/measure-vehicle-footprint";
import { createVehicleCutout } from "../test-support/studio-fixtures";

describe("measureVehicleFootprint", () => {
  it("puts the tyre line at the solid body, not the provider's soft shadow", async () => {
    const footprint = await measureVehicleFootprint(await createVehicleCutout());

    expect(footprint?.body).toEqual({ left: 100, top: 100, width: 400, height: 200 });
    // The half-transparent shadow beneath the tyres is still drawn.
    expect(footprint?.extent).toEqual({ left: 100, top: 100, width: 400, height: 220 });
  });

  it("finds no vehicle in a fully transparent cutout", async () => {
    const empty = await sharp({
      create: { background: { r: 0, g: 0, b: 0, alpha: 0 }, channels: 4, height: 50, width: 80 },
    })
      .png()
      .toBuffer();

    await expect(measureVehicleFootprint(empty)).resolves.toBeNull();
  });

  it("ignores a stray solid speck when finding the tyre line", async () => {
    const speck = await sharp({
      create: { background: { r: 255, g: 255, b: 255, alpha: 1 }, channels: 4, height: 1, width: 1 },
    })
      .png()
      .toBuffer();
    const cutout = await sharp(await createVehicleCutout())
      .composite([{ input: speck, left: 300, top: 390 }])
      .png()
      .toBuffer();

    const footprint = await measureVehicleFootprint(cutout);

    expect((footprint?.body.top ?? 0) + (footprint?.body.height ?? 0)).toBe(300);
  });
});
