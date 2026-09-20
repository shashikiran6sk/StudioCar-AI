import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageCurrentPlanCard } from "../../../../apps/web/src/features/billing/usage-current-plan-card";

const SUMMARY = {
  currentPlan: { description: "Small batches.", imageCapacity: 9, key: "FREE", name: "Free", storageCapacityBytes: 3_221_225_472, uploadSessionCapacity: 3 },
  imagesRemaining: 7, imagesUsed: 2, storageUsedBytes: 1_024,
  uploadSessionsRemaining: 2, uploadSessionsUsed: 1,
} satisfies Parameters<typeof UsageCurrentPlanCard>[0]["summary"];

describe("UsageCurrentPlanCard", () => {
  it("shows image usage and remaining capacity", () => {
    render(<UsageCurrentPlanCard summary={SUMMARY} />);
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "2 of 9 images used" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("7 remaining")).toBeInTheDocument();
  });
});
