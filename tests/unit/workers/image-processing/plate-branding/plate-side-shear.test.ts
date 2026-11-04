import { describe, expect, it } from "vitest";

import { plateSideShear } from "../../../../../workers/image-processing/src/plate-branding/plate-side-shear";
import { PHOTO_CORNERS } from "../test-support/create-plate-photo";

describe("plate side shear", () => {
  it("allows ordinary perspective but identifies a diagonal shadow in place of one side", () => {
    expect(plateSideShear(PHOTO_CORNERS)).toBeLessThan(0.5);
    expect(plateSideShear({ ...PHOTO_CORNERS, topLeft: { x: 230, y: 180 } })).toBeGreaterThan(0.5);
    expect(plateSideShear({ ...PHOTO_CORNERS, bottomLeft: PHOTO_CORNERS.topLeft })).toBe(Infinity);
  });

  it("does not mistake camera rotation or scale for different side directions", () => {
    const rotate = (point: { x: number; y: number }) => ({ x: -point.y * 3 + 1000, y: point.x * 3 });
    expect(plateSideShear({ topLeft: rotate(PHOTO_CORNERS.topLeft), topRight: rotate(PHOTO_CORNERS.topRight),
      bottomRight: rotate(PHOTO_CORNERS.bottomRight), bottomLeft: rotate(PHOTO_CORNERS.bottomLeft) }))
      .toBeCloseTo(plateSideShear(PHOTO_CORNERS), 8);
  });
});
