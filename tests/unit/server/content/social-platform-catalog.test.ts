import { describe, expect, it } from "vitest";

import { SOCIAL_PLATFORM_CATALOG } from "../../../../apps/web/src/server/content/social-platform-catalog";

describe("social platform catalog", () => {
  it("offers only platforms the footer knows how to render", () => {
    expect(SOCIAL_PLATFORM_CATALOG.map((entry) => entry.platform)).toEqual([
      "INSTAGRAM",
      "LINKEDIN",
      "X",
      "YOUTUBE",
      "FACEBOOK",
    ]);
  });

  it("gives every platform a distinct position and a label", () => {
    const orders = SOCIAL_PLATFORM_CATALOG.map((entry) => entry.displayOrder);
    expect(new Set(orders).size).toBe(orders.length);
    for (const entry of SOCIAL_PLATFORM_CATALOG) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("carries no address, because none is known until one is configured", () => {
    for (const entry of SOCIAL_PLATFORM_CATALOG) {
      expect(entry).not.toHaveProperty("url");
    }
  });
});
