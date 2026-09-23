import { createHash } from "node:crypto";
import type { ProcessingOptions } from "@studiocar/contracts";

import { canonicalProcessingOptions } from "./canonical-processing-options";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";

/**
 * Identifies a studio treatment. Every completed output made with the same
 * treatment belongs to the same studio version of a vehicle, however many
 * batches produced it.
 */
export function createProcessingOptionsKey(options: ProcessingOptions): string {
  return createHash(SHA_256_ALGORITHM)
    .update(JSON.stringify(canonicalProcessingOptions(options)))
    .digest(HEX_ENCODING);
}
