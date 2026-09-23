import sharp, { type Color, type ResizeOptions, type Sharp } from "sharp";

import {
  FIT_OUTPUT_HEIGHT_PIXELS,
  FIT_OUTPUT_WIDTH_PIXELS,
} from "./image-execution.constants";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Trims the transparent surroundings and centres what is left on the fixed
 * fit-to-vehicle canvas, shrinking it to fit or enlarging it by at most
 * `maximumEnlargement`. At 1 nothing is enlarged and the image is not
 * materialised, which is exactly the behaviour before enlargement existed.
 */
export async function fitVehicle(
  image: Sharp,
  background: Color,
  maximumEnlargement: number,
): Promise<Sharp> {
  const canvas = {
    background,
    fit: "contain",
    height: FIT_OUTPUT_HEIGHT_PIXELS,
    width: FIT_OUTPUT_WIDTH_PIXELS,
    withoutEnlargement: true,
  } satisfies ResizeOptions;
  const trimmed = image.trim({ background: TRANSPARENT });
  if (maximumEnlargement <= 1) return trimmed.resize(canvas);

  const vehicle = await trimmed.png().toBuffer({ resolveWithObject: true });
  const scale = Math.min(
    FIT_OUTPUT_WIDTH_PIXELS / vehicle.info.width,
    FIT_OUTPUT_HEIGHT_PIXELS / vehicle.info.height,
    maximumEnlargement,
  );
  if (scale <= 1) return sharp(vehicle.data).resize(canvas);

  // sharp keeps only the last resize of a pipeline, so the enlargement is
  // materialised before the canvas is applied.
  const enlarged = await sharp(vehicle.data)
    .resize({
      fit: "fill",
      height: Math.round(vehicle.info.height * scale),
      width: Math.round(vehicle.info.width * scale),
    })
    .png()
    .toBuffer();
  return sharp(enlarged).resize(canvas);
}
