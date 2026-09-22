import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageOverview } from "../../../../apps/web/src/features/billing/usage-overview";

describe("UsageOverview", () => {
  it("shows session and storage quotas beside the current plan", () => {
    render(<UsageOverview summary={{ currentPlan: { allowanceScope: "LIFETIME" as const, description: "Small batches.", imageCapacity: 15, key: "FREE" as const, maxImagesPerBatch: 5, name: "Free", storageCapacityBytes: 3_221_225_472, uploadSessionCapacity: null }, imagesRemaining: 13, imagesUsed: 2, storageUsedBytes: 1_288_490_189, uploadSessionsRemaining: null, uploadSessionsUsed: 2 }} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1.2 GB")).toBeInTheDocument();
  });
});
