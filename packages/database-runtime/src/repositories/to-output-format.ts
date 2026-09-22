import type { ProcessingOutput } from "@studiocar/processing";

import { OutputFormat } from "../../generated/prisma/client";

export function toOutputFormat(
  outputFormat: ProcessingOutput["outputFormat"],
): OutputFormat {
  switch (outputFormat) {
    case "JPEG":
      return OutputFormat.JPEG;
    case "PNG":
      return OutputFormat.PNG;
    case "WEBP":
      return OutputFormat.WEBP;
  }
}
