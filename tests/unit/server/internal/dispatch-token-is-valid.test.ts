import { describe, expect, it } from "vitest";

import { dispatchTokenIsValid } from "../../../../apps/web/src/server/internal/dispatch-token-is-valid";

const TOKEN = "internal-dispatch-token-at-least-32-characters";

describe("dispatchTokenIsValid", () => {
  it("accepts only the exact bearer token", () => {
    expect(
      dispatchTokenIsValid(
        new Request("https://app.example.test/api/internal/jobs/dispatch", {
          headers: { authorization: `Bearer ${TOKEN}` },
        }),
        TOKEN,
      ),
    ).toBe(true);
    expect(
      dispatchTokenIsValid(
        new Request("https://app.example.test/api/internal/email/dispatch", {
          headers: { authorization: "Bearer wrong-token" },
        }),
        TOKEN,
      ),
    ).toBe(false);
  });
});
