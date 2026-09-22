import { describe, expect, it } from "vitest";

import { formatPlanCadence } from "../../../../apps/web/src/server/plans/format-plan-cadence";

describe("formatPlanCadence", () => {
  it("names each interval the way a plan card reads it", () => {
    expect(formatPlanCadence("NONE")).toBe("forever");
    expect(formatPlanCadence("ONE_TIME")).toBe("one-time");
    expect(formatPlanCadence("MONTHLY")).toBe("/ month");
  });
});
