import { afterEach, describe, expect, it, vi } from "vitest";

const getUsageBillingSummary = vi.fn();

vi.mock(
  "../../../../apps/web/src/server/billing/get-usage-billing-summary",
  () => ({ getUsageBillingSummary }),
);

const { resolveProcessingAllowance } = await import(
  "../../../../apps/web/src/server/jobs/resolve-processing-allowance"
);

const now = new Date("2026-09-22T10:00:00.000Z");

function summary(
  allowanceScope: "LIFETIME" | "BILLING_PERIOD",
  imageCapacity: number,
  maxImagesPerBatch: number,
) {
  return {
    currentPlan: { allowanceScope, imageCapacity, maxImagesPerBatch },
  };
}

afterEach(() => {
  getUsageBillingSummary.mockReset();
});

describe("resolveProcessingAllowance", () => {
  it("reads the limits from the tenant's resolved plan", async () => {
    getUsageBillingSummary.mockResolvedValue(summary("LIFETIME", 15, 5));

    await expect(resolveProcessingAllowance("user-1", now)).resolves.toEqual({
      imageCapacity: 15,
      maxImagesPerBatch: 5,
      allowanceBillingPeriodKey: null,
    });
  });

  it("scopes a lifetime allowance to no billing period, so it runs out", async () => {
    getUsageBillingSummary.mockResolvedValue(summary("LIFETIME", 15, 5));

    await expect(
      resolveProcessingAllowance("user-1", now),
    ).resolves.toMatchObject({ allowanceBillingPeriodKey: null });
  });

  it("scopes a billing-period allowance to the current month, so it refills", async () => {
    getUsageBillingSummary.mockResolvedValue(
      summary("BILLING_PERIOD", 500, 20),
    );

    await expect(
      resolveProcessingAllowance("user-1", now),
    ).resolves.toMatchObject({
      allowanceBillingPeriodKey: "2026-09",
      imageCapacity: 500,
      maxImagesPerBatch: 20,
    });
  });

  it("resolves the allowance for the signed-in tenant only", async () => {
    getUsageBillingSummary.mockResolvedValue(summary("LIFETIME", 15, 5));

    await resolveProcessingAllowance("user-9", now);

    expect(getUsageBillingSummary).toHaveBeenCalledWith("user-9");
  });
});
