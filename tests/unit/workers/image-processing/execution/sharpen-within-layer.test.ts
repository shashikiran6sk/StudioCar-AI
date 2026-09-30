import sharp from "sharp";
import { expect, it } from "vitest";

import { sharpenWithinLayer } from "../../../../../workers/image-processing/src/execution/sharpen-within-layer";

it("sharpens only where the layer has alpha inside the content box", async () => {
  const width = 60;
  const height = 40;
  const noise = await sharp({
    create: {
      background: { b: 0, g: 0, r: 0 },
      channels: 3,
      height,
      noise: { mean: 128, sigma: 40, type: "gaussian" },
      width,
    },
  })
    .raw()
    .toBuffer();
  const composed = { channels: 3 as const, data: noise, height, width };
  const layerData = Buffer.alloc(20 * 20 * 4);
  for (let index = 0; index < 20 * 20; index += 1) layerData[index * 4 + 3] = 255;
  const result = await sharpenWithinLayer(
    composed,
    { image: { channels: 4, data: layerData, height: 20, width: 20 }, left: 20, top: 10 },
    { height: 20, left: 20, top: 10, width: 20 },
  );
  let insideChanged = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      const inside = x >= 20 && x < 40 && y >= 10 && y < 30;
      const same =
        result.data[index] === noise[index] &&
        result.data[index + 1] === noise[index + 1] &&
        result.data[index + 2] === noise[index + 2];
      if (!inside) expect(same).toBe(true);
      else if (!same) insideChanged += 1;
    }
  }
  expect(insideChanged).toBeGreaterThan(200);
});

it("returns the image untouched when the layer and content do not meet", async () => {
  const composed = { channels: 3 as const, data: Buffer.alloc(30), height: 2, width: 5 };
  const result = await sharpenWithinLayer(
    composed,
    { image: { channels: 4, data: Buffer.alloc(4), height: 1, width: 1 }, left: 0, top: 0 },
    { height: 1, left: 4, top: 1, width: 1 },
  );
  expect(result).toBe(composed);
});
