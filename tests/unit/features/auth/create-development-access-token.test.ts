import { describe, expect, it } from "vitest";

import { createDevelopmentAccessToken } from "../../../../apps/web/src/features/auth/create-development-access-token";

describe("createDevelopmentAccessToken", () => {
  it("matches the shape the development driver accepts", () => {
    expect(createDevelopmentAccessToken("919876543210", "1234", "challenge-1")).toBe(
      "dev-otp:919876543210:1234:challenge-1",
    );
  });
});
