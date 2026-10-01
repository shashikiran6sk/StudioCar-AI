import { describe, expect, it } from "vitest";

import { APP_NAVIGATION_ITEMS } from "../../../../apps/web/src/features/shell/app-navigation.constants";
import { findActiveNavigationItem } from "../../../../apps/web/src/features/shell/find-active-navigation-item";

describe("findActiveNavigationItem", () => {
  it("finds the destination for the current page", () => {
    expect(
      findActiveNavigationItem("/settings/billing", APP_NAVIGATION_ITEMS)?.label,
    ).toBe("Packs & Billing");
  });

  it("keeps inventory current inside a vehicle portfolio", () => {
    expect(
      findActiveNavigationItem("/inventory/vehicle-1", APP_NAVIGATION_ITEMS)?.label,
    ).toBe("Inventory");
  });

  it("finds nothing outside the listed destinations", () => {
    expect(findActiveNavigationItem("/admin", APP_NAVIGATION_ITEMS)).toBeUndefined();
    expect(findActiveNavigationItem(null, APP_NAVIGATION_ITEMS)).toBeUndefined();
  });
});
