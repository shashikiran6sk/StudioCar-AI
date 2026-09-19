import {
  PROCESSING_WORKER_MAXIMUM_DURATION_MS,
  PROCESSING_WORKER_MINIMUM_DURATION_MS,
} from "./processing-worker.constants";
import type { ProcessingWorkerOptions } from "./processing-worker.types";

export function validateProcessingWorkerOptions(
  options: ProcessingWorkerOptions,
): void {
  const values = [
    options.claimTtlMilliseconds,
    options.retryBaseMilliseconds,
    options.retryMaximumMilliseconds,
  ];
  if (
    values.some(
      (value) =>
        !Number.isInteger(value) ||
        value < PROCESSING_WORKER_MINIMUM_DURATION_MS ||
        value > PROCESSING_WORKER_MAXIMUM_DURATION_MS,
    ) ||
    options.retryMaximumMilliseconds < options.retryBaseMilliseconds
  ) {
    throw new RangeError("Processing worker timing options are invalid.");
  }
}
