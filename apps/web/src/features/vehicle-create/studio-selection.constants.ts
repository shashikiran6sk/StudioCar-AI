import type {
  ExistingVehicleSelectionMode,
  StudioSelectionMode,
} from "@studiocar/contracts";

export const NEW_UPLOAD_MODE: StudioSelectionMode = "NEW_UPLOAD";
export const EXISTING_VEHICLE_TOTAL_STEPS = 3;
export const EXISTING_PHOTOS_TITLE = "Choose photos";
export const EXISTING_PHOTOS_CANCEL_LABEL = "Cancel";
export const EXISTING_PHOTO_INCLUDE_LABEL = "Include";
export const EXISTING_PHOTO_IMAGE_LABEL = "Image";
export const EXISTING_PHOTO_FAILED_LABEL = "Processing failed";
export const EXISTING_PHOTO_REPLACE_LABEL = "Replace image";
export const EXISTING_PHOTO_REPLACE_INPUT_LABEL = "Choose a replacement photo";
export const EXISTING_PHOTO_NONE_SELECTED_ERROR =
  "Select at least one photo to process.";
export const EXISTING_PHOTO_REPLACE_REQUIRED_ERROR =
  "Replace the photos that can't be processed, or leave them out.";

export function existingPhotoSelectionLimitError(maximumPhotos: number): string {
  return `Select up to ${String(maximumPhotos)} photos for one batch.`;
}

/** How the dialog introduces itself for each way it opens on a vehicle. */
export const EXISTING_VEHICLE_SELECTION_COPY: Readonly<
  Record<
    ExistingVehicleSelectionMode,
    { description: string; eyebrow: string; photosNote: string }
  >
> = {
  CREATE_VARIANT: {
    description:
      "Create another studio version of this vehicle from its photos. Earlier versions stay as they are.",
    eyebrow: "New studio version",
    photosNote:
      "These are the photos of the version you started from. Keep the ones you want, add more if you like, then choose a new treatment.",
  },
  REPLACE_FAILED: {
    description:
      "Replace the photos that failed, keep or change the treatment, and process again.",
    eyebrow: "Replace failed images",
    photosNote:
      "Replace each photo that failed. The photos that succeeded are listed too; select any you also want in this batch.",
  },
  REPROCESS_FAILED: {
    description:
      "Process the photos that failed again, with the same treatment or a different one.",
    eyebrow: "Re-process failed images",
    photosNote:
      "The photos that failed are selected. Select any others you also want to process again.",
  },
};
