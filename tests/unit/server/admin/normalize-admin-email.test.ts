import { describe, expect, it } from "vitest";

import { normalizeAdminEmail } from "../../../../apps/web/src/server/admin/normalize-admin-email";

describe("normalizeAdminEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeAdminEmail("  Owner@Example.COM  ")).toBe(
      "owner@example.com",
    );
  });

  it("does not fold Gmail dots or plus aliases", () => {
    // Folding them would let one configured value match addresses its owner
    // never chose.
    expect(normalizeAdminEmail("a.b@gmail.com")).toBe("a.b@gmail.com");
    expect(normalizeAdminEmail("owner+admin@gmail.com")).toBe(
      "owner+admin@gmail.com",
    );
  });
});
