import { describe, expect, it } from "vitest";

import { processingDispatchTokenIsValid } from "../../../../apps/web/src/server/jobs/processing-dispatch-token-is-valid";

const TOKEN = "processing-dispatch-token-at-least-32-characters";

describe("processingDispatchTokenIsValid", () => {
  it("accepts only the exact bearer token", () => {
    expect(
      processingDispatchTokenIsValid(
        new Request("https://app.example.test/api/internal/jobs/dispatch", {
          headers: { authorization: `Bearer ${TOKEN}` },
        }),
        TOKEN,
      ),
    ).toBe(true);
    expect(
      processingDispatchTokenIsValid(
        new Request("https://app.example.test/api/internal/jobs/dispatch", {
          headers: { authorization: "Bearer wrong-token" },
        }),
        TOKEN,
      ),
    ).toBe(false);
  });
});
