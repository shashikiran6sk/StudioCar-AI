import { describe, expect, it } from "vitest";

import { resendFailureIsRetryable } from "../../../../workers/email-delivery/src/resend-failure-is-retryable";

describe("resendFailureIsRetryable", () => {
  it.each([
    [408, undefined, true],
    [409, "concurrent_idempotent_requests", true],
    [409, "invalid_idempotent_request", false],
    [429, undefined, true],
    [500, undefined, true],
    [400, undefined, false],
  ])(
    "classifies HTTP %i with %s as retryable=%s",
    (status, errorName, expected) => {
      expect(resendFailureIsRetryable(status, errorName)).toBe(expected);
    },
  );
});
