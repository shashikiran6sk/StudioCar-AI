import { describe, expect, it } from "vitest";

import { SensitiveIdentifierHasher } from "../../../../apps/web/src/server/auth/hash-sensitive-identifier";

const secret = "s".repeat(32);

describe("SensitiveIdentifierHasher", () => {
  it("creates deterministic keyed hashes without exposing the identifier", () => {
    const hasher = new SensitiveIdentifierHasher(secret);
    const hash = hasher.hash("phone:+919876543210");

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hasher.hash("phone:+919876543210"));
    expect(hash).not.toContain("9876543210");
  });

  it("rejects weak keys", () => {
    expect(() => new SensitiveIdentifierHasher("short")).toThrow(RangeError);
  });
});
