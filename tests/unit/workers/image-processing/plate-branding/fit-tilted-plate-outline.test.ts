import { describe, expect, it } from "vitest";

import { fitTiltedPlateOutline } from "../../../../../workers/image-processing/src/plate-branding/fit-tilted-plate-outline";
import { createTiltedPlatePhoto, TILTED_BOX_HEIGHT, TILTED_BOX_WIDTH } from "../test-support/create-tilted-plate-photo";

describe("supported tilted plate outlines", () => {
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
