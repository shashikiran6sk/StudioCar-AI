import { describe, expect, it } from "vitest";

import { toProviderMsisdn } from "../../../../../apps/web/src/server/auth/phone/to-provider-msisdn";

describe("toProviderMsisdn", () => {
  it.each([
    ["+919876543210", "919876543210"],
    ["919876543210", "919876543210"],
    [" +91 ".trim() + "9876543210", "919876543210"],
    [919876543210, "919876543210"],
  ])("normalises %s", (value, expected) => {
    expect(toProviderMsisdn(value)).toBe(expected);
  });

  it.each([["", null], ["12345", null], ["not-a-number", null], [null, null], [undefined, null], [{}, null]])(
    "refuses %s",
    (value, expected) => {
      expect(toProviderMsisdn(value)).toBe(expected);
    },
  );

  it("refuses an identifier longer than any real MSISDN", () => {
    expect(toProviderMsisdn("1".repeat(16))).toBeNull();
  });
});
