import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { renderProcessedImage } from "../../../../../workers/image-processing/src/execution/render-processed-image";

describe("renderProcessedImage", () => {
  it("renders the requested output and a bounded WebP preview", async () => {
    const bytes = await sharp({
      create: {
        background: { alpha: 0.6, b: 20, g: 30, r: 40 },
        channels: 4,
        height: 400,
        width: 800,
      },
    })
      .webp()
      .toBuffer();
    const result = await renderProcessedImage({
      bytes,
      options: {
        background: "DARK_STUDIO",
        crop: "SQUARE",
        enhancement: false,
        outputFormat: "PNG",
        paddingPercent: 0,
        platePrivacy: false,
        quality: 85,
        shadow: "NONE",
      },
      previewMaxWidth: 320,
    });
    const preview = await sharp(result.previewBytes).metadata();

    expect(result.contentType).toBe("image/png");
    expect(result.width).toBeLessThanOrEqual(1_600);
    expect(result.height).toBeLessThanOrEqual(1_600);
    expect(preview.format).toBe("webp");
    expect(preview.width).toBeLessThanOrEqual(320);
  });
});
