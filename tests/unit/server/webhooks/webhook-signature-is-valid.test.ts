import { describe, expect, it } from "vitest";

import { webhookSignatureIsValid } from "../../../../apps/web/src/server/webhooks/webhook-signature-is-valid";

describe("webhookSignatureIsValid", () => {
  it("compares only canonical SHA-256 hexadecimal digests", () => {
    const digest = "a".repeat(64);
    expect(webhookSignatureIsValid(digest, digest)).toBe(true);
    expect(webhookSignatureIsValid("not-hex", digest)).toBe(false);
    expect(webhookSignatureIsValid("b".repeat(64), digest)).toBe(false);
  });
});
