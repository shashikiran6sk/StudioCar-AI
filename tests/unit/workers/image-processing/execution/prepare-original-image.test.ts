import sharp from "sharp";
import { describe, expect, it } from "vitest";

import type { ProcessingSettings } from "../../../../../packages/contracts/src/processing";
import { prepareOriginalImage } from "../../../../../workers/image-processing/src/execution/prepare-original-image";

const SETTINGS: ProcessingSettings = {
  crop: "MAINTAIN_COMPOSITION",
  enhancement: false,
  outputFormat: "JPEG",
  paddingPercent: 0,
  platePrivacy: false,
  quality: 90,
  shadow: "NONE",
};

async function photo(): Promise<Buffer> {
  return sharp({ create: { background: "#135579", channels: 3, height: 300, width: 400 } })
    .jpeg()
    .toBuffer();
}

describe("prepareOriginalImage", () => {
  it("keeps the photograph's own framing", async () => {
    const image = await prepareOriginalImage(await photo(), SETTINGS);

    expect(await image.png().toBuffer().then((bytes) => sharp(bytes).metadata())).toMatchObject({
      width: 400,
      height: 300,
    });
  });

  it("pads with white and squares when asked", async () => {
    const image = await prepareOriginalImage(await photo(), {
      ...SETTINGS,
      crop: "SQUARE",
      paddingPercent: 10,
    });
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    expect(info.width).toBe(info.height);
    expect([data[0], data[1], data[2]]).toEqual([255, 255, 255]);
  });
});
