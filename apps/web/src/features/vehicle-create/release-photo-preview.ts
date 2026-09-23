import { PhotoSource } from "./photo-source";
import type { PhotoUploadItem } from "./photo-upload.types";

/** Frees a local preview. A stored original's signed URL is not ours to free. */
export function releasePhotoPreview(photo: PhotoUploadItem): void {
  if (photo.source === PhotoSource.Upload) URL.revokeObjectURL(photo.previewUrl);
}
