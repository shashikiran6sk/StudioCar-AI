import type { RawImage } from "./vehicle-alpha.types";

/** The alpha channel of an RGBA raw image, one byte per pixel. */
export function extractAlpha(image: RawImage): Uint8Array {
  const pixels = image.width * image.height;
  const alpha = new Uint8Array(pixels);
  if (image.channels !== 4) return alpha.fill(255);
  for (let index = 0; index < pixels; index += 1) {
    alpha[index] = image.data[index * 4 + 3] ?? 0;
  }
  return alpha;
}
