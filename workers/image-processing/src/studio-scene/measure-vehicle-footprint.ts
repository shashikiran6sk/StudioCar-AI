import sharp from "sharp";

import {
  SOLID_ALPHA,
  SOLID_LINE_MINIMUM_PIXELS,
  SOLID_LINE_MINIMUM_RATIO,
} from "./studio-compositing.constants";
import type { PixelBox, VehicleFootprint } from "./studio-scene.types";

const RGBA_CHANNELS = 4;
const ALPHA_OFFSET = 3;

function solidLineMinimum(length: number): number {
  return Math.max(
    SOLID_LINE_MINIMUM_PIXELS,
    Math.round(length * SOLID_LINE_MINIMUM_RATIO),
  );
}

function span(counts: Uint32Array, minimum: number): [number, number] | null {
  const first = counts.findIndex((count) => count >= minimum);
  if (first < 0) return null;
  let last = counts.length - 1;
  while (last > first && (counts[last] ?? 0) < minimum) last -= 1;
  return [first, last];
}

function box(columns: [number, number], rows: [number, number]): PixelBox {
  return {
    left: columns[0],
    top: rows[0],
    width: columns[1] - columns[0] + 1,
    height: rows[1] - rows[0] + 1,
  };
}

/**
 * Finds the vehicle in a transparent cutout.
 *
 * The tyre line is the lowest row of solid pixels. Background-removal
 * providers can draw a soft shadow beneath the car; it is never solid, so it
 * does not push the tyre line down and leave the car floating above the floor.
 * Returns `null` when the cutout contains no vehicle.
 */
export async function measureVehicleFootprint(
  cutout: Uint8Array,
): Promise<VehicleFootprint | null> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const solidRows = new Uint32Array(height);
  const solidColumns = new Uint32Array(width);
  const visibleRows = new Uint32Array(height);
  const visibleColumns = new Uint32Array(width);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * RGBA_CHANNELS + ALPHA_OFFSET] ?? 0;
      if (alpha === 0) continue;
      visibleRows[y] = (visibleRows[y] ?? 0) + 1;
      visibleColumns[x] = (visibleColumns[x] ?? 0) + 1;
      if (alpha >= SOLID_ALPHA) {
        solidRows[y] = (solidRows[y] ?? 0) + 1;
        solidColumns[x] = (solidColumns[x] ?? 0) + 1;
      }
    }
  }

  const bodyRows = span(solidRows, solidLineMinimum(width));
  const bodyColumns = span(solidColumns, solidLineMinimum(height));
  const extentRows = span(visibleRows, 1);
  const extentColumns = span(visibleColumns, 1);
  if (!bodyRows || !bodyColumns || !extentRows || !extentColumns) return null;

  return {
    body: box(bodyColumns, bodyRows),
    extent: box(extentColumns, extentRows),
  };
}
