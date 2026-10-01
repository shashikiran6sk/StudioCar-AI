import type {
  BackgroundPlacement,
  StudioBackgroundAsset,
} from "./studio-background.types";

export interface PlaceStudioBackgroundInput {
  asset: StudioBackgroundAsset;
  canvasHeight: number;
  canvasWidth: number;
  /** Where the floor should meet the wall on the canvas; ignored without a floor. */
  targetSeamY: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * The region of a background asset that fills the canvas, scaled uniformly —
 * never stretched — and at least large enough to cover it.
 *
 * A floor background is additionally scaled and shifted so its wall/floor
 * seam lands on `targetSeamY`: enough wall above and floor below that the
 * seam can sit there with the asset still covering the whole canvas. A plain
 * background is centred.
 */
export function placeStudioBackground(
  input: PlaceStudioBackgroundInput,
): BackgroundPlacement {
  const { asset, canvasHeight, canvasWidth } = input;
  const cover = Math.max(canvasWidth / asset.width, canvasHeight / asset.height);
  let scale = cover;
  let offsetY = (canvasHeight - asset.height * cover) / 2;
  if (asset.seamY !== null) {
    const seam = clamp(input.targetSeamY, 0, canvasHeight);
    scale = Math.max(
      cover,
      seam / asset.seamY,
      (canvasHeight - seam) / (asset.height - asset.seamY),
    );
    offsetY = seam - asset.seamY * scale;
  }
  const offsetX = (canvasWidth - asset.width * scale) / 2;
  const width = Math.min(asset.width, canvasWidth / scale);
  const height = Math.min(asset.height, canvasHeight / scale);
  return {
    height,
    left: clamp(-offsetX / scale, 0, asset.width - width),
    top: clamp(-offsetY / scale, 0, asset.height - height),
    width,
  };
}
