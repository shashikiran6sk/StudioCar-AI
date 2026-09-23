import type { CreateProcessingBatch } from "@studiocar/contracts";
import type { ProcessingProvider } from "@studiocar/database-runtime";
import {
  createProcessingBatchRequestHash,
  createProcessingJobIdempotencyKey,
  createUploadSessionUsageIdempotencyKey,
  createUsageBillingPeriodKey,
} from "@studiocar/processing";

import type {
  CreateProcessingJobsResult,
  ProcessingAllowanceResolverPort,
  ProcessingDispatchPort,
  ProcessingJobApplication,
  ProcessingJobRepositoryPort,
} from "./processing-job.types";

export class ProcessingJobService implements ProcessingJobApplication {
  public constructor(
    private readonly jobs: ProcessingJobRepositoryPort,
    private readonly dispatcher: ProcessingDispatchPort,
    private readonly provider: ProcessingProvider,
    private readonly allowances: ProcessingAllowanceResolverPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async createBatch(
    userId: string,
    idempotencyKey: string,
    command: CreateProcessingBatch,
  ): Promise<CreateProcessingJobsResult> {
    const now = this.now();
    const reservation = await this.jobs.reserveBatchOwned({
      allowance: await this.allowances.resolve(userId, now),
      userId,
      vehicleId: command.vehicleId,
      batchIdempotencyKey: idempotencyKey,
      batchLabel: command.label ?? null,
      batchRequestHash: createProcessingBatchRequestHash(command),
      provider: this.provider,
      usageBillingPeriodKey: createUsageBillingPeriodKey(now),
      usageIdempotencyKey:
        createUploadSessionUsageIdempotencyKey(idempotencyKey),
      options: command.options,
      jobs: command.assetIds.map((assetId, displayOrder) => ({
        assetId,
        displayOrder,
        idempotencyKey: createProcessingJobIdempotencyKey(
          idempotencyKey,
          assetId,
        ),
      })),
    });
    if (reservation.kind === "BATCH_LIMIT_EXCEEDED") {
      return {
        ok: false,
        reason: reservation.kind,
        maxImagesPerBatch: reservation.maxImagesPerBatch,
      };
    }
    if (reservation.kind === "ALLOWANCE_EXHAUSTED") {
      return {
        ok: false,
        reason: reservation.kind,
        imageCapacity: reservation.imageCapacity,
        imagesRemaining: reservation.imagesRemaining,
      };
    }
    if (reservation.kind !== "CREATED" && reservation.kind !== "EXISTING") {
      return { ok: false, reason: reservation.kind };
    }

    await this.dispatcher.dispatch({
      jobIds: reservation.jobs.map((job) => job.id),
    });

    return {
      ok: true,
      response: {
        jobs: reservation.jobs.map((job) => ({
          jobId: job.id,
          assetId: job.imageAssetId,
          state: job.status,
        })),
        replayed: reservation.kind === "EXISTING",
      },
    };
  }
}
