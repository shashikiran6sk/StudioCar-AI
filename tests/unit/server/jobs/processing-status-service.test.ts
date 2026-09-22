import { describe, expect, it, vi } from "vitest";

import { ProcessingStatusService } from "../../../../apps/web/src/server/jobs/processing-status-service";
import type { ProcessingJobStatusRepositoryPort } from "../../../../apps/web/src/server/jobs/processing-status.types";
import { ProcessingJobStatus } from "../../../../packages/database-runtime/src";

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";

describe("ProcessingStatusService", () => {
  it("maps owned records and preserves requested repository order", async () => {
    const jobs: ProcessingJobStatusRepositoryPort = {
      findOwned: vi.fn().mockResolvedValue({
        kind: "FOUND",
        jobs: [
          {
            id: JOB_ID,
            imageAssetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
            status: ProcessingJobStatus.QUEUED,
            nextAttemptAt: null,
            errorCode: null,
            updatedAt: new Date("2026-09-19T10:00:00.000Z"),
            vehicle: {
              id: "0e879f46-1193-4d77-b785-057fe026d998",
              name: "2024 Audi Q5",
            },
            processedAsset: null,
            attempts: [],
          },
        ],
      }),
    };
    const service = new ProcessingStatusService(jobs);

    await expect(
      service.getStatuses("owner-id", { ids: [JOB_ID] }),
    ).resolves.toMatchObject({
      ok: true,
      response: { jobs: [{ jobId: JOB_ID, state: "QUEUED" }] },
    });
    expect(jobs.findOwned).toHaveBeenCalledWith("owner-id", [JOB_ID]);
  });

  it("does not return a partial result when ownership validation fails", async () => {
    const jobs: ProcessingJobStatusRepositoryPort = {
      findOwned: vi.fn().mockResolvedValue({ kind: "NOT_FOUND" }),
    };

    await expect(
      new ProcessingStatusService(jobs).getStatuses("owner-id", {
        ids: [JOB_ID],
      }),
    ).resolves.toEqual({ ok: false, reason: "NOT_FOUND" });
  });
});
