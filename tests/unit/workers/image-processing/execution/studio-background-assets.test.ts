import { readdirSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { STUDIO_BACKGROUND_ASSETS } from "../../../../../workers/image-processing/src/execution/studio-background.constants";
import { STUDIO_BACKGROUND_DIRECTORY } from "../test-support/load-studio-background";
import { loadStudioBackground } from "../test-support/load-studio-background";

const CASES = (["PREMIUM_WHITE", "GREY_STUDIO", "DARK_STUDIO"] as const).flatMap((background) =>
  (["PLAIN", "HORIZON"] as const).map((floor) => [background, floor] as const),
);

describe("packaged studio backgrounds", () => {
  it("packages exactly the six backgrounds the table names", () => {
    const files = Object.values(STUDIO_BACKGROUND_ASSETS).flatMap((floors) =>
      Object.values(floors).map(({ file }) => file),
    );
    expect(readdirSync(STUDIO_BACKGROUND_DIRECTORY).sort()).toEqual([...files].sort());
  });

  it.each(CASES)("%s %s decodes completely at its declared size", async (background, floor) => {
    const asset = STUDIO_BACKGROUND_ASSETS[background][floor];
    const image = sharp(await loadStudioBackground(background, floor), { failOn: "warning" });
    expect(await image.metadata()).toMatchObject({
      format: "png",
      hasAlpha: false,
      height: asset.height,
      width: asset.width,
    });
    await image.stats();
  });

  it.each(CASES)("%s %s has its seam where the table says", async (background, floor) => {
    const asset = STUDIO_BACKGROUND_ASSETS[background][floor];
    const column = await sharp(await loadStudioBackground(background, floor))
      .removeAlpha()
      .resize({ fit: "fill", height: asset.height, width: 1 })
      .greyscale()
      .raw()
      .toBuffer();
    let seam: number | null = null;
    let jump = 0;
    for (let y = 1; y < column.length; y += 1) {
      const difference = Math.abs((column[y] ?? 0) - (column[y - 1] ?? 0));
      if (difference > jump) {
        jump = difference;
        seam = y;
      }
    }
    if (asset.seamY === null) {
      expect(jump).toBeLessThanOrEqual(1);
    } else {
      expect(jump).toBeGreaterThan(3);
      expect(Math.abs((seam ?? 0) - asset.seamY)).toBeLessThanOrEqual(1);
    }
  });
});
