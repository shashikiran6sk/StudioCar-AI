import { SupportedImageMimeTypeSchema } from "@studiocar/contracts";

import { commitPhotoUpload } from "./commit-photo-upload";
import { hashFileSha256 } from "./hash-file-sha256";
import type {
  PhotoUploadItem,
  PhotoUploadSuccess,
} from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import { putFileWithProgress } from "./put-file-with-progress";
import { requestUploadIntent } from "./request-upload-intent";
import { PHOTO_UPLOAD_GENERIC_ERROR } from "./vehicle-create.constants";

export interface UploadPhotoCallbacks {
  onProgress: (progress: number) => void;
  onStatus: (status: PhotoUploadStatus) => void;
  signal?: AbortSignal;
}

export async function uploadPhoto(
  vehicleId: string,
  photo: PhotoUploadItem,
  callbacks: UploadPhotoCallbacks,
): Promise<PhotoUploadSuccess> {
  const file = photo.file;
  if (!file) throw new Error(PHOTO_UPLOAD_GENERIC_ERROR);
  callbacks.onStatus(PhotoUploadStatus.Preparing);
  const checksumSha256 = await hashFileSha256(file);
  const intent = await requestUploadIntent(
    {
      vehicleId,
      filename: file.name,
      mimeType: SupportedImageMimeTypeSchema.parse(file.type),
      sizeBytes: file.size,
      checksumSha256,
    },
    photo.clientId,
  );
  callbacks.onStatus(PhotoUploadStatus.Uploading);
  const etag = await putFileWithProgress(
    file,
    intent.uploadUrl,
    intent.headers,
    callbacks.onProgress,
    callbacks.signal,
  );
  callbacks.onStatus(PhotoUploadStatus.Finalizing);
  const committed = await commitPhotoUpload(intent.assetId, etag);
  return {
    assetId: committed.assetId,
    height: committed.height,
    width: committed.width,
  };
}
