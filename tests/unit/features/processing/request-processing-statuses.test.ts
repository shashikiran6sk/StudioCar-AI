import { describe, expect, it, vi } from "vitest";

import { requestProcessingStatuses } from "../../../../apps/web/src/features/processing/request-processing-statuses";

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";

describe("requestProcessingStatuses", () => {
  it("requests one no-store batched endpoint and validates the response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        jobs: [
          {
            jobId: JOB_ID,
            assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
            vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
            vehicleName: "2024 Audi Q5",
            updatedAt: "2026-09-19T10:00:00.000Z",
            state: "QUEUED",
            stage: "QUEUED",
          },
        ],
      }),
    );

    await expect(requestProcessingStatuses([JOB_ID], undefined, fetcher)).resolves.toMatchObject({
      jobs: [{ jobId: JOB_ID }],
    });
    expect(fetcher).toHaveBeenCalledWith(`/api/jobs?ids=${JOB_ID}`, {
      cache: "no-store",
    });
  });
});
