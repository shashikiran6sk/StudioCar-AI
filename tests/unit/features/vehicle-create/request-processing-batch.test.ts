import { describe, expect, it, vi } from "vitest";

import { ProcessingBatchRequestError } from "../../../../apps/web/src/features/vehicle-create/processing-batch-request-error";
import { requestProcessingBatch } from "../../../../apps/web/src/features/vehicle-create/request-processing-batch";

const command = {
  vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
  assetIds: ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
  options: {
    background: "PREMIUM_WHITE",
    floor: "HORIZON",
    crop: "MAINTAIN_COMPOSITION",
    enhancement: true,
    outputFormat: "JPEG",
    paddingPercent: 8,
    platePrivacy: true,
    quality: 90,
    shadow: "NATURAL",
  },
} satisfies Parameters<typeof requestProcessingBatch>[0];

describe("requestProcessingBatch", () => {
  it("posts the canonical command with a stable idempotency key", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          jobs: [
            {
              jobId: "8c879f46-1193-4d77-b785-057fe026d111",
              assetId: command.assetIds[0],
              state: "QUEUED",
            },
          ],
          replayed: false,
        },
        { status: 202 },
      ),
    );

    await expect(
      requestProcessingBatch(command, "processing-request-0001", fetcher),
    ).resolves.toMatchObject({ replayed: false });
    expect(fetcher).toHaveBeenCalledWith("/api/jobs", {
      body: JSON.stringify(command),
      headers: {
        "content-type": "application/json",
        "idempotency-key": "processing-request-0001",
      },
      method: "POST",
    });
  });

  it("surfaces a validated API error", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: {
            code: "CONFLICT",
            message: "Every photo must finish uploading.",
            requestId: "request-0001",
          },
        },
        { status: 409 },
      ),
    );

    await expect(
      requestProcessingBatch(command, "processing-request-0001", fetcher),
    ).rejects.toThrow("Every photo must finish uploading.");
    await expect(
      requestProcessingBatch(command, "processing-request-0001", fetcher),
    ).rejects.toBeInstanceOf(ProcessingBatchRequestError);
  });
});
