import { describe, expect, it } from "vitest";

import {
  ADMIN_NAVIGATION_ITEM,
  APP_NAVIGATION_ITEMS,
} from "../../../../apps/web/src/features/shell/app-navigation.constants";
import { workspaceNavigationItems } from "../../../../apps/web/src/features/shell/workspace-navigation-items";

describe("workspaceNavigationItems", () => {
  it("offers every workspace destination to a member", () => {
    expect(workspaceNavigationItems(false)).toEqual(APP_NAVIGATION_ITEMS);
  });

  it("adds administration last for an administrator", () => {
    expect(workspaceNavigationItems(true)).toEqual([
      ...APP_NAVIGATION_ITEMS,
      ADMIN_NAVIGATION_ITEM,
    ]);
  });
});
