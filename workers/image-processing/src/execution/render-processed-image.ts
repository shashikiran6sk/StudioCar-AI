import sharp from "sharp";

import {
  FIT_OUTPUT_HEIGHT_PIXELS,
  FIT_OUTPUT_WIDTH_PIXELS,
  PREVIEW_WEBP_QUALITY,
  SQUARE_OUTPUT_EDGE_PIXELS,
} from "./image-execution.constants";
import type {
  RenderProcessedImageInput,
  RenderedProcessedImage,
} from "./image-execution.types";

const backgrounds = {
  ORIGINAL: { r: 255, g: 255, b: 255, alpha: 1 },
  PREMIUM_WHITE: { r: 250, g: 250, b: 248, alpha: 1 },
  DARK_STUDIO: { r: 27, g: 31, b: 36, alpha: 1 },
  GREY_STUDIO: { r: 218, g: 220, b: 222, alpha: 1 },
  DEALERSHIP: { r: 232, g: 238, b: 241, alpha: 1 },
  CUSTOM: { r: 255, g: 255, b: 255, alpha: 1 },
} satisfies Record<
  RenderProcessedImageInput["options"]["background"],
  { alpha: number; b: number; g: number; r: number }
>;

const contentTypes = {
  JPEG: "image/jpeg",
  PNG: "image/png",
  WEBP: "image/webp",
} satisfies Record<
  RenderProcessedImageInput["options"]["outputFormat"],
  "image/jpeg" | "image/png" | "image/webp"
>;

export async function renderProcessedImage(
  input: RenderProcessedImageInput,
): Promise<RenderedProcessedImage> {
  const background = backgrounds[input.options.background];
  let image = sharp(input.bytes, { failOn: "warning", pages: 1 });

  if (input.options.crop === "SQUARE") {
    image = image.resize({
      background,
      fit: "contain",
      height: SQUARE_OUTPUT_EDGE_PIXELS,
      width: SQUARE_OUTPUT_EDGE_PIXELS,
      withoutEnlargement: true,
    });
  } else if (input.options.crop === "FIT_VEHICLE") {
    image = image.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).resize({
      background,
      fit: "contain",
      height: FIT_OUTPUT_HEIGHT_PIXELS,
      width: FIT_OUTPUT_WIDTH_PIXELS,
      withoutEnlargement: true,
    });
  }

  if (input.options.paddingPercent > 0) {
    const metadata = await image.clone().metadata();
    const width = metadata.width;
    const height = metadata.height;
    const padding = Math.max(
      1,
      Math.round(
        Math.min(width, height) * (input.options.paddingPercent / 100),
      ),
    );
    image = image.extend({
      background,
      bottom: padding,
      left: padding,
      right: padding,
      top: padding,
    });
  }

  if (input.options.background !== "ORIGINAL") image = image.flatten({ background });
  if (input.options.enhancement) image = image.normalise().sharpen();

  if (input.options.outputFormat === "JPEG") {
    image = image.jpeg({ quality: input.options.quality, mozjpeg: true });
  } else if (input.options.outputFormat === "PNG") {
    image = image.png({ compressionLevel: 9 });
  } else {
    image = image.webp({ quality: input.options.quality, smartSubsample: true });
  }

  const rendered = await image.toBuffer({ resolveWithObject: true });
  const previewBytes = await sharp(rendered.data)
    .resize({
      fit: "inside",
      width: input.previewMaxWidth,
      withoutEnlargement: true,
    })
    .webp({ quality: PREVIEW_WEBP_QUALITY })
    .toBuffer();

  return {
    bytes: rendered.data,
    contentType: contentTypes[input.options.outputFormat],
    height: rendered.info.height,
    previewBytes,
    width: rendered.info.width,
  };
}
