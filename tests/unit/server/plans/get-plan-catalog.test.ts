import { describe, expect, it, vi } from "vitest";

const findActive = vi.fn();
const findAll = vi.fn();

vi.mock("../../../../apps/web/src/server/plans/plan-config-runtime", () => ({
  getPlanConfigRepository: () => ({ findActive, findAll }),
}));

const { getFullPlanCatalog, getPlanCatalog } = await import(
  "../../../../apps/web/src/server/plans/get-plan-catalog"
);
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../../apps/web/src/server/plans/default-plan-catalog"
);

const row = {
  active: true,
  allowanceScope: "LIFETIME",
  billingInterval: "NONE",
  currency: "INR",
  description: "Configured by an administrator.",
  displayName: "Free",
  displayOrder: 0,
  featured: false,
  features: ["25 images in total"],
  includedImages: 25,
  maxImagesPerBatch: 5,
  planKey: "FREE",
  priceMinorUnits: 0,
  providerPriceId: null,
  purchasable: false,
  segment: "Explore",
  storageBytes: 3_221_225_472n,
};

describe("getPlanCatalog", () => {
  it("reads what an administrator configured", async () => {
    findActive.mockResolvedValue([row]);

    await expect(getPlanCatalog()).resolves.toMatchObject([
      { planKey: "FREE", includedImages: 25, storageBytes: 3_221_225_472 },
    ]);
  });

  it("uses the shipped catalog on a database that has not been seeded", async () => {
    findActive.mockResolvedValue([]);

    // A blank pricing page would be worse than showing the shipped prices.
    await expect(getPlanCatalog()).resolves.toEqual(
      DEFAULT_PLAN_CATALOG,
    );
  });
});

describe("getFullPlanCatalog", () => {
  it("includes plans that are not currently offered", async () => {
    findAll.mockResolvedValue([{ ...row, active: false }]);

    await expect(getFullPlanCatalog()).resolves.toMatchObject([
      { planKey: "FREE", active: false },
    ]);
  });
});
