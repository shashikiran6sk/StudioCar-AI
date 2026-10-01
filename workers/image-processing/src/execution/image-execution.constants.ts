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
export const NO_VEHICLE_DETECTED_MESSAGE =
  "The background-removal provider found no vehicle in the image.";
export const COMPOSITION_FAILURE_MESSAGE =
  "The studio image could not be composed.";
export const STORAGE_FAILURE_MESSAGE =
  "Private image storage was unavailable during processing.";

export const OUTPUT_CHECKSUM_METADATA_KEY = "checksum-sha256";
export const OUTPUT_JOB_METADATA_KEY = "processing-job-id";
export const PROVIDER_REQUEST_METADATA_KEY = "provider-request-id";
export const OUTPUT_WEBP_CONTENT_TYPE = "image/webp";

/**
 * Alpha at or above this is the vehicle body. Leonardo's car shadow and
 * antialiased fringes sit below it, so the tyre line and the vehicle size are
 * measured from the body alone.
 */
export const VEHICLE_ALPHA_THRESHOLD = 128;
/**
 * Alpha at or above this is content that composition must keep in frame,
 * including most of the shadow's soft tail.
 */
export const CONTENT_ALPHA_THRESHOLD = 8;
/**
 * A cutout whose body covers less of the frame than this holds no vehicle:
 * the provider found no car. Real listing photos are far above it.
 */
export const MINIMUM_VEHICLE_COVERAGE = 0.002;

export const PREVIEW_WEBP_QUALITY = 82;
/** WebP effort: the encoder's default speed/size balance. */
export const OUTPUT_WEBP_EFFORT = 4;

export const SQUARE_OUTPUT_EDGE_PIXELS = 1_600;
export const FIT_OUTPUT_WIDTH_PIXELS = 1_600;
export const FIT_OUTPUT_HEIGHT_PIXELS = 1_200;
/**
 * How far "fit to vehicle" may enlarge a cutout. Without it a small cutout
 * sits small on the fixed canvas; beyond it an enlarged cutout looks soft.
 */
export const FIT_VEHICLE_MAXIMUM_ENLARGEMENT = 1.3;

/** Image Enhancement stretches the vehicle's own tones between these percentiles. */
export const ENHANCEMENT_LOW_PERCENTILE = 0.01;
export const ENHANCEMENT_HIGH_PERCENTILE = 0.99;
/** Never stretch contrast by more than this; a flat subject stays natural. */
export const ENHANCEMENT_MAXIMUM_GAIN = 1.5;
/** A tonal range narrower than this is left alone rather than amplified. */
export const ENHANCEMENT_MINIMUM_RANGE = 24;
/** Every n-th vehicle pixel is sampled for the tonal range. */
export const ENHANCEMENT_SAMPLE_STRIDE = 4;
export const ENHANCEMENT_SHARPEN_SIGMA = 1;
