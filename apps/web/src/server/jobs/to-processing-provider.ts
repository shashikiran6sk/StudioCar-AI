import type { BackgroundRemovalProvider } from "@studiocar/config";
import { ProcessingProvider } from "@studiocar/database";

export function toProcessingProvider(
  provider: BackgroundRemovalProvider,
): ProcessingProvider {
  switch (provider) {
    case "removebg":
      return ProcessingProvider.REMOVEBG;
    case "fal":
      return ProcessingProvider.FAL;
    case "birefnet":
      return ProcessingProvider.BIREFNET;
  }
}
