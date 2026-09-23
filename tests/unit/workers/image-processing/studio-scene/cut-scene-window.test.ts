import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { cutSceneWindow } from "../../../../../workers/image-processing/src/studio-scene/cut-scene-window";

async function gradientLayer(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect y="50" width="200" height="50" fill="rgb(60,60,60)"/><rect y="40" width="200" height="10" fill="rgb(60,60,60)" fill-opacity="0.2"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

describe("cutSceneWindow", () => {
  it("cuts the requested frame at output size", async () => {
    const window = await cutSceneWindow(await gradientLayer(), {
      stage: { width: 200, height: 100 },
      window: { left: 50, top: 0, width: 100, height: 100 },
    });

    expect(await sharp(window).metadata()).toMatchObject({ width: 100, height: 100 });
  });

  it("continues the layer's edge where the frame reaches past the stage", async () => {
    const window = await cutSceneWindow(await gradientLayer(), {
      stage: { width: 200, height: 100 },
      window: { left: -20, top: -30, width: 240, height: 130 },
    });
    const { data, info } = await sharp(window).raw().toBuffer({ resolveWithObject: true });
    const bottomLeft = ((info.height - 1) * info.width) * info.channels;

    expect(info).toMatchObject({ width: 240, height: 130 });
    expect(data[bottomLeft + 3]).toBe(255);
    expect(data[3]).toBe(0);
  });

  // Regression: resized soft edges once came back brighter than either the
  // wall or the floor, drawing a bright line along the horizon.
  it("blends soft edges without drawing anything brighter than the layer", async () => {
    const window = await cutSceneWindow(await gradientLayer(), {
      stage: { width: 100, height: 50 },
      window: { left: 0, top: 0, width: 100, height: 50 },
    });
    const { data } = await sharp(window)
      .flatten({ background: { r: 60, g: 60, b: 60 } })
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(Math.max(...data)).toBeLessThanOrEqual(61);
  });
});
