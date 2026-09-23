import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { measureSubjectBox } from "../../../../../workers/image-processing/src/execution/measure-subject-box";

function frame(withBlock: boolean): Promise<Buffer> {
  const canvas = sharp({
    create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 300, width: 500 },
  });
  if (!withBlock) return canvas.png().toBuffer();
  return sharp({
    create: { background: { alpha: 1, b: 0, g: 0, r: 255 }, channels: 4, height: 80, width: 120 },
  })
    .png()
    .toBuffer()
    .then((block) => canvas.composite([{ input: block, left: 50, top: 150 }]).png().toBuffer());
}

describe("measureSubjectBox", () => {
  it("finds where the vehicle sits in a transparent frame", async () => {
    await expect(measureSubjectBox(await frame(true))).resolves.toEqual({
      left: 50,
      top: 150,
      width: 120,
      height: 80,
    });
  });

  it("reports nothing for a frame with nothing in it", async () => {
    await expect(measureSubjectBox(await frame(false))).resolves.toBeNull();
  });
});
