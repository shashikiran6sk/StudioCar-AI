import type { ImageWorkerEnvironment } from "@studiocar/config";
import type { ImageProcessingProvider } from "@studiocar/processing";

import { LeonardoProvider } from "../providers/leonardo-provider";
import type { SourceImageUrlResolver } from "../providers/leonardo-provider.types";

/**
 * The worker's one image-processing provider. The rest of the worker sees
 * only the `ImageProcessingProvider` port.
 */
export function createImageProcessingProvider(
  environment: ImageWorkerEnvironment,
  resolveSourceUrl: SourceImageUrlResolver,
): ImageProcessingProvider {
  return new LeonardoProvider(
    {
      apiKey: environment.LEONARDO_API_KEY,
      maximumOutputBytes: environment.MAX_PROVIDER_OUTPUT_BYTES,
      maximumPixels: environment.MAX_WORKER_IMAGE_PIXELS,
      timeoutMilliseconds: environment.LEONARDO_TIMEOUT_MS,
    },
    resolveSourceUrl,
  );
}
