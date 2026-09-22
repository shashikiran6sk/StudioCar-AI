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
  ProcessingDispatchPort,
  ProcessingJobApplication,
  ProcessingJobRepositoryPort,
} from "./processing-job.types";

export class ProcessingJobService implements ProcessingJobApplication {
  public constructor(
    private readonly jobs: ProcessingJobRepositoryPort,
    private readonly dispatcher: ProcessingDispatchPort,
    private readonly provider: ProcessingProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async createBatch(
    userId: string,
    idempotencyKey: string,
    command: CreateProcessingBatch,
  ): Promise<CreateProcessingJobsResult> {
    const reservation = await this.jobs.reserveBatchOwned({
      userId,
      vehicleId: command.vehicleId,
      batchIdempotencyKey: idempotencyKey,
      batchRequestHash: createProcessingBatchRequestHash(command),
      provider: this.provider,
      usageBillingPeriodKey: createUsageBillingPeriodKey(this.now()),
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
