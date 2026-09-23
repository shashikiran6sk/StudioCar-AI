import type { CropMode } from "@studiocar/contracts";

/** How each composition choice is named wherever a treatment is summarised. */
export const CROP_MODE_LABELS: Readonly<Record<CropMode, string>> = {
  FIT_VEHICLE: "Fit to vehicle",
  MAINTAIN_COMPOSITION: "Maintained",
  SQUARE: "Square",
};
