import { expect, it } from "vitest";
import { convexHull } from "../../../../../workers/image-processing/src/plate-branding/convex-hull";

it("removes inner and collinear points while preserving the clockwise surface boundary", () => {
  expect(convexHull([{ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 0 }])).toEqual([
    { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 },
  ]);
});
