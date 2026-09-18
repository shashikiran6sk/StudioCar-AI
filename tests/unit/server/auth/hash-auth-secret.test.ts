import { describe, expect, it } from "vitest";

import { hashAuthSecret } from "../../../../apps/web/src/server/auth/hash-auth-secret";

describe("hashAuthSecret", () => {
  it("returns a stable SHA-256 digest without retaining the source value", () => {
    const source = "oauth-state-value";
    const digest = hashAuthSecret(source);

    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).toBe(hashAuthSecret(source));
    expect(digest).not.toContain(source);
  });
});
