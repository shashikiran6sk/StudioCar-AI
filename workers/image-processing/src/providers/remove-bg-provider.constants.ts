export const REMOVE_BG_PROVIDER_KEY = "REMOVEBG";
export const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";
export const REMOVE_BG_API_KEY_HEADER = "x-api-key";
export const REMOVE_BG_CONTENT_TYPE_HEADER = "content-type";
export const REMOVE_BG_METHOD = "POST";
export const REMOVE_BG_REQUEST_ID_HEADERS: readonly string[] = [
  "x-request-id",
  "x-kaleido-request-id",
];
export const REMOVE_BG_IMAGE_FIELD = "image_file";
export const REMOVE_BG_SIZE_FIELD = "size";
export const REMOVE_BG_SIZE_VALUE = "auto";
export const REMOVE_BG_TYPE_FIELD = "type";
export const REMOVE_BG_TYPE_VALUE = "car";
export const REMOVE_BG_FORMAT_FIELD = "format";
export const REMOVE_BG_FORMAT_VALUE = "webp";
export const REMOVE_BG_TAG_FIELD = "tag";
export const REMOVE_BG_SHADOW_TYPE_FIELD = "shadow_type";
export const REMOVE_BG_SOURCE_FILENAME = "source";
export const REMOVE_BG_RESPONSE_CONTENT_TYPE = "image/webp";
export const REMOVE_BG_MINIMUM_TIMEOUT_MS = 500;
export const REMOVE_BG_MAXIMUM_TIMEOUT_MS = 120_000;
export const REMOVE_BG_MINIMUM_OUTPUT_BYTES = 1;
export const REMOVE_BG_MAXIMUM_OUTPUT_BYTES = 100 * 1024 * 1024;
export const REMOVE_BG_INVALID_OPTIONS_ERROR =
  "Remove.bg provider options are invalid.";
export const REMOVE_BG_RATE_LIMIT_MESSAGE =
  "The background-removal provider rate limited the request.";
export const REMOVE_BG_UNAVAILABLE_MESSAGE =
  "The background-removal provider is temporarily unavailable.";
export const REMOVE_BG_AUTHORIZATION_MESSAGE =
  "The background-removal provider rejected its server credentials.";
export const REMOVE_BG_INVALID_REQUEST_MESSAGE =
  "The background-removal provider rejected the image request.";
export const REMOVE_BG_INVALID_RESPONSE_MESSAGE =
  "The background-removal provider returned an invalid image response.";
export const REMOVE_BG_TIMEOUT_MESSAGE =
  "The background-removal provider timed out.";
export const REMOVE_BG_NETWORK_MESSAGE =
  "The background-removal provider could not be reached.";
