import type { BackgroundTreatment, FloorStyle, CropMode } from "@studiocar/contracts";

export const ORIGINAL_BACKGROUND_TREATMENT: BackgroundTreatment = "ORIGINAL";
export const DEFAULT_BACKGROUND_TREATMENT: BackgroundTreatment =
  "PREMIUM_WHITE";
export const MAINTAIN_COMPOSITION_CROP: CropMode = "MAINTAIN_COMPOSITION";
export const FIT_VEHICLE_CROP: CropMode = "FIT_VEHICLE";

/** The homepage's flat studio floor, which a new batch starts with. */
export const DEFAULT_FLOOR_STYLE: FloorStyle = "HORIZON";

/**
 * The studio backgrounds, which offer a plain background or a standard floor.
 * The original photo keeps its own surroundings, so a floor means nothing there.
 */
export const STUDIO_SCENE_BACKGROUNDS: readonly BackgroundTreatment[] = [
  "PREMIUM_WHITE",
  "GREY_STUDIO",
  "DARK_STUDIO",
];
