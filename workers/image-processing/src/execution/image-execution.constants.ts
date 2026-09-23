export const SOURCE_SIZE_MISMATCH_MESSAGE =
  "The stored source image size does not match its committed metadata.";
export const SOURCE_CHECKSUM_MISMATCH_MESSAGE =
  "The stored source image checksum does not match its committed metadata.";
export const SOURCE_MIME_MISMATCH_MESSAGE =
  "The decoded source format does not match its committed media type.";
export const INVALID_SOURCE_IMAGE_MESSAGE =
  "The source image cannot be decoded safely.";
export const UNSUPPORTED_SOURCE_IMAGE_MESSAGE =
  "The source image format is not supported.";
export const PROVIDER_RESULT_INVALID_MESSAGE =
  "The background-removal provider returned an invalid image.";
export const STUDIO_ASSETS_UNAVAILABLE_MESSAGE =
  "Studio processing assets were unavailable during processing.";
export const STUDIO_SCENE_MISSING_MESSAGE =
  "A studio background was requested without its scene assets.";
export const STORAGE_FAILURE_MESSAGE =
  "Private image storage was unavailable during processing.";
export const OUTPUT_CHECKSUM_METADATA_KEY = "checksum-sha256";
export const OUTPUT_JOB_METADATA_KEY = "processing-job-id";
export const PROVIDER_REQUEST_METADATA_KEY = "provider-request-id";
export const OUTPUT_WEBP_CONTENT_TYPE = "image/webp";
export const PREVIEW_WEBP_QUALITY = 82;
export const SQUARE_OUTPUT_EDGE_PIXELS = 1_600;
export const FIT_OUTPUT_WIDTH_PIXELS = 1_600;
export const FIT_OUTPUT_HEIGHT_PIXELS = 1_200;
/** New space around an original-background photo is filled white. */
export const ORIGINAL_FILL = { r: 255, g: 255, b: 255, alpha: 1 };
