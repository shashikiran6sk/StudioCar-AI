import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "../../../../apps/web/src/server/auth/is-same-origin-request";

describe("isSameOriginRequest", () => {
  it("accepts only a matching, valid Origin header", () => {
    expect(
      isSameOriginRequest(
        new Request("https://app.studiocar.test/api/auth/phone/start", {
          headers: { origin: "https://app.studiocar.test" },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOriginRequest(
        new Request("https://app.studiocar.test/api/auth/phone/start", {
          headers: { origin: "https://attacker.test" },
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        new Request("https://app.studiocar.test/api/auth/phone/start"),
      ),
    ).toBe(false);
  });
});
