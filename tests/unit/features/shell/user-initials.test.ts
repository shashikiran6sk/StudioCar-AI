import { describe, expect, it } from "vitest";

import { userInitials } from "../../../../apps/web/src/features/shell/user-initials";

describe("userInitials", () => {
  it("uses at most two name parts", () => {
    expect(userInitials("priya anand sharma")).toBe("PA");
  });

  it("uses branded initials for an empty value", () => {
    expect(userInitials("   ")).toBe("SC");
  });
});
