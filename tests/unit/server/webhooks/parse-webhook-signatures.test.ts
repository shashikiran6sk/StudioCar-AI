import { describe, expect, it } from "vitest";

import { parseWebhookSignatures } from "../../../../apps/web/src/server/webhooks/parse-webhook-signatures";

describe("parseWebhookSignatures", () => {
  it("selects bounded prefixed candidates from a rotation header", () => {
    expect(
      parseWebhookSignatures("v0=ignored, v1=first, v1=second", "v1="),
    ).toEqual(["first", "second"]);
    expect(parseWebhookSignatures("x".repeat(4_097), "v1=")).toEqual([]);
  });
});
