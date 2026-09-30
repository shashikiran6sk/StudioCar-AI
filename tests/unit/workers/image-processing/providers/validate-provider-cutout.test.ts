import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { validateProviderCutout } from "../../../../../workers/image-processing/src/providers/validate-provider-cutout";

function image(width: number, height: number, channels: 3 | 4) {
  return sharp({
    create: {
      background: channels === 4 ? { alpha: 0.4, b: 0, g: 0, r: 0 } : { b: 0, g: 0, r: 0 },
      channels,
      height,
      width,
    },
  });
}

const EXPECTED = { height: null, maximumPixels: 10_000, width: null };

describe("validateProviderCutout", () => {
  it("accepts a transparent WebP and reports its size", async () => {
    await expect(
      validateProviderCutout(await image(40, 30, 4).webp().toBuffer(), {
        ...EXPECTED,
        height: 30,
        width: 40,
      }),
    ).resolves.toEqual({ height: 30, width: 40 });
  });

  it.each([
    ["a PNG", async () => image(40, 30, 4).png().toBuffer(), EXPECTED],
    ["an opaque WebP", async () => image(40, 30, 3).webp().toBuffer(), EXPECTED],
    ["garbage", async () => Buffer.from("not an image"), EXPECTED],
    ["too many pixels", async () => image(200, 200, 4).webp().toBuffer(), EXPECTED],
    [
      "another width than declared",
      async () => image(40, 30, 4).webp().toBuffer(),
      { ...EXPECTED, width: 41 },
    ],
    [
      "another height than declared",
      async () => image(40, 30, 4).webp().toBuffer(),
      { ...EXPECTED, height: 29 },
    ],
  ])("refuses %s", async (_case, bytes, expected) => {
    await expect(validateProviderCutout(await bytes(), expected)).resolves.toBeNull();
  });
});
