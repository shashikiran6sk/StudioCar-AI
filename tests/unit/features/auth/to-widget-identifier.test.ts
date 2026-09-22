import { describe, expect, it } from "vitest";

import { toWidgetIdentifier } from "../../../../apps/web/src/features/auth/to-widget-identifier";

describe("toWidgetIdentifier", () => {
  it("reduces an E.164 number to the digits the widget expects", () => {
    expect(toWidgetIdentifier("+919876543210")).toBe("919876543210");
  });

  it("removes separators a person may have typed", () => {
    expect(toWidgetIdentifier("+91 98765-43210")).toBe("919876543210");
  });
});
