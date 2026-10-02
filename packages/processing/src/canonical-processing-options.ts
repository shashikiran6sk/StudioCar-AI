import type { ProcessingOptions } from "@studiocar/contracts";

/**
 * Processing options with a fixed key order, so hashing the same treatment
 * always yields the same digest whatever order the caller built it in. Only
 * options that change the rendered image belong here: two batches whose
 * pixels cannot differ are the same studio version.
 */
export function canonicalProcessingOptions(
  options: ProcessingOptions,
): ProcessingOptions {
  return {
    background: options.background,
    crop: options.crop,
    enhancement: options.enhancement,
    floor: options.floor,
    paddingPercent: options.paddingPercent,
    quality: options.quality,
  };
}
