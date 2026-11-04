import { describe, expect, it } from "vitest";

import { plateSurfaceAspect } from "../../../../../workers/image-processing/src/plate-branding/plate-surface-aspect";
import { PHOTO_CORNERS } from "../test-support/create-plate-photo";
import { createTiltedPlatePhoto } from "../test-support/create-tilted-plate-photo";

describe("physical plate aspect", () => {
  it("uses edge lengths rather than the axis-aligned rectangle of a steep plate", () => {
    for (const direction of ["left", "right"] satisfies readonly ("left" | "right")[]) {
      const { corners } = createTiltedPlatePhoto(direction, true, 50);
      expect(plateSurfaceAspect(corners)).toBeGreaterThan(3);
    }
  });

  it("is invariant under translation and uniform scaling", () => {
    const transform = (point: { x: number; y: number }) => ({ x: point.x * 3 + 20, y: point.y * 3 + 10 });
    const transformed = { topLeft: transform(PHOTO_CORNERS.topLeft), topRight: transform(PHOTO_CORNERS.topRight),
      bottomRight: transform(PHOTO_CORNERS.bottomRight), bottomLeft: transform(PHOTO_CORNERS.bottomLeft) };
    expect(plateSurfaceAspect(transformed)).toBeCloseTo(plateSurfaceAspect(PHOTO_CORNERS), 8);
  });
});
