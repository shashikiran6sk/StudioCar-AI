import { describe, expect, it } from "vitest";

import { calculateEnhancementLevels } from "../../../../../workers/image-processing/src/execution/calculate-enhancement-levels";
import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";

/** A vehicle whose opaque pixels span `low`..`high` grey, beside a transparent white field. */
function vehicle(low: number, high: number, alpha = 255): RawImage {
  const width = 256;
  const height = 8;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const opaque = x < 128;
      const grey = opaque ? Math.round(low + ((high - low) * x) / 127) : 255;
      data.fill(grey, index, index + 3);
      data[index + 3] = opaque ? alpha : 0;
    }
  }
  return { channels: 4, data, height, width };
}

describe("calculateEnhancementLevels", () => {
  it("stretches the vehicle's own tonal range across the full range", () => {
    const levels = calculateEnhancementLevels(vehicle(40, 210));
    expect(levels).not.toBeNull();
    if (!levels) return;
    expect(levels.gain).toBeGreaterThan(1.4);
    expect(levels.gain).toBeLessThanOrEqual(1.5);
    expect(levels.offset).toBeLessThanOrEqual(0);
    // The darkest vehicle tones land at black.
    expect(Math.round(42 * levels.gain + levels.offset)).toBeLessThanOrEqual(5);
  });

  it("ignores transparent pixels, whatever colour they carry", () => {
    const whiteField = vehicle(40, 200);
    const blackField = vehicle(40, 200);
    for (let index = 0; index < blackField.data.length; index += 4) {
      if (blackField.data[index + 3] === 0) blackField.data.fill(0, index, index + 3);
    }
    expect(calculateEnhancementLevels(blackField)).toEqual(
      calculateEnhancementLevels(whiteField),
    );
  });

  it("ignores the shadow's partial alpha", () => {
    expect(calculateEnhancementLevels(vehicle(40, 200, 100))).toBeNull();
  });

  it("bounds the gain for a very flat vehicle", () => {
    expect(calculateEnhancementLevels(vehicle(100, 140))?.gain).toBe(1.5);
  });

  it("barely changes a vehicle that already spans the full range", () => {
    const levels = calculateEnhancementLevels(vehicle(0, 255));
    expect(levels?.gain ?? 1).toBeLessThan(1.03);
    expect(levels?.offset ?? 0).toBeGreaterThan(-4);
  });

  it("leaves an almost uniform vehicle alone rather than amplifying noise", () => {
    expect(calculateEnhancementLevels(vehicle(120, 130))).toBeNull();
  });

  it("needs an alpha channel", () => {
    expect(
      calculateEnhancementLevels({ channels: 3, data: Buffer.alloc(12), height: 2, width: 2 }),
    ).toBeNull();
  });
});
