import { describe, expect, it } from "vitest";

import {
  PLAN_FEATURE_MAX_COUNT,
  PlanCatalogEntrySchema,
  PlanConfigurationUpdateSchema,
} from "../../../packages/contracts/src/plans";

const entry = {
  active: true,
  allowanceScope: "BILLING_PERIOD",
  billingInterval: "MONTHLY",
  currency: "INR",
  description: "For marketplaces and large dealer groups.",
  displayName: "Studio Plus",
  displayOrder: 3,
  featured: false,
  features: ["1,500 images each month"],
  includedImages: 1_500,
  maxImagesPerBatch: 20,
  planKey: "STUDIO_PLUS",
  priceMinorUnits: 799_900,
  purchasable: false,
  segment: "Scale",
  storageBytes: null,
};

const update = {
  active: entry.active,
  billingInterval: entry.billingInterval,
  description: entry.description,
  displayName: entry.displayName,
  displayOrder: entry.displayOrder,
  featured: entry.featured,
  features: entry.features,
  includedImages: entry.includedImages,
  maxImagesPerBatch: entry.maxImagesPerBatch,
  priceMinorUnits: entry.priceMinorUnits,
  purchasable: entry.purchasable,
  segment: entry.segment,
  storageBytes: entry.storageBytes,
};

describe("PlanCatalogEntrySchema", () => {
  it("accepts a fully configured plan", () => {
    expect(PlanCatalogEntrySchema.parse(entry)).toMatchObject({
      planKey: "STUDIO_PLUS",
      priceMinorUnits: 799_900,
    });
  });

  it("rejects a price that is not a whole number of minor units", () => {
    expect(PlanCatalogEntrySchema.safeParse({ ...entry, priceMinorUnits: 1.5 })
      .success).toBe(false);
  });

  it("rejects an allowance of no images", () => {
    expect(
      PlanCatalogEntrySchema.safeParse({ ...entry, includedImages: 0 }).success,
    ).toBe(false);
  });

  it("rejects storage of zero bytes, which is not the same as unlimited", () => {
    expect(
      PlanCatalogEntrySchema.safeParse({ ...entry, storageBytes: 0 }).success,
    ).toBe(false);
  });

  it("rejects an unknown field rather than silently dropping it", () => {
    expect(
      PlanCatalogEntrySchema.safeParse({ ...entry, providerPriceId: "price_1" })
        .success,
    ).toBe(false);
  });

  it("caps the feature list so a plan card cannot be flooded", () => {
    const features = Array.from(
      { length: PLAN_FEATURE_MAX_COUNT + 1 },
      (_value, index) => `Feature ${String(index)}`,
    );

    expect(PlanCatalogEntrySchema.safeParse({ ...entry, features }).success).toBe(
      false,
    );
  });
});

describe("PlanConfigurationUpdateSchema", () => {
  it("accepts an edit to everything an administrator may change", () => {
    expect(PlanConfigurationUpdateSchema.parse(update)).toMatchObject({
      includedImages: 1_500,
    });
  });

  it("refuses a batch larger than the plan's whole allowance", () => {
    const result = PlanConfigurationUpdateSchema.safeParse({
      ...update,
      includedImages: 10,
      maxImagesPerBatch: 20,
    });

    expect(result.success).toBe(false);
  });

  it("refuses to change how an allowance is counted", () => {
    // The scope would reinterpret usage that has already been charged.
    expect(
      PlanConfigurationUpdateSchema.safeParse({
        ...update,
        allowanceScope: "LIFETIME",
      }).success,
    ).toBe(false);
  });

  it("refuses to change the key that subscriptions are stored against", () => {
    expect(
      PlanConfigurationUpdateSchema.safeParse({
        ...update,
        planKey: "STUDIO_INFINITE",
      }).success,
    ).toBe(false);
  });
});
