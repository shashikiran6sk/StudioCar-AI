import {
  REMOVE_BG_INVALID_OPTIONS_ERROR,
  REMOVE_BG_MAXIMUM_OUTPUT_BYTES,
  REMOVE_BG_MAXIMUM_TIMEOUT_MS,
  REMOVE_BG_MINIMUM_OUTPUT_BYTES,
  REMOVE_BG_MINIMUM_TIMEOUT_MS,
} from "./remove-bg-provider.constants";
import type { RemoveBgProviderOptions } from "./remove-bg-provider.types";

export function validateRemoveBgProviderOptions(
  options: RemoveBgProviderOptions,
): void {
  if (
    options.apiKey.trim().length === 0 ||
    !Number.isInteger(options.timeoutMilliseconds) ||
    options.timeoutMilliseconds < REMOVE_BG_MINIMUM_TIMEOUT_MS ||
    options.timeoutMilliseconds > REMOVE_BG_MAXIMUM_TIMEOUT_MS ||
    !Number.isInteger(options.maximumOutputBytes) ||
    options.maximumOutputBytes < REMOVE_BG_MINIMUM_OUTPUT_BYTES ||
    options.maximumOutputBytes > REMOVE_BG_MAXIMUM_OUTPUT_BYTES
  ) {
    throw new RangeError(REMOVE_BG_INVALID_OPTIONS_ERROR);
  }
}
