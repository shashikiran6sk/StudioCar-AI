import { describe, expect, it } from "vitest";

import { validateEmailOutboxDispatcherOptions } from "../../../packages/email/src/validate-email-outbox-dispatcher-options";

const options = {
  applicationBaseUrl: "https://app.studiocar.example",
  batchSize: 20,
  claimTtlMilliseconds: 30_000,
  retryBaseMilliseconds: 1_000,
  retryMaximumMilliseconds: 60_000,
};

describe("validateEmailOutboxDispatcherOptions", () => {
  it("accepts bounded options", () => {
    expect(() => validateEmailOutboxDispatcherOptions(options)).not.toThrow();
  });

  it("rejects invalid URLs and retry bounds", () => {
    expect(() =>
      validateEmailOutboxDispatcherOptions({
        ...options,
        applicationBaseUrl: "not-a-url",
      }),
    ).toThrow();
    expect(() =>
      validateEmailOutboxDispatcherOptions({
        ...options,
        retryMaximumMilliseconds: 500,
      }),
    ).toThrow();
  });
});
