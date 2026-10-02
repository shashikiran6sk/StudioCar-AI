import sharp from "sharp";

import type { EnhancementLevels } from "./calculate-enhancement-levels";
import type { RawImage } from "./vehicle-alpha.types";

/**
 * Applies the vehicle's levels stretch to an RGBA layer's colour channels.
 * Alpha is untouched, and black shadow pixels stay black because the offset
 * is never positive.
 */
export async function applyEnhancementLevels(
  layer: RawImage,
  levels: EnhancementLevels,
): Promise<RawImage> {
  const data = await sharp(layer.data, {
    raw: { channels: 4, height: layer.height, width: layer.width },
  })
    .linear(
      [levels.gain, levels.gain, levels.gain, 1],
      [levels.offset, levels.offset, levels.offset, 0],
    )
    .raw()
    .toBuffer();
  return { ...layer, data };
}
