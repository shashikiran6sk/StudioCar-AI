import { createHash } from "node:crypto";
import type { ProcessingOptions } from "@studiocar/contracts";

import { canonicalProcessingOptions } from "./canonical-processing-options";
import { createProcessingOptionsKey } from "./create-processing-options-key";

const SHA_256_ALGORITHM = "sha256";
const HEX_ENCODING = "hex";

/**
 * Identifies a studio version: a treatment, and the label its batches were
 * given. An unlabelled version keeps the treatment's own key, so versions
 * made before labels existed, and links to them, are unchanged.
 */
export function createStudioVersionKey(
  options: ProcessingOptions,
  label: string | null,
): string {
  if (label === null) return createProcessingOptionsKey(options);
  return createHash(SHA_256_ALGORITHM)
    .update(
      JSON.stringify({ label, options: canonicalProcessingOptions(options) }),
    )
    .digest(HEX_ENCODING);
}
