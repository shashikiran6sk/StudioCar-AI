import type { PhotoUploadItem } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import {
  PHOTO_UPLOAD_FAILED_STATUS_LABEL,
  PHOTO_UPLOAD_FINALIZING_STATUS_LABEL,
  PHOTO_UPLOAD_PREPARING_STATUS_LABEL,
  PHOTO_UPLOAD_UPLOADED_STATUS_LABEL,
  PHOTO_UPLOAD_UPLOADING_STATUS_LABEL,
  PHOTO_UPLOAD_WAITING_STATUS_LABEL,
} from "./vehicle-create.constants";

export function photoUploadStatusLabel(photo: PhotoUploadItem): string {
  switch (photo.status) {
    case PhotoUploadStatus.Selected:
      return PHOTO_UPLOAD_WAITING_STATUS_LABEL;
    case PhotoUploadStatus.Preparing:
      return PHOTO_UPLOAD_PREPARING_STATUS_LABEL;
    case PhotoUploadStatus.Uploading:
      return `${PHOTO_UPLOAD_UPLOADING_STATUS_LABEL} ${String(photo.progress)}%`;
    case PhotoUploadStatus.Finalizing:
      return PHOTO_UPLOAD_FINALIZING_STATUS_LABEL;
    case PhotoUploadStatus.Uploaded:
      return PHOTO_UPLOAD_UPLOADED_STATUS_LABEL;
    case PhotoUploadStatus.Failed:
      return PHOTO_UPLOAD_FAILED_STATUS_LABEL;
  }
}
