import sharp from "sharp";

import { INTERMEDIATE_PNG } from "./studio-compositing.constants";
import type { StudioSceneLayout } from "./studio-scene.types";

/**
 * Resizes one full-stage layer to output pixels and cuts the frame from it.
 * Where the frame reaches past the stage, the layer's own edge is continued,
 * which keeps a smooth wall and floor without drawing anything new.
 *
 * Intermediate images stay PNG rather than raw pixels: sharp's raw output of
 * a resized transparent layer mis-scales its soft edges, which drew a bright
 * line where the floor fades into the wall.
 */
export async function cutSceneWindow(
  layer: Uint8Array,
  layout: Pick<StudioSceneLayout, "stage" | "window">,
): Promise<Buffer> {
  const { stage, window } = layout;
  const resized = await sharp(layer)
    .ensureAlpha()
    .resize(stage.width, stage.height, { fit: "fill" })
    .png(INTERMEDIATE_PNG)
    .toBuffer();
  const extension = {
    top: Math.max(0, -window.top),
    left: Math.max(0, -window.left),
    right: Math.max(0, window.left + window.width - stage.width),
    bottom: Math.max(0, window.top + window.height - stage.height),
  };
  const extended =
    extension.top + extension.left + extension.right + extension.bottom > 0
      ? await sharp(resized)
          .extend({ ...extension, extendWith: "copy" })
          .png(INTERMEDIATE_PNG)
          .toBuffer()
      : resized;

  return sharp(extended)
    .extract({
      left: Math.max(0, window.left),
      top: Math.max(0, window.top),
      width: window.width,
      height: window.height,
    })
    .png(INTERMEDIATE_PNG)
    .toBuffer();
}
