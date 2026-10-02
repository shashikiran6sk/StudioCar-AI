import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { renderOriginalPhoto } from "../../../../../workers/image-processing/src/execution/render-original-photo";

async function flatPhoto(): Promise<Buffer> {
  // A dull, low-contrast photograph: grey 100–150.
  const width = 120;
  const height = 80;
  const data = Buffer.alloc(width * height * 3);
  for (let index = 0; index < width * height; index += 1) {
    data.fill(100 + (index % 50), index * 3, index * 3 + 3);
  }
  return sharp(data, { raw: { channels: 3, height, width } }).jpeg({ quality: 95 }).toBuffer();
}

describe("renderOriginalPhoto", () => {
  it("keeps the photo in its own frame: no border, no letterbox", async () => {
    const image = await renderOriginalPhoto(await flatPhoto(), false);
    expect(image).toMatchObject({ channels: 3, height: 80, width: 120 });
    expect(image.data[0]).toBeLessThan(160);
  });

  it("enhances the whole photograph when asked", async () => {
    const photo = await flatPhoto();
    const plain = await renderOriginalPhoto(photo, false);
    const enhanced = await renderOriginalPhoto(photo, true);
    expect(enhanced.data.equals(plain.data)).toBe(false);
    expect(Math.max(...enhanced.data)).toBeGreaterThan(Math.max(...plain.data));
  });

  it("puts a transparent photo on white", async () => {
    const png = await sharp({
      create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 2, width: 2 },
    })
      .png()
      .toBuffer();
    expect(Array.from((await renderOriginalPhoto(png, false)).data.subarray(0, 3))).toEqual([255, 255, 255]);
  });
});
