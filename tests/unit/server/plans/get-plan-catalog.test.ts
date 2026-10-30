import { describe, expect, it, vi } from "vitest";

const findActive = vi.fn();
const findAll = vi.fn();
const { cacheOptions } = vi.hoisted(() => {
  const recorded: unknown[] = [];
  return { cacheOptions: recorded };
});

vi.mock("next/cache", () => ({
  // Runs the wrapped read directly, so each test sees the repository it set,
  // and records how it was cached: the call happens once, at import.
  unstable_cache: <T,>(read: T, ...options: unknown[]): T => {
    cacheOptions.push(options);
    return read;
  },
}));

vi.mock("../../../../apps/web/src/server/plans/plan-config-runtime", () => ({
  getPlanConfigRepository: () => ({ findActive, findAll }),
}));

const { getFullPlanCatalog, getPlanCatalog, getPublicPlanCatalog } = await import(
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

describe("getPublicPlanCatalog", () => {
  it("caches the public catalog for at most five minutes under the current key", async () => {
    findActive.mockResolvedValue([row]);

    await expect(getPublicPlanCatalog()).resolves.toMatchObject([
      { planKey: "FREE" },
    ]);
    // A migration rewrites plans without an administrator's save, so the
    // cached copy must expire on its own rather than wait for one.
    expect(cacheOptions).toEqual([
      [["public-plan-catalog-2026-10-30"], { revalidate: 300, tags: ["public-plan-catalog"] }],
    ]);
  });
});
