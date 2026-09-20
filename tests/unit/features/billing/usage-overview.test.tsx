import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageOverview } from "../../../../apps/web/src/features/billing/usage-overview";

describe("UsageOverview", () => {
  it("shows session and storage quotas beside the current plan", () => {
    render(<UsageOverview summary={{ currentPlan: { description: "Small batches.", imageCapacity: 9, key: "FREE", name: "Free", storageCapacityBytes: 3_221_225_472, uploadSessionCapacity: 3 }, imagesRemaining: 7, imagesUsed: 2, storageUsedBytes: 1_288_490_189, uploadSessionsRemaining: 1, uploadSessionsUsed: 2 }} />);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText("1.2 GB")).toBeInTheDocument();
  });
});
