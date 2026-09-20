import { describe, expect, it } from "vitest";

import { parseWebhookTimestamp } from "../../../../apps/web/src/server/webhooks/parse-webhook-timestamp";

describe("parseWebhookTimestamp", () => {
  it("accepts safe Unix seconds and rejects ambiguous timestamp text", () => {
    expect(parseWebhookTimestamp("1789905600")).toBe(1_789_905_600);
    expect(parseWebhookTimestamp("1789905600.5")).toBeNull();
    expect(parseWebhookTimestamp("-1789905600")).toBeNull();
    expect(parseWebhookTimestamp("9999999999999999")).toBeNull();
  });
});
