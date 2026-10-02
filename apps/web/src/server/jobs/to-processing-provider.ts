import { ProcessingProvider } from "@studiocar/database-runtime";
import type { ProcessingProviderKey } from "@studiocar/processing";

/**
 * The stored provider value for a processing provider. The column keeps the
 * values of retired providers for history; only the active one is written.
 */
export function toProcessingProvider(
  provider: ProcessingProviderKey,
): ProcessingProvider {
  return ProcessingProvider[provider];
}
