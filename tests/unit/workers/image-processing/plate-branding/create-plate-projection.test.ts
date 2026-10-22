import { describe, expect, it } from "vitest";
import { createPlateProjection } from "../../../../../workers/image-processing/src/plate-branding/create-plate-projection";
import { PHOTO_CORNERS } from "../test-support/create-plate-photo";

describe("perspective projection", () => {
  it("maps an angled quadrilateral to the four artwork corners", () => {
    const project = createPlateProjection(PHOTO_CORNERS);
    if (!project) throw new Error("Expected projection.");
    for (const { point, x, y } of [
      { point: PHOTO_CORNERS.topLeft, x: 0, y: 0 }, { point: PHOTO_CORNERS.topRight, x: 1, y: 0 },
      { point: PHOTO_CORNERS.bottomRight, x: 1, y: 1 }, { point: PHOTO_CORNERS.bottomLeft, x: 0, y: 1 },
    ]) {
      expect(project(point)?.x).toBeCloseTo(x); expect(project(point)?.y).toBeCloseTo(y);
    }
  });
  it("rejects singular geometry", () => {
    const point = { x: 0, y: 0 };
    expect(createPlateProjection({ topLeft: point, topRight: point, bottomRight: point, bottomLeft: point })).toBeNull();
  });
});
