import { describe, expect, it } from "vitest";

import type { PlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.types";
import { selectPlateSurfaceExpansion } from "../../../../../workers/image-processing/src/plate-branding/select-plate-surface-expansion";

const current: PlateQuadrilateral = { topLeft: { x: 10, y: 20 }, topRight: { x: 90, y: 20 }, bottomRight: { x: 90, y: 50 }, bottomLeft: { x: 10, y: 50 } };
const expanded: PlateQuadrilateral = { ...current, topLeft: { x: 10, y: 10 }, topRight: { x: 90, y: 10 } };

describe("observed plate surface expansion", () => {
  it("accepts the first fit and a bounded containing surface", () => {
    expect(selectPlateSurfaceExpansion(null, current, 5000)).toBe(current);
    expect(selectPlateSurfaceExpansion(current, expanded, 5000)).toBe(expanded);
  });
  it("retains the existing fit when a candidate exceeds the detector or grows too far", () => {
    expect(selectPlateSurfaceExpansion(current, expanded, 3000)).toBe(current);
    const oversized: PlateQuadrilateral = { ...expanded, topLeft: { x: 10, y: 0 }, topRight: { x: 90, y: 0 } };
    expect(selectPlateSurfaceExpansion(current, oversized, 5000)).toBe(current);
  });
  it("does not jump to a larger neighboring component or shrink a complete fit", () => {
    const neighbor: PlateQuadrilateral = { topLeft: { x: 0, y: 10 }, topRight: { x: 70, y: 10 }, bottomRight: { x: 70, y: 60 }, bottomLeft: { x: 0, y: 60 } };
    expect(selectPlateSurfaceExpansion(current, neighbor, 5000)).toBe(current);
    expect(selectPlateSurfaceExpansion(expanded, current, 5000)).toBe(expanded);
  });
});
