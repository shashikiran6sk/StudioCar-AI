import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentPlan = vi.fn();

vi.mock(
  "../../../../apps/web/src/server/billing/usage-billing-runtime",
  () => ({ getUsageBillingService: () => ({ getCurrentPlan }) }),
);

const { resolveProcessingAllowance } = await import(
  "../../../../apps/web/src/server/jobs/resolve-processing-allowance"
);

const now = new Date("2026-09-22T10:00:00.000Z");

function summary(
  allowanceScope: "LIFETIME",
  imageCapacity: number,
  maxImagesPerBatch: number,
) {
  return {
    allowanceScope, imageCapacity, maxImagesPerBatch,
  };
}

afterEach(() => {
  getCurrentPlan.mockReset();
});

describe("resolveProcessingAllowance", () => {
  it("reads the limits from the tenant's resolved plan", async () => {
    getCurrentPlan.mockResolvedValue(summary("LIFETIME", 15, 5));

    await expect(resolveProcessingAllowance("user-1", now)).resolves.toEqual({
      imageCapacity: 15,
      maxImagesPerBatch: 5,
    });
  });

  it("scopes a lifetime allowance to no billing period, so it runs out", async () => {
    getCurrentPlan.mockResolvedValue(summary("LIFETIME", 15, 5));

    await expect(
      resolveProcessingAllowance("user-1", now),
    ).resolves.toMatchObject({ imageCapacity: 15, maxImagesPerBatch: 5 });
  });

  it("keeps paid credit packs independent of calendar months", async () => {
    getCurrentPlan.mockResolvedValue(
      summary("LIFETIME", 100, 20),
    );

    await expect(
      resolveProcessingAllowance("user-1", now),
    ).resolves.toMatchObject({
      imageCapacity: 100,
      maxImagesPerBatch: 20,
    });
  });

  it("resolves the allowance for the signed-in tenant only", async () => {
    getCurrentPlan.mockResolvedValue(summary("LIFETIME", 15, 5));

    await resolveProcessingAllowance("user-9", now);

    expect(getCurrentPlan).toHaveBeenCalledWith("user-9", now);
  });
});
