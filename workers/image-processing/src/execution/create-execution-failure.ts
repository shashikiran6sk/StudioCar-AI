import type { ProcessingExecutionFailure } from "@studiocar/processing";

export interface ProviderAttribution {
  providerLatencyMilliseconds: number | null;
  providerRequestId: string | null;
}

const NO_PROVIDER: ProviderAttribution = {
  providerLatencyMilliseconds: null,
  providerRequestId: null,
};

/**
 * A classified execution failure, attributed to the provider exchange that
 * preceded it when there was one.
 */
export function createExecutionFailure(
  stage: ProcessingExecutionFailure["stage"],
  kind: ProcessingExecutionFailure["kind"],
  errorMessage: string,
  provider: ProviderAttribution = NO_PROVIDER,
): ProcessingExecutionFailure {
  return {
    errorMessage,
    kind,
    providerLatencyMilliseconds: provider.providerLatencyMilliseconds,
    providerRequestId: provider.providerRequestId,
    retryAfterMilliseconds: null,
    stage,
  };
}
