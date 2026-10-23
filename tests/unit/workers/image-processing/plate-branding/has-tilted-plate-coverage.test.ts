import { describe, expect, it } from "vitest";

import { hasTiltedPlateCoverage } from "../../../../../workers/image-processing/src/plate-branding/has-tilted-plate-coverage";
import { createTiltedPlatePhoto, TILTED_BOX_HEIGHT, TILTED_BOX_WIDTH } from "../test-support/create-tilted-plate-photo";

describe("complete tilted plate coverage", () => {
  it.each(["left", "right"] satisfies readonly ("left" | "right")[])("accepts a complete %s-facing outline", (direction) => {
    const { corners } = createTiltedPlatePhoto(direction);
    expect(hasTiltedPlateCoverage(corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(true);
  });

  it("rejects flat surfaces and narrow bright strips", () => {
    const flat = createTiltedPlatePhoto("right", false);
    expect(hasTiltedPlateCoverage(flat.corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
    const { corners } = createTiltedPlatePhoto("right");
    const strip = { ...corners, bottomLeft: { x: corners.topLeft.x, y: corners.topLeft.y + 15 },
      bottomRight: { x: corners.topRight.x, y: corners.topRight.y + 15 } };
    expect(hasTiltedPlateCoverage(strip, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
    const narrow = { ...corners, topRight: { ...corners.topRight, x: corners.topLeft.x + 100 } };
    expect(hasTiltedPlateCoverage(narrow, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
  });

  it("rejects inconsistent or opposing top and bottom slopes", () => {
    const { corners } = createTiltedPlatePhoto("right");
    const opposing = { ...corners, bottomRight: { ...corners.bottomRight, y: corners.bottomLeft.y + 30 } };
    expect(hasTiltedPlateCoverage(opposing, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
    const inconsistent = { ...corners, bottomRight: { ...corners.bottomRight, y: corners.bottomLeft.y - 16 } };
    expect(hasTiltedPlateCoverage(inconsistent, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
  });
});
