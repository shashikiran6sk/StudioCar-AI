import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { requestProcessingStatusBatches } from "../../../../apps/web/src/features/processing/request-processing-status-batches";
import type { JobStatusResponse } from "../../../../packages/contracts/src/jobs";

describe("requestProcessingStatusBatches", () => {
  it("polls large active sets sequentially within the canonical query bound", async () => {
    const jobIds = Array.from({ length: 205 }, () => randomUUID());
    const requestBatch = vi.fn(
      async (ids: string[]): Promise<JobStatusResponse> => ({
        jobs: ids.map((jobId) => ({
          assetId: randomUUID(),
          jobId,
          stage: "QUEUED",
          state: "QUEUED",
          updatedAt: "2026-09-20T12:00:00.000Z",
          vehicleId: randomUUID(),
          vehicleName: "Load test vehicle",
        })),
      }),
    );

    const response = await requestProcessingStatusBatches(
      jobIds,
      undefined,
      requestBatch,
    );

    expect(requestBatch).toHaveBeenCalledTimes(3);
    expect(requestBatch.mock.calls.map(([ids]) => ids.length)).toEqual([
      100, 100, 5,
    ]);
    expect(response.jobs.map((job) => job.jobId)).toEqual(jobIds);
  });
});
