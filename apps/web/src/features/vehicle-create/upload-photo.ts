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
  callbacks.onStatus(PhotoUploadStatus.Preparing);
  const checksumSha256 = await hashFileSha256(photo.file);
  const intent = await requestUploadIntent(
    {
      vehicleId,
      filename: photo.file.name,
      mimeType: SupportedImageMimeTypeSchema.parse(photo.file.type),
      sizeBytes: photo.file.size,
      checksumSha256,
    },
    photo.clientId,
  );
  callbacks.onStatus(PhotoUploadStatus.Uploading);
  const etag = await putFileWithProgress(
    photo.file,
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
