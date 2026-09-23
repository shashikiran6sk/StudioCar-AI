import type { CropMode } from "@studiocar/contracts";

import { CROP_MODE_LABELS } from "./crop-mode.constants";

export function formatCropMode(crop: CropMode): string {
  return CROP_MODE_LABELS[crop];
}
