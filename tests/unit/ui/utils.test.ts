import { describe, expect, it } from "vitest";

import { cx } from "../../../packages/ui/src/utils";

describe("cx", () => {
  it("joins only enabled class names", () => {
    expect(cx("base", false, undefined, "active", null)).toBe("base active");
  });
});

