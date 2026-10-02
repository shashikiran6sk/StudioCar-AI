import sharp from "sharp";

import type { RawImage } from "./vehicle-alpha.types";

/** Decodes a provider cutout once, to raw RGBA, for every later step. */
export async function decodeCutout(bytes: Uint8Array): Promise<RawImage> {
  const { data, info } = await sharp(bytes, { failOn: "warning", pages: 1 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { channels: 4, data, height: info.height, width: info.width };
}
