import sharp from "sharp";

import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";

export interface CutoutGeometry {
  /** Vehicle body rectangle, fully opaque. */
  body: { left: number; top: number; width: number; height: number };
  height: number;
  /** Soft black shadow band under the body, partially transparent. */
  shadow: { alpha: number; depth: number; overhang: number };
  width: number;
}

export const DEFAULT_CUTOUT: CutoutGeometry = {
  body: { left: 100, top: 120, width: 400, height: 160 },
  height: 400,
  shadow: { alpha: 90, depth: 24, overhang: 30 },
  width: 640,
};

export const BODY_COLOUR = { b: 200, g: 60, r: 40 };

/**
 * A provider-style cutout: an opaque vehicle body in the photo's frame and,
 * beneath it, a black shadow with partial alpha — the shape of the
 * transparent car plus car shadow Leonardo returns.
 */
export function createCutout(geometry: CutoutGeometry = DEFAULT_CUTOUT): RawImage {
  const { body, height, shadow, width } = geometry;
  const data = Buffer.alloc(width * height * 4);
  const shadowTop = body.top + body.height;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const inBody =
        x >= body.left &&
        x < body.left + body.width &&
        y >= body.top &&
        y < body.top + body.height;
      const inShadow =
        x >= body.left - shadow.overhang &&
        x < body.left + body.width + shadow.overhang &&
        y >= shadowTop &&
        y < shadowTop + shadow.depth;
      if (inBody) {
        data[index] = BODY_COLOUR.r;
        data[index + 1] = BODY_COLOUR.g;
        data[index + 2] = BODY_COLOUR.b;
        data[index + 3] = 255;
      } else if (inShadow) {
        data[index + 3] = shadow.alpha;
      }
    }
  }
  return { channels: 4, data, height, width };
}

export function encodeCutout(cutout: RawImage): Promise<Buffer> {
  return sharp(cutout.data, {
    raw: { channels: 4, height: cutout.height, width: cutout.width },
  })
    .webp({ lossless: true })
    .toBuffer();
}

export function pixel(image: RawImage, x: number, y: number): number[] {
  const index = (y * image.width + x) * image.channels;
  return Array.from(image.data.subarray(index, index + image.channels));
}
