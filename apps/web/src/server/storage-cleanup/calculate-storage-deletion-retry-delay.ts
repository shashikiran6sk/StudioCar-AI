const FIRST_ATTEMPT_NUMBER = 1;
const EXPONENTIAL_BASE = 2;
const MINIMUM_JITTER_FACTOR = 0.5;
const JITTER_RANGE = 0.5;
const MINIMUM_RANDOM_VALUE = 0;
const MAXIMUM_RANDOM_VALUE = 1;

export function calculateStorageDeletionRetryDelay(
  attemptNumber: number,
  baseMilliseconds: number,
  maximumMilliseconds: number,
  randomValue: number,
): number {
  if (!Number.isInteger(attemptNumber) || attemptNumber < FIRST_ATTEMPT_NUMBER) {
    throw new RangeError("Attempt number must be a positive integer.");
  }
  if (
    !Number.isFinite(randomValue) ||
    randomValue < MINIMUM_RANDOM_VALUE ||
    randomValue > MAXIMUM_RANDOM_VALUE
  ) {
    throw new RangeError("Random value must be between zero and one.");
  }

  const exponentialDelay =
    baseMilliseconds *
    EXPONENTIAL_BASE ** (attemptNumber - FIRST_ATTEMPT_NUMBER);
  const boundedDelay = Math.min(exponentialDelay, maximumMilliseconds);
  const jitterFactor = MINIMUM_JITTER_FACTOR + randomValue * JITTER_RANGE;
  return Math.ceil(boundedDelay * jitterFactor);
}
