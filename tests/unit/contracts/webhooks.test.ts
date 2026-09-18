import { describe, expect, it } from "vitest";

import { WebhookSchema } from "../../../packages/contracts/src/webhooks";

describe("webhook contract", () => {
  it("requires a provider event identifier for idempotency", () => {
    expect(
      WebhookSchema.safeParse({
        provider: "FAL",
        externalId: "evt_123",
        eventType: "job.completed",
        payload: { result: "ready" },
      }).success,
    ).toBe(true);

    expect(
      WebhookSchema.safeParse({
        provider: "FAL",
        externalId: "",
        eventType: "job.completed",
        payload: {},
      }).success,
    ).toBe(false);
  });
});
