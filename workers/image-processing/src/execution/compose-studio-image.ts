import sharp from "sharp";
import type { FloorStyle, ProcessingOptions } from "@studiocar/contracts";

import { applyEnhancementLevels } from "./apply-enhancement-levels";
import { calculateEnhancementLevels } from "./calculate-enhancement-levels";
import { frameVehicle } from "./frame-vehicle";
import { measureCutout } from "./measure-cutout";
import { NoVehicleDetectedError } from "./no-vehicle-detected-error";
import { placeCutoutLayer } from "./place-cutout-layer";
import { placeStudioBackground } from "./place-studio-background";
import { renderStudioBackground } from "./render-studio-background";
import { sharpenWithinLayer } from "./sharpen-within-layer";
import {
  HORIZON_ABOVE_CONTACT_RATIO,
  STUDIO_BACKGROUND_ASSETS,
} from "./studio-background.constants";
import type { StudioBackground } from "./studio-background.types";
import type { RawImage } from "./vehicle-alpha.types";

export interface ComposeStudioImageInput {
  background: StudioBackground;
  /** The packaged artwork for `background` and `floor`. */
  backgroundBytes: Uint8Array;
  /** The provider's transparent vehicle and its shadow, decoded to RGBA. */
  cutout: RawImage;
  floor: FloorStyle;
  options: Pick<ProcessingOptions, "crop" | "enhancement" | "paddingPercent">;
}

/**
 * Places the provider's vehicle and shadow on a StudioCar background.
 *
 * Order: measure the cutout from alpha → frame it for the composition mode →
 * place the background so its floor meets the wall above the tyre line →
 * draw the vehicle (with the provider's shadow, and no other) → optionally
 * enhance the vehicle alone. The result is opaque RGB at canvas size.
 */
export async function composeStudioImage(
  input: ComposeStudioImageInput,
): Promise<RawImage> {
  const measurement = measureCutout(input.cutout);
  if (measurement === null) throw new NoVehicleDetectedError();

  const framing = frameVehicle({
    content: measurement.content,
    crop: input.options.crop,
    cutoutHeight: input.cutout.height,
    cutoutWidth: input.cutout.width,
    paddingPercent: input.options.paddingPercent,
  });
  const layer = await placeCutoutLayer(input.cutout, framing);
  const levels = input.options.enhancement
    ? calculateEnhancementLevels(input.cutout)
    : null;
  const vehicleLayer =
    levels === null
      ? layer
      : { ...layer, image: await applyEnhancementLevels(layer.image, levels) };

  const vehicleHeight = measurement.vehicle.height * framing.scale;
  const tyreLine =
    framing.offsetY +
    (measurement.vehicle.top + measurement.vehicle.height) * framing.scale;
  const placement = placeStudioBackground({
    asset: STUDIO_BACKGROUND_ASSETS[input.background][input.floor],
    canvasHeight: framing.canvasHeight,
    canvasWidth: framing.canvasWidth,
    targetSeamY: tyreLine - vehicleHeight * HORIZON_ABOVE_CONTACT_RATIO,
  });
  const background = await renderStudioBackground(
    input.backgroundBytes,
    placement,
    framing.canvasWidth,
    framing.canvasHeight,
  );
  const data = await sharp(background, {
    raw: {
      channels: 3,
      height: framing.canvasHeight,
      width: framing.canvasWidth,
    },
  })
    .composite([
      {
        input: vehicleLayer.image.data,
        left: vehicleLayer.left,
        raw: {
          channels: 4,
          height: vehicleLayer.image.height,
          width: vehicleLayer.image.width,
        },
        top: vehicleLayer.top,
      },
    ])
    .removeAlpha()
    .raw()
    .toBuffer();
  const composed: RawImage = {
    channels: 3,
    data,
    height: framing.canvasHeight,
    width: framing.canvasWidth,
  };
  if (!input.options.enhancement) return composed;
  const { content } = measurement;
  const contentLeft = Math.floor(framing.offsetX + content.left * framing.scale);
  const contentTop = Math.floor(framing.offsetY + content.top * framing.scale);
  return sharpenWithinLayer(composed, vehicleLayer, {
    height:
      Math.ceil(
        framing.offsetY + (content.top + content.height) * framing.scale,
      ) - contentTop,
    left: contentLeft,
    top: contentTop,
    width:
      Math.ceil(
        framing.offsetX + (content.left + content.width) * framing.scale,
      ) - contentLeft,
  });
}
