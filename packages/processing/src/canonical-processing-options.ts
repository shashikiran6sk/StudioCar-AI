import type { ProcessingOptions } from "@studiocar/contracts";

/**
 * Processing options with a fixed key order, so hashing the same treatment
 * always yields the same digest whatever order the caller built it in.
 */
export function canonicalProcessingOptions(
  options: ProcessingOptions,
): ProcessingOptions {
  return {
    background: options.background,
    crop: options.crop,
    enhancement: options.enhancement,
    floor: options.floor,
    outputFormat: options.outputFormat,
    paddingPercent: options.paddingPercent,
    platePrivacy: options.platePrivacy,
    quality: options.quality,
    shadow: options.shadow,
  };
}
