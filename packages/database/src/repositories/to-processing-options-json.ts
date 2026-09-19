import type { ProcessingOptions } from "@studiocar/contracts";

import type { Prisma } from "../../generated/prisma/client";

export function toProcessingOptionsJson(
  options: ProcessingOptions,
): Prisma.InputJsonObject {
  return {
    background: options.background,
    crop: options.crop,
    ...(options.customBackgroundAssetId
      ? { customBackgroundAssetId: options.customBackgroundAssetId }
      : {}),
    enhancement: options.enhancement,
    outputFormat: options.outputFormat,
    paddingPercent: options.paddingPercent,
    platePrivacy: options.platePrivacy,
    quality: options.quality,
    shadow: options.shadow,
  };
}
