import type { ProcessingOutput } from "@studiocar/processing";

import { OutputFormat } from "../../generated/prisma/client";

/**
 * Every processed image is WebP. The column keeps JPEG and PNG for outputs
 * made before that, which stay readable as history.
 */
export function toOutputFormat(
  outputFormat: ProcessingOutput["outputFormat"],
): OutputFormat {
  return OutputFormat[outputFormat];
}
