import type { SubjectBox } from "./vehicle-alpha.types";

export interface AlphaBounds {
  box: SubjectBox;
  pixelCount: number;
}

/**
 * The bounding box of every pixel whose alpha reaches `threshold`, and how
 * many there are. `alpha` holds one byte per pixel.
 */
export function findAlphaBounds(
  alpha: Uint8Array,
  width: number,
  height: number,
  threshold: number,
): AlphaBounds | null {
  if (width <= 0 || height <= 0 || alpha.length !== width * height) return null;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  let pixelCount = 0;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if ((alpha[row + x] ?? 0) < threshold) continue;
      pixelCount += 1;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      bottom = y;
    }
  }
  return right < left
    ? null
    : {
        box: { left, top, width: right - left + 1, height: bottom - top + 1 },
        pixelCount,
      };
}
