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
import { PROCESSABLE_VEHICLE_STATUSES } from "../../vehicles/vehicle-status-groups.constants";

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

/**
 * The plan limits this reservation must respect. They are evaluated inside the
 * reservation transaction, because a check made before it could be overtaken by
 * a concurrent batch.
 */
export interface ProcessingAllowance {
  imageCapacity: number;
  maxImagesPerBatch: number;
  /** Null counts every charged image ever; a key scopes to that period. */
  allowanceBillingPeriodKey: string | null;
}

export interface ReserveProcessingBatchCommand {
  allowance: ProcessingAllowance;
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
        | "VEHICLE_UNAVAILABLE"
        | "VEHICLE_NOT_FOUND";
    }
  | { kind: "BATCH_LIMIT_EXCEEDED"; maxImagesPerBatch: number }
  | { kind: "ALLOWANCE_EXHAUSTED"; imageCapacity: number; imagesRemaining: number };

type TransactionResult =
  | { kind: "CREATED"; jobs: ProcessingJobRecord[] }
  | { kind: "ASSETS_NOT_READY" }
  | { kind: "VEHICLE_UNAVAILABLE" }
  | { kind: "VEHICLE_NOT_FOUND" }
  | { kind: "BATCH_LIMIT_EXCEEDED"; maxImagesPerBatch: number }
  | { kind: "ALLOWANCE_EXHAUSTED"; imageCapacity: number; imagesRemaining: number }
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
        result.kind !== "VEHICLE_UNAVAILABLE"
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
      : { kind: "VEHICLE_UNAVAILABLE" };
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
    if (!PROCESSABLE_VEHICLE_STATUSES.includes(vehicle.status)) {
      return { kind: "VEHICLE_UNAVAILABLE" };
    }

    const uniqueAssetIds = new Set(command.jobs.map((job) => job.assetId));
    if (command.jobs.length === 0) return { kind: "ASSETS_NOT_READY" };
    if (command.jobs.length > command.allowance.maxImagesPerBatch) {
      return {
        kind: "BATCH_LIMIT_EXCEEDED",
        maxImagesPerBatch: command.allowance.maxImagesPerBatch,
      };
    }

    /**
     * Images are charged on successful completion, so committed usage alone
     * would let a tenant reserve without limit while work is still in flight.
     * The allowance therefore counts charged images plus everything already
     * reserved and not yet terminal.
     */
    const allowanceUsed = await this.countAllowanceUsed(transaction, command);
    const imagesRemaining = Math.max(
      0,
      command.allowance.imageCapacity - allowanceUsed,
    );
    if (command.jobs.length > imagesRemaining) {
      return {
        kind: "ALLOWANCE_EXHAUSTED",
        imageCapacity: command.allowance.imageCapacity,
        imagesRemaining,
      };
    }
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

    /**
     * A new batch never touches an earlier one: it creates its own jobs, so a
     * completed studio version and a failed batch's history both survive. The
     * conditional claim also makes a second, differently keyed submission for
     * the same vehicle lose the race instead of queuing duplicate work.
     */
    const claimedVehicle = await transaction.vehicle.updateMany({
      where: {
        id: command.vehicleId,
        userId: command.userId,
        status: { in: PROCESSABLE_VEHICLE_STATUSES },
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

  /**
   * Charged images plus reserved-but-unfinished ones. Cancelled and failed jobs
   * are excluded because they are never charged, so a failure must not consume
   * a tenant's allowance.
   */
  private async countAllowanceUsed(
    transaction: Prisma.TransactionClient,
    command: ReserveProcessingBatchCommand,
  ): Promise<number> {
    const period =
      command.allowance.allowanceBillingPeriodKey === null
        ? {}
        : { billingPeriodKey: command.allowance.allowanceBillingPeriodKey };

    const [charged, inFlight] = await Promise.all([
      transaction.usageEvent.aggregate({
        where: {
          ...period,
          type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED,
          userId: command.userId,
        },
        _sum: { quantity: true },
      }),
      transaction.processingJob.count({
        where: {
          userId: command.userId,
          status: {
            in: [
              ProcessingJobStatus.CREATED,
              ProcessingJobStatus.QUEUED,
              ProcessingJobStatus.PROCESSING,
              ProcessingJobStatus.RETRYING,
            ],
          },
        },
      }),
    ]);

    return (charged._sum.quantity ?? 0) + inFlight;
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
