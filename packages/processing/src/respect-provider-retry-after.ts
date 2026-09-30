/**
 * The durable retry delay after a provider asked callers to wait: never sooner
 * than the provider's own hint, never later than the configured maximum. The
 * provider's hint only ever lengthens the backoff the worker already chose.
 */
export function respectProviderRetryAfter(
  backoffMilliseconds: number,
  retryAfterMilliseconds: number | null,
  maximumMilliseconds: number,
): number {
  if (
    retryAfterMilliseconds === null ||
    !Number.isFinite(retryAfterMilliseconds) ||
    retryAfterMilliseconds <= backoffMilliseconds
  ) {
    return backoffMilliseconds;
  }
  return Math.max(
    backoffMilliseconds,
    Math.min(maximumMilliseconds, Math.ceil(retryAfterMilliseconds)),
  );
}
