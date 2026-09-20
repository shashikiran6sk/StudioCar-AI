import { describe, expect, it } from "vitest";

import { safeBigIntToNumber } from "../../../../apps/web/src/server/dashboard/safe-bigint-to-number";

describe("safeBigIntToNumber", () => {
  it("preserves safe byte counts", () => {
    expect(safeBigIntToNumber(1_024n)).toBe(1_024);
  });

  it("caps byte counts beyond JavaScript safe integer precision", () => {
    expect(safeBigIntToNumber(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });
});
