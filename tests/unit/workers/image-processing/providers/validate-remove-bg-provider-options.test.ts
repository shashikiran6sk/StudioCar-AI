import { describe, expect, it } from "vitest";

import { validateRemoveBgProviderOptions } from "../../../../../workers/image-processing/src/providers/validate-remove-bg-provider-options";

describe("validateRemoveBgProviderOptions", () => {
  it("accepts bounded provider options", () => {
    expect(() =>
      validateRemoveBgProviderOptions({
        apiKey: "server-key",
        maximumOutputBytes: 50 * 1024 * 1024,
        timeoutMilliseconds: 60_000,
      }),
    ).not.toThrow();
  });

  it("rejects empty credentials and unsafe limits", () => {
    expect(() =>
      validateRemoveBgProviderOptions({
        apiKey: " ",
        maximumOutputBytes: 0,
        timeoutMilliseconds: 1,
      }),
    ).toThrow(RangeError);
  });
});
