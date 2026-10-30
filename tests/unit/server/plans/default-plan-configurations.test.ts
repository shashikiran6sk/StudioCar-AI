import { describe, expect, it } from "vitest";

import { DEFAULT_PLAN_CONFIGURATIONS } from "../../../../apps/web/src/server/plans/default-plan-configurations";
import { PLAN_PROCESSING_QUALITY_TIERS } from "../../../../packages/processing/src/processing-quality-tier.constants";

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
      priceMinorUnits: 149_900,
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

  it("advertises no purchasable plan while checkout is unimplemented", () => {
    // Offering a checkout that cannot complete would be a lie.
    expect(
      DEFAULT_PLAN_CONFIGURATIONS.every((configuration) => !configuration.purchasable),
    ).toBe(true);
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

  it("advertises no storage figure, because storage is not what a pack limits", () => {
    for (const configuration of DEFAULT_PLAN_CONFIGURATIONS) {
      expect(
        configuration.features.filter((feature) => /storage/i.test(feature)),
      ).toEqual([]);
    }
  });

  it("lists only what each plan delivers", () => {
    expect(plan("FREE").features).toEqual([
      "15 images in total",
      "Up to 5 images per batch",
      "Preview-resolution results",
    ]);
    expect(plan("STUDIO_PLUS").features).toEqual([
      "100 images in total",
      "Up to 20 images per batch",
      "High-resolution results",
    ]);
    expect(plan("STUDIO_PRO").features).toEqual([
      "500 images each month",
      "Up to 20 images per batch",
      "High-resolution results",
    ]);
  });

  it("advertises the output resolution the worker actually processes at", () => {
    const resolutionFeature = {
      HIGH: "High-resolution results",
      STANDARD: "Preview-resolution results",
    } as const;
    for (const [planKey, tier] of Object.entries(PLAN_PROCESSING_QUALITY_TIERS)) {
      expect(plan(planKey).features).toContain(resolutionFeature[tier]);
    }
  });

  it("names each plan's real allowance and batch size in its features", () => {
    for (const configuration of DEFAULT_PLAN_CONFIGURATIONS) {
      expect(configuration.features).toContain(
        `Up to ${String(configuration.maxImagesPerBatch)} images per batch`,
      );
      expect(configuration.features.join(" ")).toContain(
        String(configuration.includedImages),
      );
    }
  });

  it("sets no storage capacity, because storage is never enforced", () => {
    for (const configuration of DEFAULT_PLAN_CONFIGURATIONS) {
      expect(configuration.storageBytes).toBeNull();
    }
  });

  it("gives every plan a distinct key and position", () => {
    const keys = DEFAULT_PLAN_CONFIGURATIONS.map((plan) => plan.planKey);
    const orders = DEFAULT_PLAN_CONFIGURATIONS.map((plan) => plan.displayOrder);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
