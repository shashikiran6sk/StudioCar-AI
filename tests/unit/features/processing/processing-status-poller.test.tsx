import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessingStatusPoller } from "../../../../apps/web/src/features/processing/processing-status-poller";
import { useProcessingStatusStore } from "../../../../apps/web/src/features/processing/processing-status-store";

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";
const baseStatus = {
  jobId: JOB_ID,
  assetId: ASSET_ID,
  vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
  vehicleName: "2024 Audi Q5",
  updatedAt: "2026-09-19T10:00:00.000Z",
};

describe("ProcessingStatusPoller", () => {
  beforeEach(() => {
    useProcessingStatusStore.setState({ error: null, jobs: {} });
    vi.restoreAllMocks();
  });

  it("refreshes immediately and stops scheduling a terminal job", async () => {
    useProcessingStatusStore.getState().register([
      { jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" },
    ]);
    const requestStatuses = vi.fn().mockResolvedValue({
      jobs: [
        {
          ...baseStatus,
          state: "COMPLETED",
          stage: "COMPLETE",
          processedAssetId: "f4c14c97-e2c8-4d99-8fe0-b32af81d8905",
        },
      ],
    });
    render(<ProcessingStatusPoller requestStatuses={requestStatuses} />);

    await waitFor(() => expect(requestStatuses).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(useProcessingStatusStore.getState().jobs[JOB_ID]?.status?.state).toBe(
        "COMPLETED",
      ),
    );
    expect(requestStatuses).toHaveBeenCalledWith([JOB_ID], expect.any(AbortSignal));
  });

  it("pauses while hidden and refreshes immediately when visible", async () => {
    let visibilityState: DocumentVisibilityState = "hidden";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(
      () => visibilityState,
    );
    useProcessingStatusStore.getState().register([
      { jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" },
    ]);
    const requestStatuses = vi.fn().mockResolvedValue({
      jobs: [{ ...baseStatus, state: "QUEUED", stage: "QUEUED" }],
    });
    render(<ProcessingStatusPoller requestStatuses={requestStatuses} />);
    expect(requestStatuses).not.toHaveBeenCalled();

    visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(requestStatuses).toHaveBeenCalledTimes(1));
  });
});
