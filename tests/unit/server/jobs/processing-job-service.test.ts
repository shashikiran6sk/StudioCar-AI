import { describe, expect, it, vi } from "vitest";

import { ProcessingJobService } from "../../../../apps/web/src/server/jobs/processing-job-service";
import type {
  ProcessingDispatchPort,
  ProcessingJobRepositoryPort,
} from "../../../../apps/web/src/server/jobs/processing-job.types";
import { ProcessingProvider } from "../../../../packages/database-runtime/generated/prisma/client";

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

/**
 * A generous allowance by default, so tests that are not about plan limits are
 * not accidentally constrained by them.
 */
function allowanceResolver(
  overrides: Partial<{
    imageCapacity: number;
    maxImagesPerBatch: number;
    allowanceBillingPeriodKey: string | null;
  }> = {},
) {
  return {
    resolve: vi.fn().mockResolvedValue({
      imageCapacity: 100,
      maxImagesPerBatch: 20,
      allowanceBillingPeriodKey: null,
      ...overrides,
    }),
  };
}

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
      allowanceResolver(),
      () => NOW,
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
    expect(repository.reserveBatchOwned).toHaveBeenCalledWith(
      expect.objectContaining({
        usageBillingPeriodKey: "2026-09",
        usageIdempotencyKey: "usage:upload-session:processing-request-0001",
      }),
    );
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
      allowanceResolver(),
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

describe("ProcessingJobService plan limits", () => {
  it("refuses a batch larger than the plan allows, naming the limit", async () => {
    const repository = {
      reserveBatchOwned: vi.fn().mockResolvedValue({
        kind: "BATCH_LIMIT_EXCEEDED",
        maxImagesPerBatch: 5,
      }),
    };
    const dispatcher = { dispatch: vi.fn() };
    const service = new ProcessingJobService(
      repository,
      dispatcher,
      ProcessingProvider.REMOVEBG,
      allowanceResolver({ maxImagesPerBatch: 5 }),
      () => NOW,
    );

    await expect(
      service.createBatch("user-1", "processing-request-0002", {
        vehicleId: VEHICLE_ID,
        assetIds: [ASSET_ID],
        options: OPTIONS,
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "BATCH_LIMIT_EXCEEDED",
      maxImagesPerBatch: 5,
    });
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("refuses a batch beyond the remaining allowance without queueing work", async () => {
    const repository = {
      reserveBatchOwned: vi.fn().mockResolvedValue({
        kind: "ALLOWANCE_EXHAUSTED",
        imageCapacity: 15,
        imagesRemaining: 0,
      }),
    };
    const dispatcher = { dispatch: vi.fn() };
    const service = new ProcessingJobService(
      repository,
      dispatcher,
      ProcessingProvider.REMOVEBG,
      allowanceResolver({ imageCapacity: 15 }),
      () => NOW,
    );

    await expect(
      service.createBatch("user-1", "processing-request-0003", {
        vehicleId: VEHICLE_ID,
        assetIds: [ASSET_ID],
        options: OPTIONS,
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "ALLOWANCE_EXHAUSTED",
      imageCapacity: 15,
      imagesRemaining: 0,
    });
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("passes the resolved plan limits into the reservation", async () => {
    const repository = {
      reserveBatchOwned: vi.fn().mockResolvedValue({
        kind: "CREATED",
        jobs: [],
      }),
    };
    const allowances = allowanceResolver({
      imageCapacity: 15,
      maxImagesPerBatch: 5,
    });
    const service = new ProcessingJobService(
      repository,
      { dispatch: vi.fn() },
      ProcessingProvider.REMOVEBG,
      allowances,
      () => NOW,
    );

    await service.createBatch("user-1", "processing-request-0004", {
      vehicleId: VEHICLE_ID,
      assetIds: [ASSET_ID],
      options: OPTIONS,
    });

    expect(allowances.resolve).toHaveBeenCalledWith("user-1", NOW);
    expect(repository.reserveBatchOwned).toHaveBeenCalledWith(
      expect.objectContaining({
        allowance: expect.objectContaining({
          imageCapacity: 15,
          maxImagesPerBatch: 5,
        }),
      }),
    );
  });
});
