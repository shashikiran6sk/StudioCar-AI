import { describe, expect, it } from "vitest";

import { createApiErrorResponse } from "../../../../apps/web/src/server/auth/create-api-error-response";

describe("createApiErrorResponse", () => {
  it("serializes the canonical envelope and optional retry delay", async () => {
    const response = createApiErrorResponse({
      status: 429,
      code: "RATE_LIMITED",
      message: "Try again later.",
      requestId: "request-1",
      retryAfterSeconds: 30,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Try again later.",
        requestId: "request-1",
      },
    });
  });
});
