import { describe, expect, it } from "vitest";

import type { PlanConfigRecord } from "../../../../apps/web/src/server/db/repositories/plan-config-repository";
import { toPlanCatalogEntry } from "../../../../apps/web/src/server/plans/to-plan-catalog-entry";

const record: PlanConfigRecord = {
  active: true,
  allowanceScope: "BILLING_PERIOD",
  billingInterval: "MONTHLY",
  currency: "INR",
  description: "For teams.",
  displayName: "Studio Pro",
  displayOrder: 2,
  featured: false,
  features: ["500 images each month"],
  includedImages: 500,
  maxImagesPerBatch: 20,
  planKey: "STUDIO_PRO",
  priceMinorUnits: 399_900,
  providerPriceId: "price_secret_reference",
  purchasable: false,
  segment: "Teams",
  storageBytes: 3_221_225_472n,
};

describe("toPlanCatalogEntry", () => {
  it("converts stored storage bytes into a number the UI can use", () => {
    expect(toPlanCatalogEntry(record).storageBytes).toBe(3_221_225_472);
  });

  it("keeps an unlimited storage allowance null rather than zero", () => {
    expect(toPlanCatalogEntry({ ...record, storageBytes: null })).toMatchObject({
      storageBytes: null,
    });
  });

  it("does not carry the billing provider's price reference into the page", () => {
    expect(toPlanCatalogEntry(record)).not.toHaveProperty("providerPriceId");
  });
});
