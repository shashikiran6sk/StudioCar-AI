import { describe, expect, it } from "vitest";

import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";

describe("calculateSha256", () => {
  it("returns the lowercase hexadecimal SHA-256 digest", () => {
    expect(calculateSha256(new TextEncoder().encode("StudioCar"))).toBe(
      "71fc6d97cf00d19af15f6810d46c48be2766b88c4f8001178ee8c0f4d2957947",
    );
  });
});
