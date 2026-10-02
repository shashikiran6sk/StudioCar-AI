import type { ProcessingOptions } from "@studiocar/contracts";

import type { Prisma } from "@studiocar/database-runtime";

export function toProcessingOptionsJson(
  options: ProcessingOptions,
): Prisma.InputJsonObject {
  return {
    background: options.background,
    crop: options.crop,
    enhancement: options.enhancement,
    floor: options.floor,
    paddingPercent: options.paddingPercent,
    quality: options.quality,
  };
}
