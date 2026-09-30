import sharp from "sharp";
import { expect, it } from "vitest";

import { encodeProcessedImage } from "../../../../../workers/image-processing/src/execution/encode-processed-image";

it("encodes WebP at the requested quality with a bounded WebP preview and no metadata", async () => {
  const { data, info } = await sharp({
    create: {
      background: { b: 0, g: 0, r: 0 },
      channels: 3,
      height: 900,
      noise: { mean: 120, sigma: 30, type: "gaussian" },
      width: 1_600,
    },
  })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rendered = await encodeProcessedImage(
    { channels: 3, data, height: info.height, width: info.width },
    90,
    720,
  );
  expect(rendered).toMatchObject({ contentType: "image/webp", height: 900, width: 1_600 });
  const output = await sharp(rendered.bytes).metadata();
  expect(output).toMatchObject({ format: "webp", hasAlpha: false, height: 900, width: 1_600 });
  expect(output.exif).toBeUndefined();
  expect(output.icc).toBeUndefined();
  const preview = await sharp(rendered.previewBytes).metadata();
  expect(preview).toMatchObject({ format: "webp", width: 720 });
  expect(preview.height).toBe(405);
});

it("never enlarges a small image for its preview", async () => {
  const rendered = await encodeProcessedImage(
    { channels: 3, data: Buffer.alloc(300 * 200 * 3, 128), height: 200, width: 300 },
    90,
    720,
  );
  expect((await sharp(rendered.previewBytes).metadata()).width).toBe(300);
});
