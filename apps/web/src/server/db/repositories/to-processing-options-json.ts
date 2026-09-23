import type { ProcessingOptions } from "@studiocar/contracts";

import type { Prisma } from "@studiocar/database-runtime";

/**
 * Stores every validated option. Listing fields by hand once dropped the
 * floor, so every turntable job was rendered on the standard floor; copying
 * the validated object keeps the stored job identical to what was requested.
 */
export function toProcessingOptionsJson(
  options: ProcessingOptions,
): Prisma.InputJsonObject {
  return { ...options };
}
