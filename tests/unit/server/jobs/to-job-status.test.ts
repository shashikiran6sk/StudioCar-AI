import { describe, expect, it } from "vitest";

import { toJobStatus } from "../../../../apps/web/src/server/jobs/to-job-status";
import { ProcessingJobStatus } from "../../../../packages/database-runtime/src";
import type { ProcessingJobStatusRecord } from "../../../../apps/web/src/server/db/repositories/processing-job-status-repository";

const baseRecord = {
  id: "8c879f46-1193-4d77-b785-057fe026d111",
  imageAssetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
  status: ProcessingJobStatus.PROCESSING,
  nextAttemptAt: null,
  errorCode: null,
  updatedAt: new Date("2026-09-19T10:00:00.000Z"),
  vehicle: {
    id: "0e879f46-1193-4d77-b785-057fe026d998",
    name: "2024 Audi Q5",
  },
  processedAsset: null,
  attempts: [],
} satisfies ProcessingJobStatusRecord;

describe("toJobStatus", () => {
  it("maps database states to truthful public stages without percentages", () => {
    expect(toJobStatus(baseRecord)).toEqual({
      assetId: baseRecord.imageAssetId,
      jobId: baseRecord.id,
      stage: "REMOVING_BACKGROUND",
      state: "PROCESSING",
      updatedAt: "2026-09-19T10:00:00.000Z",
      vehicleId: baseRecord.vehicle.id,
      vehicleName: baseRecord.vehicle.name,
    });
    expect(
      toJobStatus({
        ...baseRecord,
        status: ProcessingJobStatus.RETRYING,
        nextAttemptAt: new Date("2026-09-19T10:01:00.000Z"),
      }),
    ).toMatchObject({
      state: "RETRYING",
      stage: "QUEUED",
      nextAttemptAt: "2026-09-19T10:01:00.000Z",
    });
  });

  it("includes output identity on completion and retryability on failure", () => {
    expect(
      toJobStatus({
        ...baseRecord,
        status: ProcessingJobStatus.COMPLETED,
        processedAsset: { id: "f4c14c97-e2c8-4d99-8fe0-b32af81d8905" },
      }),
    ).toMatchObject({ state: "COMPLETED", stage: "COMPLETE" });
    expect(
      toJobStatus({
        ...baseRecord,
        status: ProcessingJobStatus.FAILED,
        errorCode: "PROVIDER_UNAVAILABLE",
        attempts: [{ retryable: true }],
      }),
    ).toMatchObject({
      state: "FAILED",
      errorCode: "PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  });
});
