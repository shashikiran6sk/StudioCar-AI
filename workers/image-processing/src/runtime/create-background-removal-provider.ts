import type { ImageWorkerEnvironment } from "@studiocar/config";
import type { BackgroundRemovalProvider } from "@studiocar/processing";

import { RemoveBgProvider } from "../providers/remove-bg-provider";
import {
  BIREFNET_PROVIDER_NOT_IMPLEMENTED_MESSAGE,
  FAL_PROVIDER_NOT_IMPLEMENTED_MESSAGE,
  REMOVEBG_CREDENTIAL_MISSING_MESSAGE,
} from "./image-worker-runtime.constants";

export function createBackgroundRemovalProvider(
  environment: ImageWorkerEnvironment,
): BackgroundRemovalProvider {
  if (environment.BACKGROUND_REMOVAL_PROVIDER === "fal") {
    throw new Error(FAL_PROVIDER_NOT_IMPLEMENTED_MESSAGE);
  }
  if (environment.BACKGROUND_REMOVAL_PROVIDER === "birefnet") {
    throw new Error(BIREFNET_PROVIDER_NOT_IMPLEMENTED_MESSAGE);
  }
  if (!environment.REMOVEBG_API_KEY) {
    throw new Error(REMOVEBG_CREDENTIAL_MISSING_MESSAGE);
  }

  return new RemoveBgProvider({
    apiKey: environment.REMOVEBG_API_KEY,
    maximumOutputBytes: environment.MAX_PROVIDER_OUTPUT_BYTES,
    timeoutMilliseconds: environment.REMOVEBG_TIMEOUT_MS,
  });
}
