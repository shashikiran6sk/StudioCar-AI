import sharp from "sharp";

import type { PlacedLayer } from "./placed-layer.types";
import type { RawImage } from "./vehicle-alpha.types";
import type { VehicleFraming } from "./vehicle-framing.types";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * The part of the cutout that lands on the canvas, scaled uniformly and
 * clipped to the canvas edges. Only that part is resampled, so an enlarged
 * vehicle does not pay for pixels that fall outside the frame.
 */
export async function placeCutoutLayer(
  cutout: RawImage,
  framing: VehicleFraming,
): Promise<PlacedLayer> {
  const { canvasHeight, canvasWidth, offsetX, offsetY, scale } = framing;
  const sourceLeft = clamp(Math.floor(-offsetX / scale), 0, cutout.width - 1);
  const sourceTop = clamp(Math.floor(-offsetY / scale), 0, cutout.height - 1);
  const sourceRight = clamp(
    Math.ceil((canvasWidth - offsetX) / scale),
    sourceLeft + 1,
    cutout.width,
  );
  const sourceBottom = clamp(
    Math.ceil((canvasHeight - offsetY) / scale),
    sourceTop + 1,
    cutout.height,
  );
  const sourceWidth = sourceRight - sourceLeft;
  const sourceHeight = sourceBottom - sourceTop;
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  const left = Math.round(offsetX + sourceLeft * scale);
  const top = Math.round(offsetY + sourceTop * scale);

  let pipeline = sharp(cutout.data, {
    raw: { channels: 4, height: cutout.height, width: cutout.width },
  }).extract({
    height: sourceHeight,
    left: sourceLeft,
    top: sourceTop,
    width: sourceWidth,
  });
  if (targetWidth !== sourceWidth || targetHeight !== sourceHeight) {
    // Both edges come from the same scale, so this is uniform to within a
    // rounding pixel: the vehicle keeps its proportions.
    pipeline = pipeline.resize({
      fit: "fill",
      height: targetHeight,
      width: targetWidth,
    });
  }
  const clipLeft = Math.max(0, -left);
  const clipTop = Math.max(0, -top);
  const visibleWidth = Math.min(targetWidth - clipLeft, canvasWidth - Math.max(0, left));
  const visibleHeight = Math.min(targetHeight - clipTop, canvasHeight - Math.max(0, top));
  const scaled = await pipeline.raw().toBuffer();
  const needsClip =
    clipLeft > 0 ||
    clipTop > 0 ||
    visibleWidth < targetWidth ||
    visibleHeight < targetHeight;
  const data = needsClip
    ? await sharp(scaled, {
        raw: { channels: 4, height: targetHeight, width: targetWidth },
      })
        .extract({
          height: visibleHeight,
          left: clipLeft,
          top: clipTop,
          width: visibleWidth,
        })
        .raw()
        .toBuffer()
    : scaled;
  return {
    image: {
      channels: 4,
      data,
      height: needsClip ? visibleHeight : targetHeight,
      width: needsClip ? visibleWidth : targetWidth,
    },
    left: Math.max(0, left),
    top: Math.max(0, top),
  };
}
