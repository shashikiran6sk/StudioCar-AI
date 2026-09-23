import { describe, expect, it } from "vitest";

import { describeAttentionQuickAction } from "../../../../apps/web/src/features/dashboard/describe-attention-quick-action";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";

describe("describeAttentionQuickAction", () => {
  it("creates studio images when nothing needs attention", () => {
    expect(
      describeAttentionQuickAction({ vehicleCount: 0, vehicleId: null }),
    ).toMatchObject({
      cta: "Create images",
      description: "Create another studio version from an existing vehicle.",
      href: "/inventory?mode=CREATE_STUDIO",
      statusLabel: null,
      title: "Create studio images",
    });
  });

  it("goes straight to the one affected vehicle", () => {
    expect(
      describeAttentionQuickAction({ vehicleCount: 1, vehicleId: VEHICLE_ID }),
    ).toMatchObject({
      cta: "Review issues",
      description: "1 vehicle needs your attention.",
      href: `/inventory/${VEHICLE_ID}#attention`,
      statusLabel: "1 need attention",
      title: "Attention needed",
    });
  });

  it("filters Inventory when several vehicles are affected", () => {
    expect(
      describeAttentionQuickAction({ vehicleCount: 4, vehicleId: null }),
    ).toMatchObject({
      description: "4 vehicles need your attention.",
      href: "/inventory?filter=NEEDS_ATTENTION",
      statusLabel: "4 need attention",
    });
  });

  it("never links to a vehicle it was not told about", () => {
    expect(
      describeAttentionQuickAction({ vehicleCount: 1, vehicleId: null }).href,
    ).toBe("/inventory?filter=NEEDS_ATTENTION");
  });
});
