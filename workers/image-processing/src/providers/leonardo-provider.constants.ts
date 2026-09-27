export const LEONARDO_PROVIDER_KEY = "LEONARDO";
export const LEONARDO_ENDPOINT =
  "https://cloud.leonardo.ai/api/rest/v2/generationssync";
export const LEONARDO_DEFAULT_SIZE = "full";
export const LEONARDO_FORMAT = "webp";
export const LEONARDO_JSON_CONTENT_TYPE = "application/json";
export const LEONARDO_MAXIMUM_JSON_BYTES = 64 * 1024;
export const LEONARDO_SOURCE_URL_TTL_SECONDS = 300;
export const LEONARDO_EVENTS = {
  started: "leonardo_started",
  generated: "leonardo_generated",
  completed: "leonardo_completed",
  failed: "leonardo_failed",
};
export const LEONARDO_MESSAGES = {
  options: "Leonardo provider options are invalid.",
  credentials: "Leonardo server credentials are missing.",
  request: "The background-removal provider rejected the image request.",
  response: "The background-removal provider returned an invalid response.",
  image: "The background-removal provider returned an invalid image.",
  authorization:
    "The background-removal provider rejected its server credentials.",
  payment: "The background-removal provider requires payment.",
  rateLimit: "The background-removal provider rate limited the request.",
  unavailable: "The background-removal provider is temporarily unavailable.",
  timeout: "The background-removal provider timed out.",
  network: "The background-removal provider could not be reached.",
  download: "The background-removal result could not be downloaded.",
};

export const LEONARDO_MINIMUM_TIMEOUT_MS = 500;
export const LEONARDO_MAXIMUM_TIMEOUT_MS = 120_000;
export const LEONARDO_SOURCE_TYPE = "URL";
export const LEONARDO_REQUEST_DEFAULTS = {
  model: "remove-bg",
  public: false,
  ephemeral: true,
};
export const LEONARDO_PARAMETER_DEFAULTS = {
  type: "car",
  format: LEONARDO_FORMAT,
  channels: "rgba",
  semitransparency: true,
  shadow_type: "none",
};
