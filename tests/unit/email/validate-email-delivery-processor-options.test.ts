import { describe, expect, it } from "vitest";

import { validateEmailDeliveryProcessorOptions } from "../../../packages/email/src/validate-email-delivery-processor-options";

describe("validateEmailDeliveryProcessorOptions", () => {
  it("requires a valid application URL and bounded lease", () => {
    expect(() =>
      validateEmailDeliveryProcessorOptions({
        applicationBaseUrl: "https://app.studiocar.example",
        claimTtlMilliseconds: 60_000,
      }),
    ).not.toThrow();
    expect(() =>
      validateEmailDeliveryProcessorOptions({
        applicationBaseUrl: "invalid",
        claimTtlMilliseconds: 60_000,
      }),
    ).toThrow();
    expect(() =>
      validateEmailDeliveryProcessorOptions({
        applicationBaseUrl: "https://app.studiocar.example",
        claimTtlMilliseconds: 500,
      }),
    ).toThrow();
  });
});
