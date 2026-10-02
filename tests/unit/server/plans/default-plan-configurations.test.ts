import { describe, expect, it } from "vitest";

import { DEFAULT_PLAN_CONFIGURATIONS } from "../../../../apps/web/src/server/plans/default-plan-configurations";

function plan(planKey: string) {
  const found = DEFAULT_PLAN_CONFIGURATIONS.find(
    (configuration) => configuration.planKey === planKey,
  );
  if (!found) throw new Error(`Expected a ${planKey} plan.`);
  return found;
}

describe("default plan configurations", () => {
  it("states the free allowance the product promises", () => {
    expect(plan("FREE")).toMatchObject({
      includedImages: 15,
      maxImagesPerBatch: 5,
      allowanceScope: "LIFETIME",
      priceMinorUnits: 0,
    });
  });

  it("states the confirmed Studio Plus configuration", () => {
    expect(plan("STUDIO_PLUS")).toMatchObject({
      displayName: "Studio Plus",
      priceMinorUnits: 199_900,
      currency: "INR",
      billingInterval: "ONE_TIME",
      allowanceScope: "LIFETIME",
      includedImages: 100,
      maxImagesPerBatch: 20,
    });
  });

  it("ships exactly Free, Studio Plus and Studio Pro", () => {
    expect(
      DEFAULT_PLAN_CONFIGURATIONS.map((configuration) => configuration.planKey),
    ).toEqual(["FREE", "STUDIO_PLUS", "STUDIO_PRO"]);
  });

  it("refills a monthly plan and never refills a one-off allowance", () => {
    expect(plan("STUDIO_PRO").allowanceScope).toBe("BILLING_PERIOD");
    expect(plan("FREE").allowanceScope).toBe("LIFETIME");
    expect(plan("STUDIO_PLUS").allowanceScope).toBe("LIFETIME");
  });

  it("offers checkout for paid plans only", () => {
    expect(DEFAULT_PLAN_CONFIGURATIONS.map((configuration) => [configuration.planKey, configuration.purchasable])).toEqual([
      ["FREE", false],
      ["STUDIO_PLUS", true],
      ["STUDIO_PRO", true],
    ]);
  });

  it("keeps every plan within the limits the database enforces", () => {
    for (const configuration of DEFAULT_PLAN_CONFIGURATIONS) {
      expect(configuration.priceMinorUnits).toBeGreaterThanOrEqual(0);
      expect(configuration.includedImages).toBeGreaterThan(0);
      expect(configuration.maxImagesPerBatch).toBeGreaterThan(0);
      expect(configuration.maxImagesPerBatch).toBeLessThanOrEqual(
        configuration.includedImages,
      );
      expect(configuration.displayOrder).toBeGreaterThanOrEqual(0);
      expect(configuration.currency).toHaveLength(3);
    }
  });

  it("gives every plan a distinct key and position", () => {
    const keys = DEFAULT_PLAN_CONFIGURATIONS.map((plan) => plan.planKey);
    const orders = DEFAULT_PLAN_CONFIGURATIONS.map((plan) => plan.displayOrder);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
