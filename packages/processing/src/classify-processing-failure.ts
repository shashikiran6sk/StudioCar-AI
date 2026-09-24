import { PROCESSING_FAILURE_CODES } from "./processing-worker.constants";
import type {
  ProcessingFailureClassification,
  ProcessingFailureKind,
} from "./processing-worker.types";

export function classifyProcessingFailure(
  kind: ProcessingFailureKind,
): ProcessingFailureClassification {
  switch (kind) {
    case "NETWORK":
    case "PROVIDER_429":
    case "PROVIDER_5XX":
    case "TIMEOUT":
      return { errorCode: PROCESSING_FAILURE_CODES[kind], retryable: true };
    case "AUTHORIZATION":
    case "INTERNAL":
    case "INVALID_IMAGE":
    case "INVALID_REQUEST":
    case "NON_CAR_IMAGE":
    case "UNSUPPORTED_FORMAT":
      return { errorCode: PROCESSING_FAILURE_CODES[kind], retryable: false };
  }
}
