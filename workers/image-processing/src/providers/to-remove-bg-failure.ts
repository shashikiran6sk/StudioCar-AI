import { REMOVE_BG_PAYMENT_REQUIRED_MESSAGE } from "@studiocar/observability";
import type { ProcessingExecutionFailure } from "@studiocar/processing";

import {
  REMOVE_BG_AUTHORIZATION_MESSAGE,
  REMOVE_BG_INVALID_REQUEST_MESSAGE,
  REMOVE_BG_NON_CAR_IMAGE_MESSAGE,
  REMOVE_BG_RATE_LIMIT_MESSAGE,
  REMOVE_BG_UNKNOWN_FOREGROUND_CODE,
  REMOVE_BG_UNAVAILABLE_MESSAGE,
} from "./remove-bg-provider.constants";

export function toRemoveBgFailure(
  status: number,
  providerLatencyMilliseconds: number,
  providerRequestId: string | null,
  providerErrorCode: string | null,
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
  if (status === 402) {
    return {
      errorMessage: REMOVE_BG_PAYMENT_REQUIRED_MESSAGE,
      kind: "PAYMENT_REQUIRED",
      providerLatencyMilliseconds,
      providerRequestId,
    };
  }
  if (status === 401 || status === 403) {
    return {
      errorMessage: REMOVE_BG_AUTHORIZATION_MESSAGE,
      kind: "AUTHORIZATION",
      providerLatencyMilliseconds,
      providerRequestId,
    };
  }
  if (
    status === 400 &&
    providerErrorCode === REMOVE_BG_UNKNOWN_FOREGROUND_CODE
  ) {
    return {
      errorMessage: REMOVE_BG_NON_CAR_IMAGE_MESSAGE,
      kind: "NON_CAR_IMAGE",
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
