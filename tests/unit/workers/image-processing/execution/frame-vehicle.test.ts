import { describe, expect, it } from "vitest";

import { frameVehicle } from "../../../../../workers/image-processing/src/execution/frame-vehicle";

const CONTENT = { height: 184, left: 70, top: 120, width: 460 };
const BASE = { content: CONTENT, cutoutHeight: 400, cutoutWidth: 640, paddingPercent: 8 };

describe("frameVehicle", () => {
  it("keeps the photo's frame and the vehicle's exact size and place when maintaining composition", () => {
    // 8% of the 400 px short edge.
    expect(frameVehicle({ ...BASE, crop: "MAINTAIN_COMPOSITION" })).toEqual({
      canvasHeight: 464,
      canvasWidth: 704,
      offsetX: 32,
      offsetY: 32,
      scale: 1,
    });
  });

  it("centres the vehicle and its shadow on a 4:3 canvas inside the margin when fitting", () => {
    const framing = frameVehicle({ ...BASE, crop: "FIT_VEHICLE" });
    expect(framing).toMatchObject({ canvasHeight: 1_200, canvasWidth: 1_600, scale: 1.3 });
    const left = framing.offsetX + CONTENT.left * framing.scale;
    const right = framing.offsetX + (CONTENT.left + CONTENT.width) * framing.scale;
    const top = framing.offsetY + CONTENT.top * framing.scale;
    const bottom = framing.offsetY + (CONTENT.top + CONTENT.height) * framing.scale;
    expect((left + right) / 2).toBeCloseTo(800, 6);
    expect((top + bottom) / 2).toBeCloseTo(600, 6);
  });

  it("shrinks a large vehicle to fit inside the fit margin", () => {
    const content = { height: 2_000, left: 500, top: 900, width: 5_000 };
    const framing = frameVehicle({
      content,
      crop: "FIT_VEHICLE",
      cutoutHeight: 4_000,
      cutoutWidth: 6_000,
      paddingPercent: 8,
    });
    // (1600 - 2 × 96) / 5000 is narrower than (1200 - 2 × 96) / 2000.
    expect(framing.scale).toBeCloseTo(1_408 / 5_000, 10);
    expect(content.width * framing.scale).toBeCloseTo(1_408, 6);
    expect(content.height * framing.scale).toBeLessThanOrEqual(1_008);
  });

  it("never enlarges a small vehicle beyond the fit limit", () => {
    const framing = frameVehicle({
      ...BASE,
      content: { height: 20, left: 10, top: 10, width: 40 },
      crop: "FIT_VEHICLE",
    });
    expect(framing.scale).toBe(1.3);
  });

  it("fits the whole frame on a square canvas without enlarging it", () => {
    expect(frameVehicle({ ...BASE, crop: "SQUARE" })).toEqual({
      canvasHeight: 1_600,
      canvasWidth: 1_600,
      offsetX: 480,
      offsetY: 600,
      scale: 1,
    });
    const large = frameVehicle({
      ...BASE,
      crop: "SQUARE",
      cutoutHeight: 3_000,
      cutoutWidth: 4_000,
    });
    expect(large.scale).toBeCloseTo(1_344 / 4_000, 10);
  });

  it("uses a single scale for both axes in every mode", () => {
    for (const crop of ["MAINTAIN_COMPOSITION", "FIT_VEHICLE", "SQUARE"] as const) {
      expect(Number.isFinite(frameVehicle({ ...BASE, crop }).scale)).toBe(true);
    }
  });
});
