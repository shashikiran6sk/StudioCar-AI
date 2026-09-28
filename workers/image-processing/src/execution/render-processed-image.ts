import sharp from "sharp";

import { createStudioSceneSvg } from "./create-studio-scene-svg";
import { fitVehicle } from "./fit-vehicle";
import { isStudioSceneBackground } from "./is-studio-scene-background";
import { measureSubjectBox } from "./measure-subject-box";
import {
  STUDIO_SCENE_PALETTES,
  STUDIO_SHADOW_OPACITY,
} from "./studio-scene.constants";
import {
  FIT_VEHICLE_MAXIMUM_ENLARGEMENT,
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
} satisfies Record<
  RenderProcessedImageInput["options"]["background"],
  { alpha: number; b: number; g: number; r: number }
>;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

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
  // A plain background is the studio's colour alone; only the standard floor
  // is drawn as a scene with a wall and a floor.
  const scene =
    isStudioSceneBackground(input.options.background) &&
    input.options.floor === "HORIZON"
      ? input.options.background
      : null;
  // A studio scene is drawn behind the vehicle afterwards, so everything
  // around it stays transparent until then.
  const fill = scene === null ? background : TRANSPARENT;
  let image = sharp(input.bytes, { failOn: "warning", pages: 1 });
  // Padding has always been measured on the source image, before any crop.
  const source = await image.clone().metadata();

  if (input.options.crop === "SQUARE") {
    image = image.resize({
      background: fill,
      fit: "contain",
      height: SQUARE_OUTPUT_EDGE_PIXELS,
      width: SQUARE_OUTPUT_EDGE_PIXELS,
      withoutEnlargement: true,
    });
  } else if (input.options.crop === "FIT_VEHICLE") {
    image = await fitVehicle(
      image,
      fill,
      isStudioSceneBackground(input.options.background)
        ? FIT_VEHICLE_MAXIMUM_ENLARGEMENT
        : 1,
    );
  }

  if (input.options.paddingPercent > 0) {
    const width = source.width;
    const height = source.height;
    const padding = Math.max(
      1,
      Math.round(
        Math.min(width, height) * (input.options.paddingPercent / 100),
      ),
    );
    image = image.extend({
      background: fill,
      bottom: padding,
      left: padding,
      right: padding,
      top: padding,
    });
  }

  if (scene !== null) {
    const layer = await image.ensureAlpha().png().toBuffer({
      resolveWithObject: true,
    });
    const subject = await measureSubjectBox(layer.data);
    if (subject === null) {
      image = sharp(layer.data).flatten({ background });
    } else {
      const backdrop = createStudioSceneSvg({
        canvasWidth: layer.info.width,
        canvasHeight: layer.info.height,
        palette: STUDIO_SCENE_PALETTES[scene],
        shadowOpacity: STUDIO_SHADOW_OPACITY[input.options.shadow],
        subject,
      });
      // Composited into a buffer first: sharp applies its operations before
      // overlays, so enhancing afterwards must see the finished picture.
      const composed = await sharp(Buffer.from(backdrop))
        .composite([{ input: layer.data, left: 0, top: 0 }])
        .png()
        .toBuffer();
      image = sharp(composed);
    }
  } else if (input.options.background !== "ORIGINAL") {
    image = image.flatten({ background });
  }
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
