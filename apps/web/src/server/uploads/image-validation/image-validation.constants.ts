export const IMAGE_HEADER_READ_BYTES = 512 * 1024;

export const INVALID_IMAGE_HEADER_REASON =
  "The uploaded object does not contain a supported image header.";
export const IMAGE_MIME_MISMATCH_REASON =
  "The uploaded image format does not match the declared content type.";
export const IMAGE_DIMENSIONS_EXCEEDED_REASON =
  "The uploaded image dimensions exceed the configured safety limits.";
