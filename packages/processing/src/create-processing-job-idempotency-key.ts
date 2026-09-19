import { createHash } from "node:crypto";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";
const KEY_SEPARATOR = ":";

export function createProcessingJobIdempotencyKey(
  batchIdempotencyKey: string,
  assetId: string,
): string {
  return createHash(SHA_256_ALGORITHM)
    .update(`${batchIdempotencyKey}${KEY_SEPARATOR}${assetId}`)
    .digest(HEX_ENCODING);
}
