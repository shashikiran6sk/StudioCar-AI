import { describe, expect, it } from "vitest";

import { isPlateSurfaceOpaque } from "../../../../../workers/image-processing/src/plate-branding/is-plate-surface-opaque";
import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";
import type { PlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.types";

const corners: PlateQuadrilateral = { topLeft: { x: 10, y: 10 }, topRight: { x: 90, y: 10 }, bottomRight: { x: 90, y: 70 }, bottomLeft: { x: 10, y: 70 } };

describe("fitted plate opacity", () => {
  it("accepts RGB photos and opaque RGBA plate surfaces", () => {
    expect(isPlateSurfaceOpaque({ channels: 3, data: Buffer.alloc(100 * 80 * 3), width: 100, height: 80 }, corners)).toBe(true);
    expect(isPlateSurfaceOpaque({ channels: 4, data: Buffer.alloc(100 * 80 * 4, 255), width: 100, height: 80 }, corners)).toBe(true);
    const image: RawImage = { channels: 4, data: Buffer.alloc(100 * 80 * 4, 255), width: 100, height: 80 };
    image.data[(5 * image.width + 5) * 4 + 3] = 0;
    expect(isPlateSurfaceOpaque(image, corners)).toBe(true);
  });
  it.each([{ x: 10, y: 10 }, { x: 50, y: 40 }, { x: 90, y: 70 }])("rejects transparency at an actual plate corner or interior ($x, $y)", ({ x, y }) => {
    const image: RawImage = { channels: 4, data: Buffer.alloc(100 * 80 * 4, 255), width: 100, height: 80 };
    image.data[(y * image.width + x) * 4 + 3] = 80;
    expect(isPlateSurfaceOpaque(image, corners)).toBe(false);
  });
});
