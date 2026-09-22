import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageCurrentPlanCard } from "../../../../apps/web/src/features/billing/usage-current-plan-card";

const SUMMARY = {
  currentPlan: { allowanceScope: "LIFETIME", description: "Small batches.", imageCapacity: 15, key: "FREE", maxImagesPerBatch: 5, name: "Free", storageCapacityBytes: 3_221_225_472, uploadSessionCapacity: null },
  imagesRemaining: 13, imagesUsed: 2, storageUsedBytes: 1_024,
  uploadSessionsRemaining: null, uploadSessionsUsed: 1,
} satisfies Parameters<typeof UsageCurrentPlanCard>[0]["summary"];

describe("UsageCurrentPlanCard", () => {
  it("shows image usage and remaining capacity", () => {
    render(<UsageCurrentPlanCard summary={SUMMARY} />);
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "2 of 15 images used" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("13 remaining")).toBeInTheDocument();
  });
});
