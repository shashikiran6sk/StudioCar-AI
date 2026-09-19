import { describe, expect, it, vi } from "vitest";

import { ProcessingJobService } from "../../../../apps/web/src/server/jobs/processing-job-service";
import type {
  ProcessingDispatchPort,
  ProcessingJobRepositoryPort,
} from "../../../../apps/web/src/server/jobs/processing-job.types";
import { ProcessingProvider } from "../../../../packages/database/generated/prisma/client";

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";
const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const NOW = new Date("2026-09-19T12:00:00.000Z");
const OPTIONS = {
  background: "PREMIUM_WHITE",
  crop: "MAINTAIN_COMPOSITION",
  enhancement: true,
  outputFormat: "JPEG",
  paddingPercent: 8,
  platePrivacy: true,
  quality: 90,
  shadow: "NATURAL",
} satisfies Parameters<ProcessingJobService["createBatch"]>[2]["options"];

describe("ProcessingJobService", () => {
  it("reserves deterministic jobs and asks the outbox to publish them", async () => {
    const repository: ProcessingJobRepositoryPort = {
      reserveBatchOwned: vi.fn().mockResolvedValue({
        kind: "CREATED",
        jobs: [
          {
            id: JOB_ID,
            userId: "user-1",
            vehicleId: VEHICLE_ID,
            imageAssetId: ASSET_ID,
            status: "CREATED",
            provider: "REMOVEBG",
            options: {},
            idempotencyKey: "job-key",
            batchIdempotencyKey: "processing-request-0001",
            batchRequestHash: "a".repeat(64),
            displayOrder: 0,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
      }),
    };
    const dispatcher: ProcessingDispatchPort = {
      dispatch: vi.fn().mockResolvedValue({
        claimed: 1,
        failed: 0,
        published: 1,
      }),
    };
    const service = new ProcessingJobService(
      repository,
      dispatcher,
      ProcessingProvider.REMOVEBG,
    );

    await expect(
      service.createBatch("user-1", "processing-request-0001", {
        vehicleId: VEHICLE_ID,
        assetIds: [ASSET_ID],
        options: OPTIONS,
      }),
    ).resolves.toEqual({
      ok: true,
      response: {
        jobs: [{ jobId: JOB_ID, assetId: ASSET_ID, state: "CREATED" }],
        replayed: false,
      },
    });
    expect(dispatcher.dispatch).toHaveBeenCalledWith({ jobIds: [JOB_ID] });
  });

  it("does not dispatch an invalid owned reservation", async () => {
    const repository: ProcessingJobRepositoryPort = {
      reserveBatchOwned: vi
        .fn()
        .mockResolvedValue({ kind: "ASSETS_NOT_READY" }),
    };
    const dispatcher: ProcessingDispatchPort = { dispatch: vi.fn() };
    const service = new ProcessingJobService(
      repository,
      dispatcher,
      ProcessingProvider.REMOVEBG,
    );

    await expect(
      service.createBatch("user-1", "processing-request-0001", {
        vehicleId: VEHICLE_ID,
        assetIds: [ASSET_ID],
        options: OPTIONS,
      }),
    ).resolves.toEqual({ ok: false, reason: "ASSETS_NOT_READY" });
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });
});
