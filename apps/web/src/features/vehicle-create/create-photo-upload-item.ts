import type { PhotoUploadItem } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";

export function createPhotoUploadItem(
  file: File,
  createId: () => string = () => crypto.randomUUID(),
  createPreviewUrl: (file: File) => string = (selectedFile) =>
    URL.createObjectURL(selectedFile),
): PhotoUploadItem {
  return {
    assetId: null,
    clientId: createId(),
    error: null,
    file,
    height: null,
    previewUrl: createPreviewUrl(file),
    progress: 0,
    status: PhotoUploadStatus.Selected,
    width: null,
  };
}
