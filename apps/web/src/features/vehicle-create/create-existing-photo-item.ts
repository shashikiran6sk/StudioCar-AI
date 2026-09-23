import type { StudioSelectionImage } from "@studiocar/contracts";

import { PhotoSource } from "./photo-source";
import type { PhotoUploadItem } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import { PHOTO_UPLOAD_MAX_PROGRESS } from "./vehicle-create.constants";

/** A stored original, already uploaded, as a row the dialog can select. */
export function createExistingPhotoItem(
  image: StudioSelectionImage,
): PhotoUploadItem {
  return {
    assetId: image.assetId,
    clientId: image.assetId,
    error: null,
    failureReason: image.failureReason,
    file: null,
    filename: image.originalFilename,
    height: image.height,
    previewUrl: image.previewUrl,
    progress: PHOTO_UPLOAD_MAX_PROGRESS,
    replaceRequired: image.replaceRequired,
    selected: image.selected && !image.replaceRequired,
    sizeBytes: image.sizeBytes,
    source: PhotoSource.Existing,
    status: PhotoUploadStatus.Uploaded,
    width: image.width,
  };
}
