import sharp from "sharp";
import { expect, it } from "vitest";

import { decodeCutout } from "../../../../../workers/image-processing/src/execution/decode-cutout";
import { createCutout, encodeCutout } from "../test-support/create-cutout";

it("decodes a WebP cutout to raw RGBA once", async () => {
  const cutout = createCutout();
  const decoded = await decodeCutout(await encodeCutout(cutout));
  expect(decoded).toMatchObject({ channels: 4, height: cutout.height, width: cutout.width });
  expect(decoded.data.equals(cutout.data)).toBe(true);
});

it("adds an opaque alpha to an image without one", async () => {
  const bytes = await sharp({
    create: { background: { b: 3, g: 2, r: 1 }, channels: 3, height: 2, width: 2 },
  })
    .png()
    .toBuffer();
  expect(Array.from((await decodeCutout(bytes)).data.subarray(0, 4))).toEqual([1, 2, 3, 255]);
});

it("rejects bytes that are not an image", async () => {
  await expect(decodeCutout(Buffer.from("not an image"))).rejects.toThrow();
});
