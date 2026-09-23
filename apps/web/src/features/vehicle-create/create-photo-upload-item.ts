import { PhotoSource } from "./photo-source";
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
    failureReason: null,
    file,
    filename: file.name,
    height: null,
    previewUrl: createPreviewUrl(file),
    progress: 0,
    replaceRequired: false,
    selected: true,
    sizeBytes: file.size,
    source: PhotoSource.Upload,
    status: PhotoUploadStatus.Selected,
    width: null,
  };
}
