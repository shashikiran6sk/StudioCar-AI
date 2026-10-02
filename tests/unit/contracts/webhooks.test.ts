import { describe, expect, it } from "vitest";

import { WebhookSchema } from "../../../packages/contracts/src/webhooks";

describe("webhook contract", () => {
  it("requires a provider event identifier for idempotency", () => {
    expect(
      WebhookSchema.safeParse({
        provider: "BILLING",
        externalId: "evt_123",
        eventType: "payment.captured",
        payload: { status: "captured" },
      }).success,
    ).toBe(true);

    expect(
      WebhookSchema.safeParse({
        provider: "BILLING",
        externalId: "",
        eventType: "payment.captured",
        payload: {},
      }).success,
    ).toBe(false);
  });

  it("accepts no webhook from an image-processing provider", () => {
    // Processing is synchronous inside the queue worker; no provider calls back.
    for (const provider of ["REMOVEBG", "FAL", "LEONARDO"]) {
      expect(
        WebhookSchema.safeParse({
          provider,
          externalId: "evt_123",
          eventType: "generation.complete",
          payload: {},
        }).success,
      ).toBe(false);
    }
  });
});
