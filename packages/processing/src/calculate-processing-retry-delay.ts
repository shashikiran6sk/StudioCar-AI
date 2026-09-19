import {
  PROCESSING_WORKER_MAXIMUM_DURATION_MS,
  PROCESSING_WORKER_MINIMUM_DURATION_MS,
} from "./processing-worker.constants";

export function calculateProcessingRetryDelay(
  attemptNumber: number,
  baseMilliseconds: number,
  maximumMilliseconds: number,
  randomValue: number,
): number {
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new RangeError("Processing attempt number must be a positive integer.");
  }
  if (
    !Number.isInteger(baseMilliseconds) ||
    baseMilliseconds < PROCESSING_WORKER_MINIMUM_DURATION_MS ||
    baseMilliseconds > PROCESSING_WORKER_MAXIMUM_DURATION_MS
  ) {
    throw new RangeError("Processing retry base is outside the allowed range.");
  }
  if (
    !Number.isInteger(maximumMilliseconds) ||
    maximumMilliseconds < baseMilliseconds ||
    maximumMilliseconds > PROCESSING_WORKER_MAXIMUM_DURATION_MS
  ) {
    throw new RangeError("Processing retry maximum is outside the allowed range.");
  }
  if (randomValue < 0 || randomValue > 1) {
    throw new RangeError("Processing retry jitter must be between zero and one.");
  }

  const exponential = Math.min(
    maximumMilliseconds,
    baseMilliseconds * 2 ** (attemptNumber - 1),
  );
  const jitterMultiplier = 0.5 + randomValue * 0.5;
  return Math.round(exponential * jitterMultiplier);
}
