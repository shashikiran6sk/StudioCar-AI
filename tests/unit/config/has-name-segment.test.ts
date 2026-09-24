import { describe, expect, it } from "vitest";

import { hasNameSegment } from "../../../packages/config/src/has-name-segment";

describe("hasNameSegment", () => {
  it.each([
    ["studiocar-prod-images", true],
    ["studiocar.production.assets", true],
    ["PROD_studiocar", true],
    ["studiocar-product-images", false],
    ["studiocar-images", false],
  ])("finds prod in %s: %s", (name, expected) => {
    expect(hasNameSegment(name, ["prod", "production"])).toBe(expected);
  });
});
