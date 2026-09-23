import type { ProcessingSettings } from "@studiocar/contracts";
import sharp, { type Sharp } from "sharp";

import {
  FIT_OUTPUT_HEIGHT_PIXELS,
  FIT_OUTPUT_WIDTH_PIXELS,
  ORIGINAL_FILL,
  SQUARE_OUTPUT_EDGE_PIXELS,
} from "./image-execution.constants";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * The photograph with its own background: cropped and padded as requested,
 * with any new space filled white.
 */
export async function prepareOriginalImage(
  bytes: Uint8Array,
  settings: ProcessingSettings,
): Promise<Sharp> {
  let image = sharp(bytes, { failOn: "warning", pages: 1 });

  if (settings.crop === "SQUARE") {
    image = image.resize({
      background: ORIGINAL_FILL,
      fit: "contain",
      height: SQUARE_OUTPUT_EDGE_PIXELS,
      width: SQUARE_OUTPUT_EDGE_PIXELS,
      withoutEnlargement: true,
    });
  } else if (settings.crop === "FIT_VEHICLE") {
    image = image.trim({ background: TRANSPARENT }).resize({
      background: ORIGINAL_FILL,
      fit: "contain",
      height: FIT_OUTPUT_HEIGHT_PIXELS,
      width: FIT_OUTPUT_WIDTH_PIXELS,
      withoutEnlargement: true,
    });
  }

  if (settings.paddingPercent > 0) {
    const metadata = await image.clone().metadata();
    const padding = Math.max(
      1,
      Math.round(
        Math.min(metadata.width, metadata.height) *
          (settings.paddingPercent / 100),
      ),
    );
    image = image.extend({
      background: ORIGINAL_FILL,
      bottom: padding,
      left: padding,
      right: padding,
      top: padding,
    });
  }

  return settings.enhancement ? image.normalise().sharpen() : image;
}
