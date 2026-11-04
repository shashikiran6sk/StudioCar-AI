import { describe, expect, it } from "vitest";

import { hasEligiblePlateShape } from "../../../../../workers/image-processing/src/plate-branding/has-eligible-plate-shape";
import { PHOTO_CORNERS } from "../test-support/create-plate-photo";
import { createTiltedPlatePhoto } from "../test-support/create-tilted-plate-photo";

describe("weak plate shape evidence", () => {
  const frame = { width: 500, height: 300 };
  const compact = { topLeft: { x: 20, y: 20 }, topRight: { x: 120, y: 20 },
    bottomRight: { x: 120, y: 90 }, bottomLeft: { x: 20, y: 90 } };

  it("rejects a weak compact label and a tiny distant face without changing stronger candidates", () => {
    expect(hasEligiblePlateShape(frame, compact, 0.084)).toBe(false);
    expect(hasEligiblePlateShape(frame, compact, 0.14)).toBe(true);
    expect(hasEligiblePlateShape({ width: 4000, height: 3000 }, PHOTO_CORNERS, 0.096)).toBe(false);
    expect(hasEligiblePlateShape({ width: 4000, height: 3000 }, PHOTO_CORNERS, 0.12)).toBe(true);
  });

  it("retains weak foreground plates and measures the physical face at steep angles", () => {
    expect(hasEligiblePlateShape(frame, PHOTO_CORNERS, 0.09)).toBe(true);
    expect(hasEligiblePlateShape(frame, createTiltedPlatePhoto("right", true, 50).corners, 0.09)).toBe(true);
  });
});
