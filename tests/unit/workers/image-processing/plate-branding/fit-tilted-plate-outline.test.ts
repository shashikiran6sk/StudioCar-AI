import { describe, expect, it } from "vitest";

import { fitTiltedPlateOutline } from "../../../../../workers/image-processing/src/plate-branding/fit-tilted-plate-outline";
import { createTiltedPlatePhoto, TILTED_BOX_HEIGHT, TILTED_BOX_WIDTH } from "../test-support/create-tilted-plate-photo";
import { PLATE_STANDARD_OUTLINE_LIMITS } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.constants";

describe("supported tilted plate outlines", () => {
  it("excludes a short rounded shoulder from a well-supported side line", () => {
    const hull = [{ x: 20, y: 30 }, { x: 140, y: 30 }, { x: 148, y: 32 },
      { x: 150, y: 36 }, { x: 150, y: 70 }, { x: 20, y: 70 }];
    const initial = { topLeft: { x: 20, y: 30 }, topRight: { x: 140, y: 30 },
      bottomRight: { x: 150, y: 70 }, bottomLeft: { x: 20, y: 70 } };
    const corners = fitTiltedPlateOutline(hull, initial, 140, 50, PLATE_STANDARD_OUTLINE_LIMITS);
    expect(corners?.topRight.x).toBeCloseTo(150, 8);
    expect(corners?.topRight.y).toBeCloseTo(30, 8);
    expect(fitTiltedPlateOutline(hull, initial, 140, 50, {
      ...PLATE_STANDARD_OUTLINE_LIMITS, minimumSideSegmentShare: 0.1,
    })).toBeNull();
  });
  it("recovers a simplified side corner without treating a rounded shoulder as its edge", () => {
    const hull = [{ x: 20, y: 41 }, { x: 21, y: 40 }, { x: 63, y: 40 }, { x: 213, y: 44 },
      { x: 229, y: 45 }, { x: 231, y: 46 }, { x: 232, y: 50 }, { x: 233, y: 61 },
      { x: 235, y: 85 }, { x: 235, y: 98 }, { x: 229, y: 98 }, { x: 185, y: 96 },
      { x: 64, y: 90 }, { x: 32, y: 88 }, { x: 25, y: 87 }, { x: 24, y: 86 },
      { x: 23, y: 78 }, { x: 22, y: 67 }, { x: 20, y: 42 }];
    const initial = { topLeft: { x: 21, y: 40 }, topRight: { x: 213, y: 44 },
      bottomRight: { x: 235, y: 98 }, bottomLeft: { x: 24, y: 86 } };
    const corners = fitTiltedPlateOutline(hull, initial, 223, 72, PLATE_STANDARD_OUTLINE_LIMITS);
    expect(corners?.topRight.x).toBeGreaterThan(230);
    expect(corners?.topRight.x).toBeLessThan(234);
    expect(corners?.bottomRight.x).toBeCloseTo(235, -1);
    expect(fitTiltedPlateOutline(hull, initial, 223, 72)).toBeNull();
  });
  it.each(["left", "right"] satisfies readonly ("left" | "right")[])("retains a complete %s-facing polygon", (direction) => {
    const { corners } = createTiltedPlatePhoto(direction);
    const hull = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];
    const fitted = fitTiltedPlateOutline(hull, corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT);
    expect(fitted).not.toBeNull();
    if (!fitted) throw new Error("Expected supported outline.");
    for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"] satisfies readonly (keyof typeof corners)[]) {
      expect(fitted[name].x).toBeCloseTo(corners[name].x, 8);
      expect(fitted[name].y).toBeCloseTo(corners[name].y, 8);
    }
  });

  it("recovers the complete edges when rounded corners shorten the initial polygon", () => {
    const hull = [{ x: 20, y: 55 }, { x: 25, y: 49 }, { x: 115, y: 31 }, { x: 120, y: 35 },
      { x: 120, y: 75 }, { x: 115, y: 81 }, { x: 25, y: 99 }, { x: 20, y: 95 }];
    const initial = { topLeft: { x: 25, y: 49 }, topRight: { x: 115, y: 31 },
      bottomRight: { x: 115, y: 81 }, bottomLeft: { x: 25, y: 99 } };
    const fitted = fitTiltedPlateOutline(hull, initial, 110, 80);
    expect(fitted?.topLeft.x).toBeCloseTo(20, 8);
    expect(fitted?.topLeft.y).toBeCloseTo(50, 8);
    expect(fitted?.topRight.x).toBeCloseTo(120, 8);
    expect(fitted?.topRight.y).toBeCloseTo(30, 8);
    expect(fitted?.bottomRight.x).toBeCloseTo(120, 8);
    expect(fitted?.bottomRight.y).toBeCloseTo(80, 8);
    expect(fitted?.bottomLeft.x).toBeCloseTo(20, 8);
    expect(fitted?.bottomLeft.y).toBeCloseTo(100, 8);
  });

  it("rejects missing edge evidence and excessive extrapolation", () => {
    const { corners } = createTiltedPlatePhoto("right");
    expect(fitTiltedPlateOutline([], corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBeNull();
    expect(fitTiltedPlateOutline([corners.topLeft, corners.topRight], corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBeNull();
    const shifted = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]
      .map((point) => ({ x: point.x + 100, y: point.y }));
    expect(fitTiltedPlateOutline(shifted, corners, TILTED_BOX_WIDTH, TILTED_BOX_HEIGHT)).toBeNull();
  });
});
