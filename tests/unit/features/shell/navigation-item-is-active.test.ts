import { describe, expect, it } from "vitest";

import { navigationItemIsActive } from "../../../../apps/web/src/features/shell/navigation-item-is-active";

describe("navigationItemIsActive", () => {
  it("matches the destination itself", () => {
    expect(navigationItemIsActive("/inventory", "/inventory")).toBe(true);
  });

  it("matches a page nested under the destination", () => {
    expect(navigationItemIsActive("/inventory/vehicle-1", "/inventory")).toBe(
      true,
    );
  });

  it("does not match a sibling whose path merely shares a prefix", () => {
    expect(navigationItemIsActive("/inventory-archive", "/inventory")).toBe(
      false,
    );
  });

  it("does not match an unrelated destination", () => {
    expect(navigationItemIsActive("/dashboard", "/inventory")).toBe(false);
  });

  it("treats an unknown pathname as no destination being current", () => {
    expect(navigationItemIsActive(null, "/inventory")).toBe(false);
  });
});
