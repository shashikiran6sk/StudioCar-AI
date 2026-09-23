/**
 * Job states that end without a processed image and wait for the user.
 *
 * `FAILED` is only ever written once automatic retries are exhausted or the
 * failure cannot be retried; a transient failure is `RETRYING` instead. A job
 * in any other state is either still being worked on or finished successfully.
 */
export const USER_ATTENTION_JOB_STATES = ["FAILED", "CANCELLED"] as const;
