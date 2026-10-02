import sharp from "sharp";

import type { BackgroundPlacement } from "./studio-background.types";

/**
 * Cuts the placed region out of a background asset and resamples it to the
 * canvas. The region already has the canvas's proportions, so resampling is
 * a uniform scale; whole-pixel rounding of the region is the only deviation.
 */
export async function renderStudioBackground(
  asset: Uint8Array,
  placement: BackgroundPlacement,
  canvasWidth: number,
  canvasHeight: number,
): Promise<Buffer> {
  const { height: assetHeight, width: assetWidth } =
    await sharp(asset).metadata();
  const left = Math.min(Math.floor(placement.left), assetWidth - 1);
  const top = Math.min(Math.floor(placement.top), assetHeight - 1);
  const width = Math.max(1, Math.min(assetWidth - left, Math.round(placement.width)));
  const height = Math.max(1, Math.min(assetHeight - top, Math.round(placement.height)));
  return sharp(asset)
    .extract({ height, left, top, width })
    .resize({ fit: "fill", height: canvasHeight, width: canvasWidth })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer();
}
