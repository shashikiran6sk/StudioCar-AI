import { beforeEach, describe, expect, it } from "vitest";

import { useProcessingStatusStore } from "../../../../apps/web/src/features/processing/processing-status-store";

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";

describe("processingStatusStore", () => {
  beforeEach(() => {
    useProcessingStatusStore.setState({ error: null, jobs: {} });
  });

  it("registers transient jobs, applies authoritative status, and dismisses them", () => {
    useProcessingStatusStore.getState().register(
      [{ jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" }],
      1_000,
    );
    expect(useProcessingStatusStore.getState().jobs[JOB_ID]).toMatchObject({
      startedAtMilliseconds: 1_000,
    });

    useProcessingStatusStore.getState().update([
      {
        jobId: JOB_ID,
        assetId: ASSET_ID,
        vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
        vehicleName: "2024 Audi Q5",
        updatedAt: "2026-09-19T10:00:00.000Z",
        state: "QUEUED",
        stage: "QUEUED",
      },
    ]);
    expect(useProcessingStatusStore.getState().jobs[JOB_ID]?.status).toMatchObject({
      vehicleName: "2024 Audi Q5",
      state: "QUEUED",
    });

    useProcessingStatusStore.getState().dismiss(JOB_ID);
    expect(useProcessingStatusStore.getState().jobs).toEqual({});
  });
});
