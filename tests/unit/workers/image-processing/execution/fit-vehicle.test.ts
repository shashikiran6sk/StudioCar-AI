import sharp, { type Sharp } from "sharp";
import { describe, expect, it } from "vitest";

import { fitVehicle } from "../../../../../workers/image-processing/src/execution/fit-vehicle";

const WHITE = { alpha: 1, b: 255, g: 255, r: 255 };

/** A 200×100 opaque "vehicle" in a transparent 800×500 frame. */
async function cutout(vehicleWidth = 200, vehicleHeight = 100): Promise<Buffer> {
  const vehicle = await sharp({
    create: { background: { alpha: 1, b: 60, g: 60, r: 200 }, channels: 4, height: vehicleHeight, width: vehicleWidth },
  })
    .png()
    .toBuffer();
  return sharp({
    create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 500, width: 800 },
  })
    .composite([{ input: vehicle, left: 100, top: 300 }])
    .png()
    .toBuffer();
}

/** Width and height of the non-white area of a flattened result. */
async function vehicleBox(image: Sharp) {
  const { data, info } = await image
    .flatten({ background: WHITE })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if ((data[(y * info.width + x) * info.channels + 1] ?? 255) < 200) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  return { canvas: [info.width, info.height], height: maxY - minY + 1, width: maxX - minX + 1 };
}

describe("fitVehicle", () => {
  it("centres a small vehicle at its own size when enlargement is off", async () => {
    const box = await vehicleBox(await fitVehicle(sharp(await cutout()), WHITE, 1));

    expect(box).toEqual({ canvas: [1_600, 1_200], height: 100, width: 200 });
  });

  it("enlarges a small vehicle by at most the given factor", async () => {
    const box = await vehicleBox(await fitVehicle(sharp(await cutout()), WHITE, 1.3));

    expect(box).toEqual({ canvas: [1_600, 1_200], height: 130, width: 260 });
  });

  it("never enlarges beyond the canvas", async () => {
    const box = await vehicleBox(
      await fitVehicle(sharp(await cutout(700, 300)), WHITE, 3),
    );

    expect(box.canvas).toEqual([1_600, 1_200]);
    expect(box.width).toBe(1_600);
  });
});
