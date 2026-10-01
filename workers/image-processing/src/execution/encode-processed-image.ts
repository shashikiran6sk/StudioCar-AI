import sharp from "sharp";

import {
  OUTPUT_WEBP_EFFORT,
  PREVIEW_WEBP_QUALITY,
} from "./image-execution.constants";
import type { RenderedProcessedImage } from "./image-execution.types";
import type { RawImage } from "./vehicle-alpha.types";

/**
 * Encodes the final picture once as WebP, and its inventory preview straight
 * from the same pixels rather than by decoding the encoded output again.
 * Metadata is never written: outputs carry no EXIF, GPS or ICC data.
 */
export async function encodeProcessedImage(
  image: RawImage,
  quality: number,
  previewMaxWidth: number,
): Promise<RenderedProcessedImage> {
  const raw = {
    raw: { channels: image.channels, height: image.height, width: image.width },
  };
  const [bytes, previewBytes] = await Promise.all([
    sharp(image.data, raw)
      .webp({ effort: OUTPUT_WEBP_EFFORT, quality, smartSubsample: true })
      .toBuffer(),
    sharp(image.data, raw)
      .resize({ fit: "inside", width: previewMaxWidth, withoutEnlargement: true })
      .webp({ quality: PREVIEW_WEBP_QUALITY })
      .toBuffer(),
  ]);
  return {
    bytes,
    contentType: "image/webp",
    height: image.height,
    previewBytes,
    width: image.width,
  };
}
