import { describe, expect, it } from "vitest";

import { calculateEmailOutboxRetryDelay } from "../../../packages/email/src/calculate-email-outbox-retry-delay";

describe("calculateEmailOutboxRetryDelay", () => {
  it("applies bounded exponential backoff with jitter", () => {
    expect(calculateEmailOutboxRetryDelay(1, 1_000, 60_000, 0)).toBe(500);
    expect(calculateEmailOutboxRetryDelay(4, 1_000, 60_000, 1)).toBe(8_000);
    expect(calculateEmailOutboxRetryDelay(20, 1_000, 60_000, 1)).toBe(
      60_000,
    );
  });

  it("rejects invalid attempts and random values", () => {
    expect(() => calculateEmailOutboxRetryDelay(0, 1_000, 60_000, 0)).toThrow();
    expect(() =>
      calculateEmailOutboxRetryDelay(1, 1_000, 60_000, 1.1),
    ).toThrow();
  });
});
