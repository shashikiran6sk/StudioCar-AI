import sharp from "sharp";

import { ENHANCEMENT_SHARPEN_SIGMA } from "./image-execution.constants";
import type { PlacedLayer } from "./placed-layer.types";
import type { RawImage, SubjectBox } from "./vehicle-alpha.types";

/** Pixels of context a Gaussian of this sigma reads beyond the region. */
const SHARPEN_CONTEXT_PIXELS = Math.ceil(ENHANCEMENT_SHARPEN_SIGMA * 3) + 1;

/**
 * Sharpens the composed image only where the cutout has coverage, weighted by
 * its alpha. Only `content` — the vehicle and its shadow on the canvas — plus
 * the filter's context is filtered, and every pixel outside it is returned
 * exactly as the background composed it, so enhancement never alters
 * StudioCar's backgrounds.
 */
export async function sharpenWithinLayer(
  composed: RawImage,
  layer: PlacedLayer,
  content: SubjectBox,
): Promise<RawImage> {
  const left = Math.max(layer.left, content.left);
  const top = Math.max(layer.top, content.top);
  const right = Math.min(
    layer.left + layer.image.width,
    content.left + content.width,
  );
  const bottom = Math.min(
    layer.top + layer.image.height,
    content.top + content.height,
  );
  if (right <= left || bottom <= top) return composed;
  const regionLeft = Math.max(0, left - SHARPEN_CONTEXT_PIXELS);
  const regionTop = Math.max(0, top - SHARPEN_CONTEXT_PIXELS);
  const regionRight = Math.min(composed.width, right + SHARPEN_CONTEXT_PIXELS);
  const regionBottom = Math.min(
    composed.height,
    bottom + SHARPEN_CONTEXT_PIXELS,
  );
  const regionWidth = regionRight - regionLeft;
  const sharpened = await sharp(composed.data, {
    raw: { channels: 3, height: composed.height, width: composed.width },
  })
    .extract({
      height: regionBottom - regionTop,
      left: regionLeft,
      top: regionTop,
      width: regionWidth,
    })
    .sharpen({ sigma: ENHANCEMENT_SHARPEN_SIGMA })
    .raw()
    .toBuffer();
  const data = Buffer.from(composed.data);
  for (let canvasY = top; canvasY < bottom; canvasY += 1) {
    const y = canvasY - layer.top;
    for (let canvasX = left; canvasX < right; canvasX += 1) {
      const x = canvasX - layer.left;
      const alpha = layer.image.data[(y * layer.image.width + x) * 4 + 3] ?? 0;
      if (alpha === 0) continue;
      const target = (canvasY * composed.width + canvasX) * 3;
      const source =
        ((canvasY - regionTop) * regionWidth + canvasX - regionLeft) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const base = composed.data[target + channel] ?? 0;
        const detail = sharpened[source + channel] ?? base;
        data[target + channel] = Math.round(
          base + ((detail - base) * alpha) / 255,
        );
      }
    }
  }
  return { ...composed, data };
}
