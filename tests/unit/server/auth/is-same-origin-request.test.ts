import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "../../../../apps/web/src/server/auth/is-same-origin-request";

describe("isSameOriginRequest", () => {
  it("accepts the public browser Host behind an HTTPS tunnel", () => {
    expect(isSameOriginRequest(new Request("http://localhost:3000/api/billing/orders", {
      method: "POST",
      headers: { origin: "https://studiocar-local.trycloudflare.com", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
    }))).toBe(true);
  });

  it.each([
    { origin: "https://attacker.example", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https", "x-forwarded-host": "attacker.example" },
    { origin: "https://attacker.example", "x-forwarded-proto": "https", "x-forwarded-host": "attacker.example" },
    { origin: "http://studiocar-local.trycloudflare.com", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
    { origin: "https://studiocar-local.trycloudflare.com:444", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
    { origin: "https://studiocar-local.trycloudflare.com", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https,http" },
    { origin: "https://studiocar-local.trycloudflare.com", host: "user@studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
    { origin: "https://studiocar-local.trycloudflare.com", host: "studiocar-local.trycloudflare.com/path", "x-forwarded-proto": "https" },
    { origin: "https://studiocar-local.trycloudflare.com/path", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
    { origin: "null", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
  ])("rejects mismatched or malformed proxy origins %#", (headers) => {
    expect(isSameOriginRequest(new Request("http://localhost:3000/api/billing/orders", {
      method: "POST", headers,
    }))).toBe(false);
  });

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
