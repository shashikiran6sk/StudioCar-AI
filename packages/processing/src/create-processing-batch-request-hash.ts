import { createHash } from "node:crypto";
import type { CreateProcessingBatch } from "@studiocar/contracts";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";

/**
 * Hashes every requested option in a stable key order, so a replay that
 * changes any option — the floor included — is recognised as a different
 * request rather than silently returning the original batch.
 */
export function createProcessingBatchRequestHash(
  command: CreateProcessingBatch,
): string {
  const canonicalRequest = JSON.stringify({
    assetIds: command.assetIds,
    options: Object.fromEntries(
      Object.entries(command.options).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    vehicleId: command.vehicleId,
  });
  return createHash(SHA_256_ALGORITHM)
    .update(canonicalRequest)
    .digest(HEX_ENCODING);
}
