import { describe, expect, it } from "vitest";

import {
  ApiErrorSchema,
  IdempotencyKeySchema,
} from "../../../packages/contracts/src/api";

describe("API contracts", () => {
  it("uses a stable error envelope", () => {
    expect(
      ApiErrorSchema.safeParse({
        error: {
          code: "NOT_FOUND",
          message: "Vehicle not found.",
          requestId: "request-12345",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects short or unsafe idempotency keys", () => {
    expect(IdempotencyKeySchema.safeParse("short").success).toBe(false);
    expect(
      IdempotencyKeySchema.safeParse("upload:4f9d4891-157f-49ed").success,
    ).toBe(true);
  });
});
