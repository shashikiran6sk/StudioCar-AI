import { describe, expect, it } from "vitest";

import { getAuthReturnPath } from "../../../../apps/web/src/features/auth/get-auth-return-path";

describe("getAuthReturnPath", () => {
  it("keeps safe application-relative paths", () => {
    expect(getAuthReturnPath("/inventory?status=ready")).toBe(
      "/inventory?status=ready",
    );
  });

  it("uses the dashboard for external, missing, and repeated values", () => {
    expect(getAuthReturnPath("//attacker.test")).toBe("/dashboard");
    expect(getAuthReturnPath(undefined)).toBe("/dashboard");
    expect(getAuthReturnPath(["/dashboard", "//attacker.test"])).toBe(
      "/dashboard",
    );
  });
});
