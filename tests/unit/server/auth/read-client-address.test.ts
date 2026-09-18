import { describe, expect, it } from "vitest";

import { readClientAddress } from "../../../../apps/web/src/server/auth/read-client-address";

describe("readClientAddress", () => {
  it("prefers Vercel's forwarding header and selects the first address", () => {
    const request = new Request("https://app.studiocar.test", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1",
        "x-forwarded-for": "198.51.100.1",
      },
    });

    expect(readClientAddress(request)).toBe("203.0.113.10");
  });

  it("uses a stable fallback when no proxy address is available", () => {
    expect(readClientAddress(new Request("https://app.studiocar.test"))).toBe(
      "unknown",
    );
  });
});
