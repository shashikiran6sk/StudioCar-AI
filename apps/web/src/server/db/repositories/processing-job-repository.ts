import type { ProcessingOptions } from "@studiocar/contracts";

import type { PrismaClient } from "@studiocar/database-runtime";
import {
  ImageAssetStatus,
  Prisma,
  ProcessingJobStatus,
  type ProcessingProvider,
  UsageEventType,
  VehicleStatus,
} from "@studiocar/database-runtime";
import { toProcessingOptionsJson } from "./to-processing-options-json";

const MISSING_USAGE_JOB_ERROR =
  "A processing batch must contain a usage-accounting job.";

const processingJobSelect = {
  id: true,
  userId: true,
  vehicleId: true,
  imageAssetId: true,
  status: true,
  provider: true,
  options: true,
  idempotencyKey: true,
  batchIdempotencyKey: true,
  batchRequestHash: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProcessingJobSelect;

export type ProcessingJobRecord = Prisma.ProcessingJobGetPayload<{
  select: typeof processingJobSelect;
}>;

export interface ProcessingJobReservationInput {
  assetId: string;
  displayOrder: number;
  idempotencyKey: string;
}

export interface ReserveProcessingBatchCommand {
  batchIdempotencyKey: string;
  batchRequestHash: string;
  jobs: ProcessingJobReservationInput[];
  options: ProcessingOptions;
  provider: ProcessingProvider;
  usageBillingPeriodKey: string;
  usageIdempotencyKey: string;
  userId: string;
  vehicleId: string;
}

export type ReserveProcessingBatchResult =
  | { kind: "CREATED"; jobs: ProcessingJobRecord[] }
  | { kind: "EXISTING"; jobs: ProcessingJobRecord[] }
  | {
      kind:
        | "ASSETS_NOT_READY"
        | "IDEMPOTENCY_CONFLICT"
        | "VEHICLE_NOT_DRAFT"
        | "VEHICLE_NOT_FOUND";
    };

type TransactionResult =
  | { kind: "CREATED"; jobs: ProcessingJobRecord[] }
  | { kind: "ASSETS_NOT_READY" }
  | { kind: "VEHICLE_NOT_DRAFT" }
  | { kind: "VEHICLE_NOT_FOUND" }
  | { kind: "WRITE_RACE" };

export class PrismaProcessingJobRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async reserveBatchOwned(
    command: ReserveProcessingBatchCommand,
  ): Promise<ReserveProcessingBatchResult> {
    const existing = await this.findBatch(
      command.userId,
      command.batchIdempotencyKey,
    );
    if (existing.length > 0) return this.resolveReplay(existing, command);

    try {
      const result = await this.database.$transaction((transaction) =>
        this.reserveInTransaction(transaction, command),
      );

      if (
        result.kind !== "WRITE_RACE" &&
        result.kind !== "VEHICLE_NOT_DRAFT"
      ) {
        return result;
      }
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
      ) {
        throw error;
      }
    }

    const raced = await this.findBatch(
      command.userId,
      command.batchIdempotencyKey,
    );
    return raced.length > 0
      ? this.resolveReplay(raced, command)
      : { kind: "VEHICLE_NOT_DRAFT" };
  }

  private async reserveInTransaction(
    transaction: Prisma.TransactionClient,
    command: ReserveProcessingBatchCommand,
  ): Promise<TransactionResult> {
    const vehicle = await transaction.vehicle.findFirst({
      where: { id: command.vehicleId, userId: command.userId },
      select: { status: true },
    });
    if (!vehicle) return { kind: "VEHICLE_NOT_FOUND" };
    if (vehicle.status !== VehicleStatus.DRAFT) {
      return { kind: "VEHICLE_NOT_DRAFT" };
    }

    const uniqueAssetIds = new Set(command.jobs.map((job) => job.assetId));
    if (command.jobs.length === 0) return { kind: "ASSETS_NOT_READY" };
    if (uniqueAssetIds.size !== command.jobs.length) {
      return { kind: "ASSETS_NOT_READY" };
    }
    const assets = await transaction.imageAsset.findMany({
      where: {
        id: { in: [...uniqueAssetIds] },
        userId: command.userId,
        vehicleId: command.vehicleId,
        status: ImageAssetStatus.UPLOADED,
      },
      select: { id: true },
    });
    if (assets.length !== command.jobs.length) {
      return { kind: "ASSETS_NOT_READY" };
    }

    const claimedVehicle = await transaction.vehicle.updateMany({
      where: {
        id: command.vehicleId,
        userId: command.userId,
        status: VehicleStatus.DRAFT,
      },
      data: { status: VehicleStatus.PROCESSING },
    });
    if (claimedVehicle.count !== 1) return { kind: "WRITE_RACE" };

    const jobs: ProcessingJobRecord[] = [];
    for (const job of command.jobs) {
      const processingJob = await transaction.processingJob.create({
        data: {
          userId: command.userId,
          vehicleId: command.vehicleId,
          imageAssetId: job.assetId,
          status: ProcessingJobStatus.CREATED,
          provider: command.provider,
          options: toProcessingOptionsJson(command.options),
          idempotencyKey: job.idempotencyKey,
          batchIdempotencyKey: command.batchIdempotencyKey,
          batchRequestHash: command.batchRequestHash,
          displayOrder: job.displayOrder,
        },
        select: processingJobSelect,
      });
      await transaction.processingOutboxMessage.create({
        data: { jobId: processingJob.id },
      });
      jobs.push(processingJob);
    }
    const usageJob = jobs[0];
    if (!usageJob) throw new Error(MISSING_USAGE_JOB_ERROR);
    await transaction.usageEvent.create({
      data: {
        billingPeriodKey: command.usageBillingPeriodKey,
        idempotencyKey: command.usageIdempotencyKey,
        jobId: usageJob.id,
        quantity: 1,
        type: UsageEventType.VEHICLE_PROCESSING_BATCH_CREATED,
        userId: command.userId,
      },
    });
    return { kind: "CREATED", jobs };
  }

  private resolveReplay(
    jobs: ProcessingJobRecord[],
    command: ReserveProcessingBatchCommand,
  ): ReserveProcessingBatchResult {
    const matches =
      jobs.length === command.jobs.length &&
      jobs.every((job, index) => {
        const requested = command.jobs[index];
        return (
          requested !== undefined &&
          job.vehicleId === command.vehicleId &&
          job.imageAssetId === requested.assetId &&
          job.idempotencyKey === requested.idempotencyKey &&
          job.batchRequestHash === command.batchRequestHash &&
          job.provider === command.provider &&
          job.displayOrder === requested.displayOrder
        );
      });
    return matches
      ? { kind: "EXISTING", jobs }
      : { kind: "IDEMPOTENCY_CONFLICT" };
  }

  private findBatch(
    userId: string,
    batchIdempotencyKey: string,
  ): Promise<ProcessingJobRecord[]> {
    return this.database.processingJob.findMany({
      where: { userId, batchIdempotencyKey },
      orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
      select: processingJobSelect,
    });
  }
}
