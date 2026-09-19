import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { inspectSourceImage } from "../../../../../workers/image-processing/src/execution/inspect-source-image";

describe("inspectSourceImage", () => {
  it("fully decodes a supported image and reports trusted dimensions", async () => {
    const bytes = await sharp({
      create: {
        background: "#ffffff",
        channels: 3,
        height: 3,
        width: 4,
      },
    })
      .jpeg()
      .toBuffer();

    await expect(inspectSourceImage(bytes, "image/jpeg", 100)).resolves.toEqual({
      ok: true,
      image: {
        bytes,
        contentType: "image/jpeg",
        height: 3,
        width: 4,
      },
    });
  });

  it("rejects malformed bytes and committed MIME mismatches", async () => {
    const bytes = new TextEncoder().encode("not-an-image");
    const malformed = await inspectSourceImage(bytes, "image/jpeg", 100);
    expect(malformed).toMatchObject({ ok: false, failureKind: "INVALID_IMAGE" });

    const png = await sharp({
      create: { background: "#ffffff", channels: 3, height: 2, width: 2 },
    })
      .png()
      .toBuffer();
    const mismatch = await inspectSourceImage(png, "image/jpeg", 100);
    expect(mismatch).toMatchObject({ ok: false, failureKind: "INVALID_IMAGE" });
  });
});
