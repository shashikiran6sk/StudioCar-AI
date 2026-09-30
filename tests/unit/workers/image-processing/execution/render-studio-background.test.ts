import sharp from "sharp";
import { expect, it } from "vitest";

import { renderStudioBackground } from "../../../../../workers/image-processing/src/execution/render-studio-background";

it("fills the canvas from the placed region with a uniform scale", async () => {
  // Wall rows 0–59 are white, floor rows 60–99 are black.
  const asset = await sharp({
    create: { background: { b: 255, g: 255, r: 255 }, channels: 3, height: 100, width: 200 },
  })
    .composite([
      {
        input: await sharp({
          create: { background: { b: 0, g: 0, r: 0 }, channels: 3, height: 40, width: 200 },
        })
          .png()
          .toBuffer(),
        left: 0,
        top: 60,
      },
    ])
    .png()
    .toBuffer();
  const output = await renderStudioBackground(asset, { height: 50, left: 50, top: 30, width: 100 }, 400, 200);
  expect(output.length).toBe(400 * 200 * 3);
  // The seam at asset row 60 is region row 30 → canvas row 120.
  expect(output[(100 * 400 + 200) * 3]).toBe(255);
  expect(output[(140 * 400 + 200) * 3]).toBe(0);
});
