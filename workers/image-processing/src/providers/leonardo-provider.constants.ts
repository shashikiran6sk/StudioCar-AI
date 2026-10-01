import type { LeonardoSize } from "@studiocar/contracts";
import type { ProcessingQualityTier } from "@studiocar/processing";

export const LEONARDO_PROVIDER_KEY = "LEONARDO";
/** Telemetry and log name of the provider; never a metric dimension value that varies. */
export const LEONARDO_PROVIDER_NAME = "Leonardo";
export const LEONARDO_LOG_PROVIDER = "leonardo";

/** Remove Background, synchronous API: the Lambda waits for its one image. */
export const LEONARDO_SYNC_ENDPOINT =
  "https://cloud.leonardo.ai/api/rest/v2/generationssync";
export const LEONARDO_JSON_CONTENT_TYPE = "application/json";
export const LEONARDO_OUTPUT_CONTENT_TYPE = "image/webp";
export const LEONARDO_OUTPUT_FORMAT = "webp";
/**
 * Download content types accepted before the bytes are decoded. Some object
 * CDNs label every object as generic binary; the decoded format decides.
 */
export const LEONARDO_ACCEPTED_DOWNLOAD_CONTENT_TYPES: readonly string[] = [
  LEONARDO_OUTPUT_CONTENT_TYPE,
  "application/octet-stream",
  "binary/octet-stream",
];
export const LEONARDO_MAXIMUM_JSON_BYTES = 64 * 1024;

/**
 * Presigned source URLs outlive the whole provider exchange by a wide margin
 * (the exchange is bounded by `LEONARDO_MAXIMUM_TIMEOUT_MS`), and every attempt
 * mints its own, so an expired source can only mean a clock fault.
 */
export const LEONARDO_SOURCE_URL_TTL_SECONDS = 15 * 60;

export const LEONARDO_MINIMUM_TIMEOUT_MS = 1_000;
export const LEONARDO_MAXIMUM_TIMEOUT_MS = 150_000;

/** Output resolution per plan tier. Free accounts receive Leonardo's preview size. */
export const LEONARDO_SIZE_BY_QUALITY_TIER = {
  STANDARD: "preview",
  HIGH: "auto",
} as const satisfies Record<ProcessingQualityTier, LeonardoSize>;

export const LEONARDO_REQUEST_DEFAULTS = {
  model: "remove-bg",
  public: false,
  ephemeral: true,
} as const;

/**
 * A transparent car with Leonardo's own car shadow, in the source frame.
 * `background_image_reference` is deliberately never sent: StudioCar
 * composes its own backgrounds.
 */
export const LEONARDO_PARAMETER_DEFAULTS = {
  type: "car",
  format: LEONARDO_OUTPUT_FORMAT,
  channels: "rgba",
  crop: false,
  shadow_type: "car",
  semitransparency: true,
} as const;
export const LEONARDO_SOURCE_TYPE = "URL";

export const LEONARDO_RETRY_AFTER_HEADER = "retry-after";
export const LEONARDO_OPTIONS_ERROR = "Leonardo provider options are invalid.";

/**
 * How often an already-paid result is fetched before giving up, and the
 * pauses between fetches. All of it runs within the exchange's one deadline,
 * and only for failures that can pass (network errors, 408, 429 and 5xx).
 */
export const LEONARDO_DOWNLOAD_RETRY_DELAYS_MS: readonly number[] = [1_000, 2_000];
