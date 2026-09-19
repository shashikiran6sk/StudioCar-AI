import { describe, expect, it } from "vitest";

import { hashFileSha256 } from "../../../../apps/web/src/features/vehicle-create/hash-file-sha256";

describe("hashFileSha256", () => {
  it("returns the lowercase SHA-256 digest of the exact file bytes", async () => {
    const file = new File(["hello"], "hello.txt");

    await expect(hashFileSha256(file)).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});
