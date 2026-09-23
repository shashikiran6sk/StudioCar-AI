import { createHash } from "node:crypto";
import type { CreateProcessingBatch } from "@studiocar/contracts";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";

export function createProcessingBatchRequestHash(
  command: CreateProcessingBatch,
): string {
  const canonicalRequest = JSON.stringify({
    assetIds: command.assetIds,
    options: {
      background: command.options.background,
      crop: command.options.crop,
      enhancement: command.options.enhancement,
      floor: command.options.floor,
      outputFormat: command.options.outputFormat,
      paddingPercent: command.options.paddingPercent,
      platePrivacy: command.options.platePrivacy,
      quality: command.options.quality,
      shadow: command.options.shadow,
    },
    vehicleId: command.vehicleId,
  });
  return createHash(SHA_256_ALGORITHM)
    .update(canonicalRequest)
    .digest(HEX_ENCODING);
}
