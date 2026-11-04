import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { PLATE_SURFACE_FIT_PASSES } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.constants";
import { refineShadedPlate } from "../../../../../workers/image-processing/src/plate-branding/refine-shaded-plate";
import { createPlatePhoto, PHOTO_CORNERS, PHOTO_PLATE } from "../test-support/create-plate-photo";
import { createShadedPlatePhoto } from "../test-support/create-shaded-plate-photo";
import { createTiltedPlatePhoto } from "../test-support/create-tilted-plate-photo";

describe("bounded shaded plate refinement", () => {
  it.each([110, 125, 145])("recovers a dark registration surface at intensity %s without changing source pixels", (intensity) => {
    const image = createShadedPlatePhoto([intensity, intensity, intensity]);
    const before = Buffer.from(image.data);
    const corners = refineShadedPlate(image, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES);
    expect(corners).not.toBeNull();
    if (!corners) throw new Error("Expected shaded plate.");
    for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"] satisfies readonly (keyof typeof corners)[]) {
      expect(Math.abs(corners[name].x - PHOTO_CORNERS[name].x)).toBeLessThanOrEqual(3);
      expect(Math.abs(corners[name].y - PHOTO_CORNERS[name].y)).toBeLessThanOrEqual(3);
    }
    expect(image.data).toEqual(before);
  });

  it("handles cool casts and rejects an insufficient model ranking", () => {
    const image = createShadedPlatePhoto();
    expect(refineShadedPlate(image, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).not.toBeNull();
    expect(refineShadedPlate(image, { ...PHOTO_PLATE, score: 0.1 }, PLATE_SURFACE_FIT_PASSES)).toBeNull();
  });

  it("does not brighten a bright plate, a flat gray patch or a near-black surface", () => {
    const image = createPlatePhoto();
    expect(refineShadedPlate(image, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
    for (const value of [20, 120, 160]) {
      expect(refineShadedPlate({ ...image, data: Buffer.alloc(image.data.length, value) }, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
    }
    expect(refineShadedPlate(createShadedPlatePhoto([80, 80, 80]), PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
  });

  it("rejects low-contrast labels and saturated colored patches", () => {
    const image = createShadedPlatePhoto();
    for (let offset = 0; offset < image.data.length; offset += 3) {
      if (image.data[offset] === 20) image.data.fill(105, offset, offset + 3);
    }
    expect(refineShadedPlate(image, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
    expect(refineShadedPlate(createShadedPlatePhoto([30, 130, 220]), PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
  });

  it("does not grow a small highlight into a gray surface or brand a compact shaded label", () => {
    const image = createShadedPlatePhoto([120, 120, 120]);
    for (let y = 0; y < image.height; y++) for (let x = 180; x < 207; x++) {
      const offset = (y * image.width + x) * 3;
      if (image.data[offset] === 120) image.data.fill(240, offset, offset + 3);
    }
    expect(refineShadedPlate(image, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
    image.data.fill(70);
    for (let y = 160; y <= 230; y++) for (let x = 200; x <= 300; x++) {
      const offset = (y * image.width + x) * 3;
      image.data.fill(x % 10 < 3 && y > 175 && y < 215 ? 20 : 120, offset, offset + 3);
    }
    const compact = { left: 194 / image.width, top: 154 / image.height, width: 112 / image.width, height: 82 / image.height, score: 0.14 };
    expect(refineShadedPlate(image, compact, PLATE_SURFACE_FIT_PASSES)).toBeNull();
  });

  it("retains clipping, connected-body and transparency refusals", async () => {
    const image = createShadedPlatePhoto();
    const data = await sharp(image.data, { raw: { channels: 3, width: image.width, height: image.height } })
      .ensureAlpha(0).raw().toBuffer();
    expect(refineShadedPlate({ ...image, channels: 4, data }, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
    for (let offset = 0; offset < image.data.length; offset += 3) {
      if (image.data[offset] === 70) image.data.fill(120, offset, offset + 3);
    }
    expect(refineShadedPlate(image, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES)).toBeNull();
  });

  it("bounds sampling and restores full-resolution coordinates", async () => {
    const source = createShadedPlatePhoto();
    const { data, info } = await sharp(source.data, { raw: { channels: 3, width: source.width, height: source.height } })
      .resize(source.width * 4, source.height * 4, { kernel: "nearest" }).raw().toBuffer({ resolveWithObject: true });
    const corners = refineShadedPlate({ channels: 3, data, height: info.height, width: info.width }, PHOTO_PLATE, PLATE_SURFACE_FIT_PASSES);
    expect(corners).not.toBeNull();
    expect(corners?.topLeft.x).toBeCloseTo(PHOTO_CORNERS.topLeft.x * 4, -1);
    expect(corners?.bottomRight.y).toBeCloseTo(PHOTO_CORNERS.bottomRight.y * 4, -1);
  });

  it("retains the projected coverage checks on a steep shaded plate", () => {
    const { image, detection } = createTiltedPlatePhoto("right", true, 50);
    for (let offset = 0; offset < image.data.length; offset += 3) {
      if (image.data[offset] === 240) image.data.fill(120, offset, offset + 3);
    }
    expect(refineShadedPlate(image, detection, PLATE_SURFACE_FIT_PASSES)).not.toBeNull();
  });
});
