import { SUBJECT_ALPHA_THRESHOLD } from "./vehicle-shadow.constants";
import type { SubjectBox } from "./vehicle-alpha.types";

export function findAlphaBounds(
  pixels: Uint8Array,
  width: number,
  height: number,
): SubjectBox | null {
  if (width <= 0 || height <= 0 || pixels.length !== width * height)
    return null;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((pixels[y * width + x] ?? 0) < SUBJECT_ALPHA_THRESHOLD) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left
    ? null
    : { left, top, width: right - left + 1, height: bottom - top + 1 };
}
