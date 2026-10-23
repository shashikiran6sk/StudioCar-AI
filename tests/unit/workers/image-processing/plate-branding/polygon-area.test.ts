import { expect, it } from "vitest";

import { polygonArea } from "../../../../../workers/image-processing/src/plate-branding/polygon-area";

it("measures a translated polygon in either winding and rejects degenerate area", () => {
  const points = [{ x: 10, y: 20 }, { x: 90, y: 20 }, { x: 90, y: 50 }, { x: 10, y: 50 }];
  expect(polygonArea(points)).toBe(2400);
  expect(polygonArea([...points].reverse())).toBe(2400);
  expect(polygonArea([])).toBe(0);
  expect(polygonArea(points.slice(0, 2))).toBe(0);
});
