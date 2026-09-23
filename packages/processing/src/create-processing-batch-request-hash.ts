import { createHash } from "node:crypto";
import type { CreateProcessingBatch } from "@studiocar/contracts";

import { canonicalProcessingOptions } from "./canonical-processing-options";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";

export function createProcessingBatchRequestHash(
  command: CreateProcessingBatch,
): string {
  const canonicalRequest = JSON.stringify({
    assetIds: command.assetIds,
    options: canonicalProcessingOptions(command.options),
    vehicleId: command.vehicleId,
  });
  return createHash(SHA_256_ALGORITHM)
    .update(canonicalRequest)
    .digest(HEX_ENCODING);
}
