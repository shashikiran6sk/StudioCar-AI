import sharp, { type Sharp } from "sharp";

import { composeStudioScene } from "../studio-scene/compose-studio-scene";
import { prepareOriginalImage } from "./prepare-original-image";
import {
  PREVIEW_WEBP_QUALITY,
  STUDIO_SCENE_MISSING_MESSAGE,
} from "./image-execution.constants";
import type {
  RenderProcessedImageInput,
  RenderedProcessedImage,
} from "./image-execution.types";

const contentTypes = {
  JPEG: "image/jpeg",
  PNG: "image/png",
  WEBP: "image/webp",
} satisfies Record<
  RenderProcessedImageInput["options"]["outputFormat"],
  "image/jpeg" | "image/png" | "image/webp"
>;

async function prepareImage(
  input: RenderProcessedImageInput,
): Promise<Sharp> {
  if (input.options.backgroundId === "ORIGINAL") {
    return prepareOriginalImage(input.bytes, input.options);
  }
  if (!input.scene) throw new Error(STUDIO_SCENE_MISSING_MESSAGE);
  return sharp(
    await composeStudioScene({
      crop: input.options.crop,
      cutout: input.bytes,
      enhancement: input.options.enhancement,
      scene: input.scene,
      shadow: input.options.shadow,
    }),
  );
}

export async function renderProcessedImage(
  input: RenderProcessedImageInput,
): Promise<RenderedProcessedImage> {
  let image = await prepareImage(input);

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
