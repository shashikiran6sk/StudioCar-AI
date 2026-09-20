import { describe, expect, it } from "vitest";

import { createSecurityHeaders } from "../../../../apps/web/src/server/security/create-security-headers";

describe("createSecurityHeaders", () => {
  it("returns the complete browser hardening policy", () => {
    const headers = new Headers();
    for (const header of createSecurityHeaders("production")) {
      headers.set(header.key, header.value);
    }

    expect(headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(headers.get("strict-transport-security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("permissions-policy")).toContain("payment=()");
    expect(headers.get("cross-origin-opener-policy")).toBe("same-origin");
  });
});
