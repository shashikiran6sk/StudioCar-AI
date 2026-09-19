import type { ProcessingExecutionFailure } from "@studiocar/processing";

import {
  REMOVE_BG_AUTHORIZATION_MESSAGE,
  REMOVE_BG_INVALID_REQUEST_MESSAGE,
  REMOVE_BG_RATE_LIMIT_MESSAGE,
  REMOVE_BG_UNAVAILABLE_MESSAGE,
} from "./remove-bg-provider.constants";

export function toRemoveBgFailure(
  status: number,
  providerLatencyMilliseconds: number,
  providerRequestId: string | null,
): ProcessingExecutionFailure {
  if (status === 429) {
    return {
      errorMessage: REMOVE_BG_RATE_LIMIT_MESSAGE,
      kind: "PROVIDER_429",
      providerLatencyMilliseconds,
      providerRequestId,
    };
  }
  if (status >= 500) {
    return {
      errorMessage: REMOVE_BG_UNAVAILABLE_MESSAGE,
      kind: "PROVIDER_5XX",
      providerLatencyMilliseconds,
      providerRequestId,
    };
  }
  if (status === 401 || status === 402 || status === 403) {
    return {
      errorMessage: REMOVE_BG_AUTHORIZATION_MESSAGE,
      kind: "AUTHORIZATION",
      providerLatencyMilliseconds,
      providerRequestId,
    };
  }
  return {
    errorMessage: REMOVE_BG_INVALID_REQUEST_MESSAGE,
    kind: "INVALID_REQUEST",
    providerLatencyMilliseconds,
    providerRequestId,
  };
}
