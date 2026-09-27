import type { ShadowLayer, VehicleAlpha } from "./vehicle-alpha.types";
import {
  SUBJECT_ALPHA_THRESHOLD,
  VEHICLE_CONTACT_REGION_RATIO,
} from "./vehicle-shadow.constants";

/** Compress only the lower vehicle onto its local tyre/chassis line. No lateral skew. */
export function projectContactMask(
  alpha: VehicleAlpha,
  layer: ShadowLayer,
): Uint8Array {
  const mask = new Uint8Array(alpha.width * alpha.height);
  const subject = alpha.subject;
  if (subject === null) return mask;
  const bottom = subject.top + subject.height - 1;
  const lowerTop = Math.max(
    subject.top,
    Math.ceil(bottom - subject.height * VEHICLE_CONTACT_REGION_RATIO),
  );
  const centerX = subject.left + (subject.width - 1) / 2;
  for (let x = subject.left; x < subject.left + subject.width; x += 1) {
    let contact = bottom;
    while (
      contact >= lowerTop &&
      (alpha.pixels[contact * alpha.width + x] ?? 0) < SUBJECT_ALPHA_THRESHOLD
    )
      contact -= 1;
    if (contact < lowerTop) continue;
    const ground = contact + (bottom - contact) * layer.groundBlend;
    const displacement = (x - centerX) * layer.horizontalSpread;
    const destinationX =
      displacement < 0
        ? Math.ceil(centerX + displacement - 0.5)
        : Math.floor(centerX + displacement + 0.5);
    if (destinationX < 0 || destinationX >= alpha.width) continue;
    for (let y = lowerTop; y <= contact; y += 1) {
      const value = alpha.pixels[y * alpha.width + x] ?? 0;
      if (value < SUBJECT_ALPHA_THRESHOLD) continue;
      const destinationY = Math.round(
        ground +
          (contact - y) * layer.verticalCompression +
          subject.height * layer.verticalOffset,
      );
      if (destinationY < 0 || destinationY >= alpha.height) continue;
      const index = destinationY * alpha.width + destinationX;
      mask[index] = Math.max(mask[index] ?? 0, value);
    }
  }
  return mask;
}
