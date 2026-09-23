import { createHash } from "node:crypto";
import type { CreateProcessingBatch } from "@studiocar/contracts";

import { canonicalProcessingOptions } from "./canonical-processing-options";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";

export function createProcessingBatchRequestHash(
  command: CreateProcessingBatch,
): string {
  // A label is part of what was asked for, so reusing a key with another
  // label is a conflict. An unlabelled request hashes exactly as before.
  const canonicalRequest = JSON.stringify({
    assetIds: command.assetIds,
    ...(command.label === undefined ? {} : { label: command.label }),
    options: canonicalProcessingOptions(command.options),
    vehicleId: command.vehicleId,
  });
  return createHash(SHA_256_ALGORITHM)
    .update(canonicalRequest)
    .digest(HEX_ENCODING);
}
