import { describe, expect, it } from "vitest";
import { projectContactMask } from "../../../../../workers/image-processing/src/execution/project-contact-mask";
import { findAlphaBounds } from "../../../../../workers/image-processing/src/execution/find-alpha-bounds";
import { VEHICLE_SHADOW_LAYERS } from "../../../../../workers/image-processing/src/execution/vehicle-shadow.constants";
import type { VehicleAlpha } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";

function vehicle(mirrored = false, shift = 0, scale = 1): VehicleAlpha {
  const width = 120 * scale;
  const height = 100 * scale;
  const pixels = new Uint8Array(width * height);
  for (let y = 20 * scale; y < 75 * scale; y += 1) {
    for (let x = 20 * scale; x < 84 * scale; x += 1) {
      // A three-quarter chassis with tyres at differing heights.
      const bottom = x < 40 * scale ? 74 * scale : 66 * scale;
      if (y > bottom) continue;
      const targetX = (mirrored ? width - 1 - x : x) + shift;
      if (targetX >= 0 && targetX < width) pixels[y * width + targetX] = 255;
    }
  }
  return {
    pixels,
    width,
    height,
    subject: findAlphaBounds(pixels, width, height),
  };
}

describe("projectContactMask", () => {
  it.each(VEHICLE_SHADOW_LAYERS.NATURAL)(
    "is mirror-invariant for opposite three-quarter angles",
    (layer) => {
      const original = projectContactMask(vehicle(), layer);
      const mirror = projectContactMask(vehicle(true), layer);
      for (let y = 0; y < 100; y += 1) {
        for (let x = 0; x < 120; x += 1)
          expect(mirror[y * 120 + x]).toBe(original[y * 120 + 119 - x]);
      }
    },
  );
  it("follows the vehicle instead of the canvas center", () => {
    const layer = VEHICLE_SHADOW_LAYERS.NATURAL[1];
    if (layer === undefined) throw new Error("Missing tuning layer");
    const original = projectContactMask(vehicle(), layer);
    const moved = projectContactMask(vehicle(false, 10), layer);
    for (let y = 0; y < 100; y += 1) {
      for (let x = 0; x < 110; x += 1)
        expect(moved[y * 120 + x + 10]).toBe(original[y * 120 + x]);
    }
  });
  it("does not project upper-body or window pixels", () => {
    const alpha = vehicle();
    const changed = { ...alpha, pixels: alpha.pixels.slice() };
    for (let y = 20; y < 50; y += 1)
      changed.pixels.fill(0, y * 120, (y + 1) * 120);
    const layer = VEHICLE_SHADOW_LAYERS.NATURAL[0];
    if (layer === undefined) throw new Error("Missing tuning layer");
    expect(projectContactMask(changed, layer)).toEqual(
      projectContactMask(alpha, layer),
    );
  });
  it.each([1, 2, 3])(
    "keeps shadows near the contact region at scale %s",
    (scale) => {
      const alpha = vehicle(false, 0, scale);
      const layer = VEHICLE_SHADOW_LAYERS.NATURAL[0];
      if (layer === undefined) throw new Error("Missing tuning layer");
      const mask = projectContactMask(alpha, layer);
      const bounds = findAlphaBounds(mask, alpha.width, alpha.height);
      expect(bounds?.top).toBeGreaterThanOrEqual(66 * scale);
      expect((bounds?.top ?? 0) + (bounds?.height ?? 0)).toBeLessThan(
        84 * scale,
      );
    },
  );
  it("keeps edge-positioned projections inside the output", () => {
    const alpha = vehicle(false, 35);
    const layer = VEHICLE_SHADOW_LAYERS.NATURAL[0];
    if (layer === undefined) throw new Error("Missing tuning layer");
    const mask = projectContactMask(alpha, layer);
    expect(mask.length).toBe(alpha.width * alpha.height);
    expect(mask.some((value) => value > 0)).toBe(true);
  });
});
