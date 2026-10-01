import { describe, expect, it } from "vitest";

import { placeCutoutLayer } from "../../../../../workers/image-processing/src/execution/place-cutout-layer";
import { BODY_COLOUR, createCutout, DEFAULT_CUTOUT, pixel } from "../test-support/create-cutout";

describe("placeCutoutLayer", () => {
  it("places the whole frame unchanged at the padding offset", async () => {
    const cutout = createCutout();
    const layer = await placeCutoutLayer(cutout, {
      canvasHeight: 464,
      canvasWidth: 704,
      offsetX: 32,
      offsetY: 32,
      scale: 1,
    });
    expect(layer).toMatchObject({ left: 32, top: 32 });
    expect(layer.image.width).toBe(640);
    expect(layer.image.height).toBe(400);
    expect(layer.image.data.equals(cutout.data)).toBe(true);
  });

  it("scales uniformly and clips what falls outside the canvas", async () => {
    const layer = await placeCutoutLayer(createCutout(), {
      canvasHeight: 300,
      canvasWidth: 400,
      offsetX: -100,
      offsetY: -80,
      scale: 0.5,
    });
    expect(layer.left).toBe(0);
    expect(layer.top).toBe(0);
    expect(layer.image.width).toBeLessThanOrEqual(400);
    expect(layer.image.height).toBeLessThanOrEqual(300);
    // Body centre (300, 200) → (−100 + 150, −80 + 100) = (50, 20).
    expect(pixel(layer.image, 50, 20)).toEqual([BODY_COLOUR.r, BODY_COLOUR.g, BODY_COLOUR.b, 255]);
  });

  it("keeps the vehicle's proportions when enlarging", async () => {
    const layer = await placeCutoutLayer(createCutout(), {
      canvasHeight: 2_000,
      canvasWidth: 2_000,
      offsetX: 0,
      offsetY: 0,
      scale: 1.3,
    });
    expect(layer.image.width / layer.image.height).toBeCloseTo(
      DEFAULT_CUTOUT.width / DEFAULT_CUTOUT.height,
      2,
    );
  });
});
