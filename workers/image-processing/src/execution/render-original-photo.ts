import sharp from "sharp";

import type { RawImage } from "./vehicle-alpha.types";

const PHOTO_MATTE = { alpha: 1, b: 255, g: 255, r: 255 };

/**
 * The original photo in its own frame, as opaque RGB. Without a studio
 * background there is no cutout to re-frame, so nothing is padded, trimmed or
 * letterboxed; enhancement applies to the whole photograph.
 */
export async function renderOriginalPhoto(
  photo: Uint8Array,
  enhancement: boolean,
): Promise<RawImage> {
  let image = sharp(photo, { failOn: "warning", pages: 1 }).flatten({
    background: PHOTO_MATTE,
  });
  if (enhancement) image = image.normalise().sharpen();
  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { channels: 3, data, height: info.height, width: info.width };
}
