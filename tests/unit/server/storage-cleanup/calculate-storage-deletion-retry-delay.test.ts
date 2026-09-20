import { describe, expect, it } from "vitest";

import { calculateStorageDeletionRetryDelay } from "../../../../apps/web/src/server/storage-cleanup/calculate-storage-deletion-retry-delay";

describe("calculateStorageDeletionRetryDelay", () => {
  it("applies bounded exponential backoff with jitter", () => {
    expect(calculateStorageDeletionRetryDelay(1, 1_000, 10_000, 0)).toBe(500);
    expect(calculateStorageDeletionRetryDelay(3, 1_000, 10_000, 1)).toBe(
      4_000,
    );
    expect(calculateStorageDeletionRetryDelay(10, 1_000, 10_000, 1)).toBe(
      10_000,
    );
  });

  it("rejects invalid attempts and random values", () => {
    expect(() =>
      calculateStorageDeletionRetryDelay(0, 1_000, 10_000, 0.5),
    ).toThrow(RangeError);
    expect(() =>
      calculateStorageDeletionRetryDelay(1, 1_000, 10_000, 2),
    ).toThrow(RangeError);
  });
});
