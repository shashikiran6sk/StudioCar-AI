import { describe, expect, it } from "vitest";

import { placeStudioBackground } from "../../../../../workers/image-processing/src/execution/place-studio-background";

const FLOOR = { file: "floor.png", height: 2_160, seamY: 1_474, width: 3_840 };
const PLAIN = { ...FLOOR, file: "plain.png", seamY: null };

function scaleOf(placement: { width: number }, canvasWidth: number): number {
  return canvasWidth / placement.width;
}

describe("placeStudioBackground", () => {
  it("covers the canvas from the centre of a plain background without stretching it", () => {
    const placement = placeStudioBackground({
      asset: PLAIN,
      canvasHeight: 1_200,
      canvasWidth: 1_600,
      targetSeamY: 0,
    });
    expect(placement.width / placement.height).toBeCloseTo(1_600 / 1_200, 10);
    expect(placement.height).toBe(2_160);
    expect(placement.left).toBeCloseTo((3_840 - 2_880) / 2, 10);
    expect(placement.top).toBe(0);
  });

  it.each([
    [1_600, 1_200, 700],
    [1_600, 1_200, 1_100],
    [2_656, 1_856, 1_300],
    [4_516, 3_508, 2_200],
    [1_600, 1_600, 300],
  ])(
    "lands the floor seam on the target for a %i×%i canvas (target %i)",
    (canvasWidth, canvasHeight, targetSeamY) => {
      const placement = placeStudioBackground({
        asset: FLOOR,
        canvasHeight,
        canvasWidth,
        targetSeamY,
      });
      const scale = scaleOf(placement, canvasWidth);
      expect(canvasHeight / placement.height).toBeCloseTo(scale, 10);
      expect((FLOOR.seamY - placement.top) * scale).toBeCloseTo(targetSeamY, 6);
      expect(placement.left).toBeGreaterThanOrEqual(0);
      expect(placement.top).toBeGreaterThanOrEqual(0);
      expect(placement.left + placement.width).toBeLessThanOrEqual(FLOOR.width + 1e-9);
      expect(placement.top + placement.height).toBeLessThanOrEqual(FLOOR.height + 1e-9);
    },
  );

  it("keeps a seam target outside the canvas within it", () => {
    const above = placeStudioBackground({
      asset: FLOOR,
      canvasHeight: 1_200,
      canvasWidth: 1_600,
      targetSeamY: -50,
    });
    expect(above.top).toBeCloseTo(FLOOR.seamY, 6);
    const below = placeStudioBackground({
      asset: FLOOR,
      canvasHeight: 1_200,
      canvasWidth: 1_600,
      targetSeamY: 5_000,
    });
    expect(below.top + below.height).toBeCloseTo(FLOOR.seamY, 6);
  });
});
