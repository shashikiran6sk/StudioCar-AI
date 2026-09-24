import {
  MAX_UPLOAD_BYTES,
  SupportedImageMimeTypeSchema,
} from "@studiocar/contracts";

import {
  PHOTO_UPLOAD_SIZE_ERROR,
  PHOTO_UPLOAD_UNSUPPORTED_ERROR,
} from "./vehicle-create.constants";
import type { RejectedPhoto } from "./photo-upload.types";

export interface PhotoSelectionResult {
  accepted: File[];
  batchLimitRejectedCount: number;
  rejected: RejectedPhoto[];
}

export function selectPhotoFiles(
  files: Iterable<File>,
  currentCount: number,
  maximumPhotos: number,
): PhotoSelectionResult {
  const accepted: File[] = [];
  let batchLimitRejectedCount = 0;
  const rejected: RejectedPhoto[] = [];

  for (const file of files) {
    if (!SupportedImageMimeTypeSchema.safeParse(file.type).success) {
      rejected.push({
        filename: file.name,
        reason: PHOTO_UPLOAD_UNSUPPORTED_ERROR,
      });
    } else if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push({ filename: file.name, reason: PHOTO_UPLOAD_SIZE_ERROR });
    } else if (currentCount + accepted.length >= maximumPhotos) {
      batchLimitRejectedCount += 1;
    } else {
      accepted.push(file);
    }
  }

  return { accepted, batchLimitRejectedCount, rejected };
}
