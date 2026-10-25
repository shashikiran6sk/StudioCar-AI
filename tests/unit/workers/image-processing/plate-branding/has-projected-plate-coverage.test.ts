import { describe, expect, it } from "vitest";

import { hasProjectedPlateCoverage } from "../../../../../workers/image-processing/src/plate-branding/has-projected-plate-coverage";
import { polygonArea } from "../../../../../workers/image-processing/src/plate-branding/polygon-area";
import { createTiltedPlatePhoto } from "../test-support/create-tilted-plate-photo";

describe("projected plate coverage", () => {
  it.each(["left", "right"] satisfies readonly ("left" | "right")[])("accepts a complete steep %s-facing plate", (direction) => {
    const { corners, image, detection } = createTiltedPlatePhoto(direction, true, 50);
    const area = polygonArea([corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]);
    expect(hasProjectedPlateCoverage(corners, detection.width * image.width, detection.height * image.height, area)).toBe(true);
  });
  it("rejects a flat patch and a thin slanted strip", () => {
    const { corners, image, detection } = createTiltedPlatePhoto("right", true, 50);
    const flat = createTiltedPlatePhoto("right", false, 50).corners;
    expect(hasProjectedPlateCoverage(flat, detection.width * image.width, detection.height * image.height, 10000)).toBe(false);
    const strip = { ...corners, bottomLeft: { x: corners.topLeft.x, y: corners.topLeft.y + 15 },
      bottomRight: { x: corners.topRight.x, y: corners.topRight.y + 15 } };
    expect(hasProjectedPlateCoverage(strip, detection.width * image.width, detection.height * image.height, 10000)).toBe(false);
  });
  it("rejects an outline unsupported by its observed hull or with no remaining plate height", () => {
    const { corners, image, detection } = createTiltedPlatePhoto("right", true, 50);
    const area = polygonArea([corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]);
    expect(hasProjectedPlateCoverage(corners, detection.width * image.width, detection.height * image.height, area * 0.9)).toBe(false);
    expect(hasProjectedPlateCoverage(corners, detection.width * image.width, 40, area)).toBe(false);
  });
});
