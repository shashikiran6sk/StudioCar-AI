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

  it("allows the local storage origin for uploads and previews when given one", () => {
    const policy = createContentSecurityPolicy("production", "http://localhost:9000");

    expect(policy).toMatch(/img-src [^;]*http:\/\/localhost:9000/);
    expect(policy).toMatch(/connect-src [^;]*http:\/\/localhost:9000/);
    expect(policy).not.toMatch(/script-src [^;]*localhost:9000/);
  });

  it("adds no storage origin beyond AWS when none is given", () => {
    expect(createContentSecurityPolicy("production")).not.toContain("localhost");
  });
});
