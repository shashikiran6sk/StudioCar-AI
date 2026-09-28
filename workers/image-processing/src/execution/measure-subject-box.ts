import sharp from "sharp";

import type { SubjectBox } from "./create-studio-scene-svg";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const ALPHA_CHANNEL_INDEX = 3;

/**
 * Finds where the vehicle sits in a cutout that has transparent surroundings.
 *
 * Returns `null` when nothing opaque remains, so the caller can fall back to a
 * plain background instead of drawing a floor under an empty frame. That is
 * checked on the alpha channel first: `trim` does not fail on a fully
 * transparent image, it returns the whole frame as if it were the subject.
 */
export async function measureSubjectBox(
  cutout: Buffer,
): Promise<SubjectBox | null> {
  try {
    const { channels } = await sharp(cutout).ensureAlpha().stats();
    if ((channels[ALPHA_CHANNEL_INDEX]?.max ?? 0) === 0) return null;

    const { info } = await sharp(cutout)
      .trim({ background: TRANSPARENT, threshold: 1 })
      .toBuffer({ resolveWithObject: true });
    return {
      left: Math.abs(info.trimOffsetLeft ?? 0),
      top: Math.abs(info.trimOffsetTop ?? 0),
      width: info.width,
      height: info.height,
    };
  } catch {
    return null;
  }
}
