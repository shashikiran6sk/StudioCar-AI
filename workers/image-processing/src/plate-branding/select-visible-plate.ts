import type { PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";
import {
  PLATE_DUPLICATE_OVERLAP, PLATE_MAXIMUM_ASPECT, PLATE_MAXIMUM_FRAME_SHARE,
  PLATE_MINIMUM_ASPECT, PLATE_MINIMUM_HEIGHT, PLATE_MINIMUM_MODEL_SCORE,
  PLATE_MINIMUM_WIDTH, PLATE_OPAQUE_ALPHA,
  PLATE_OPAQUE_SAMPLE_POSITIONS,
} from "./plate-branding.constants";

/** Prefer missing an uncertain plate to branding a badge or background car. */
export function selectVisiblePlate(image: RawImage, detections: readonly PlateDetection[]): PlateDetection | null {
  const valid = detections.filter((box) => {
    const width = box.width * image.width;
    const height = box.height * image.height;
    const aspect = width / height;
    if (box.score < PLATE_MINIMUM_MODEL_SCORE || width < PLATE_MINIMUM_WIDTH ||
        height < PLATE_MINIMUM_HEIGHT || aspect < PLATE_MINIMUM_ASPECT ||
        aspect > PLATE_MAXIMUM_ASPECT || box.width * box.height > PLATE_MAXIMUM_FRAME_SHARE) return false;
    if (image.channels === 3) return true;
    // Plate and its corners must be on opaque vehicle pixels, not shadow or sky.
    for (const y of PLATE_OPAQUE_SAMPLE_POSITIONS) for (const x of PLATE_OPAQUE_SAMPLE_POSITIONS) {
      const px = Math.floor((box.left + box.width * x) * image.width);
      const py = Math.floor((box.top + box.height * y) * image.height);
      if ((image.data[(py * image.width + px) * 4 + 3] ?? 0) < PLATE_OPAQUE_ALPHA) return false;
    }
    return true;
  }).sort((a, b) => b.score - a.score);
  const first = valid[0];
  if (!first) return null;
  for (const box of valid.slice(1)) {
    const intersection = Math.max(0, Math.min(first.left + first.width, box.left + box.width) - Math.max(first.left, box.left)) *
      Math.max(0, Math.min(first.top + first.height, box.top + box.height) - Math.max(first.top, box.top));
    const union = first.width * first.height + box.width * box.height - intersection;
    if (intersection / union < PLATE_DUPLICATE_OVERLAP) return null;
  }
  return first;
}
