import type { SupportedImageMimeType } from "@studiocar/contracts";

import { hexSha256ToBase64 } from "./hex-sha256-to-base64";
import { imageDimensionsAreSafe } from "./image-validation/image-dimensions-are-safe";
import {
  IMAGE_DIMENSIONS_EXCEEDED_REASON,
  IMAGE_MIME_MISMATCH_REASON,
  INVALID_IMAGE_HEADER_REASON,
} from "./image-validation/image-validation.constants";
import { parseImageMetadata } from "./image-validation/parse-image-metadata";
import {
  ASSET_ID_METADATA_KEY,
  USER_ID_METADATA_KEY,
  VEHICLE_ID_METADATA_KEY,
} from "./upload.constants";
import type { StoredObjectMetadata, UploadAsset } from "./upload.types";

const OBJECT_METADATA_MISMATCH_REASON =
  "The uploaded object metadata does not match the upload intent.";

export type StoredUploadValidation =
  | { valid: true; width: number; height: number }
  | { valid: false; reason: string };

export function validateStoredUpload(
  asset: UploadAsset,
  object: StoredObjectMetadata,
  headerBytes: Uint8Array,
  expectedMimeType: SupportedImageMimeType,
  expectedEtag: string | undefined,
  maximumDimension: number,
  maximumPixels: number,
): StoredUploadValidation {
  if (
    object.contentLength !== Number(asset.sizeBytes) ||
    object.contentType !== expectedMimeType ||
    object.checksumSha256 !== hexSha256ToBase64(asset.checksumSha256 ?? "") ||
    object.metadata[ASSET_ID_METADATA_KEY] !== asset.id ||
    object.metadata[USER_ID_METADATA_KEY] !== asset.userId ||
    object.metadata[VEHICLE_ID_METADATA_KEY] !== asset.vehicleId ||
    (expectedEtag !== undefined && object.etag !== expectedEtag)
  ) {
    return { valid: false, reason: OBJECT_METADATA_MISMATCH_REASON };
  }

  const image = parseImageMetadata(headerBytes);
  if (!image) return { valid: false, reason: INVALID_IMAGE_HEADER_REASON };
  if (image.mimeType !== expectedMimeType) {
    return { valid: false, reason: IMAGE_MIME_MISMATCH_REASON };
  }
  if (!imageDimensionsAreSafe(image, maximumDimension, maximumPixels)) {
    return { valid: false, reason: IMAGE_DIMENSIONS_EXCEEDED_REASON };
  }

  return { valid: true, width: image.width, height: image.height };
}
