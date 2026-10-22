import { describe, expect, it } from "vitest";
import { applyPlateOverlay } from "../../../../../workers/image-processing/src/plate-branding/apply-plate-overlay";
import { createPlateProjection } from "../../../../../workers/image-processing/src/plate-branding/create-plate-projection";
import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";
import { createPlatePhoto, PHOTO_CORNERS } from "../test-support/create-plate-photo";

const ARTWORK: RawImage = { channels: 3, data: Buffer.alloc(12, 15), height: 2, width: 2 };
const FRAME = { canvasHeight: 300, canvasWidth: 500, offsetX: 0, offsetY: 0, scale: 1 };

describe("plate artwork rendering", () => {
  it("changes only polygon pixels, leaving source bytes and all other pixels exact", () => {
    const image = createPlatePhoto();
    const before = Buffer.from(image.data);
    const result = applyPlateOverlay(image, { artwork: ARTWORK, corners: PHOTO_CORNERS }, FRAME);
    const project = createPlateProjection(PHOTO_CORNERS);
    if (!project) throw new Error("Expected projection.");
    let changed = 0;
    let unexpectedInside = 0;
    let unexpectedOutside = 0;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const uv = project({ x: x + 0.5, y: y + 0.5 });
      const inside = uv && uv.x >= 0 && uv.x <= 1 && uv.y >= 0 && uv.y <= 1;
      const index = (y * image.width + x) * 3;
      for (let channel = 0; channel < 3; channel++) {
        const actual = result.data[index + channel];
        if (inside) {
          if (actual !== 0 && actual !== 15) unexpectedInside++;
        } else if (actual !== before[index + channel]) unexpectedOutside++;
      }
      if (inside) changed++;
    }
    expect(changed).toBeGreaterThan(5000);
    expect(unexpectedInside).toBe(0);
    expect(unexpectedOutside).toBe(0);
    expect(image.data.equals(before)).toBe(true);
  });
  it("follows crop scale and padding offsets and skips clipped plates", () => {
    const image = createPlatePhoto();
    const overlay = { artwork: ARTWORK, corners: PHOTO_CORNERS };
    const result = applyPlateOverlay(image, overlay, { ...FRAME, offsetX: 30, offsetY: 20, scale: 0.5 });
    expect(result.data[((120 * image.width) + 155) * 3]).toBe(15);
    expect(applyPlateOverlay(image, overlay, { ...FRAME, offsetX: 500 })).toBe(image);
    expect(applyPlateOverlay(image, null, FRAME)).toBe(image);
    expect(applyPlateOverlay(image, { ...overlay, artwork: { ...ARTWORK, width: 0, height: 0, data: Buffer.alloc(0) } }, FRAME)).toBe(image);
  });
});
