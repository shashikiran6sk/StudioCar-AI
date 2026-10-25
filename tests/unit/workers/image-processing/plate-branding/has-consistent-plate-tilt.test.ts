import { describe, expect, it } from "vitest";

import { hasConsistentPlateTilt } from "../../../../../workers/image-processing/src/plate-branding/has-consistent-plate-tilt";
import { createTiltedPlatePhoto, TILTED_BOX_HEIGHT, TILTED_BOX_WIDTH } from "../test-support/create-tilted-plate-photo";

describe("consistent plate tilt", () => {
  it.each(["left", "right"] satisfies readonly ("left" | "right")[])("accepts broad consistent %s-facing edges", (direction) => {
    expect(hasConsistentPlateTilt(createTiltedPlatePhoto(direction).corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(true);
  });
  it("rejects a flat surface and opposing slopes", () => {
    expect(hasConsistentPlateTilt(createTiltedPlatePhoto("right", false).corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
    const { corners } = createTiltedPlatePhoto("right");
    const opposing = { ...corners, bottomRight: { ...corners.bottomRight, y: corners.bottomLeft.y + 30 } };
    expect(hasConsistentPlateTilt(opposing, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBe(false);
  });
});
