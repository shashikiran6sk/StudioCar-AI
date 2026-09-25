import { describe, expect, it } from "vitest";

import { formatPlanPrice } from "../../../../apps/web/src/server/plans/format-plan-price";

describe("formatPlanPrice", () => {
  it("renders stored paise as rupees", () => {
    expect(formatPlanPrice(799_900, "INR")).toBe("₹7,999");
    expect(formatPlanPrice(199_900, "INR")).toBe("₹1,999");
  });

  it("renders a free plan as zero rather than as nothing", () => {
    expect(formatPlanPrice(0, "INR")).toBe("₹0");
  });

  it("groups large amounts in the Indian convention", () => {
    expect(formatPlanPrice(10_000_000, "INR")).toBe("₹1,00,000");
  });
});
