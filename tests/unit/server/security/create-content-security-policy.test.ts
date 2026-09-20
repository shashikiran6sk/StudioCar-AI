import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "../../../../apps/web/src/server/security/create-content-security-policy";

describe("createContentSecurityPolicy", () => {
  it("keeps production scripts same-origin without eval and denies embedding", () => {
    const policy = createContentSecurityPolicy("production");

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("https://*.amazonaws.com");
  });

  it("permits eval only for the Next.js development runtime", () => {
    const policy = createContentSecurityPolicy("development");

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("ws: wss:");
  });
});
