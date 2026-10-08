import { z } from "zod";
import { measureStage, PerformanceStage } from "@studiocar/observability";
import type { ProcessingOptions } from "@studiocar/contracts";

import type { PrismaClient } from "@studiocar/database-runtime";
import {
  CreditLedgerType,
  ImageAssetStatus,
  Prisma,
  ProcessingJobStatus,
  type ProcessingProvider,
  UsageEventType,
  VehicleStatus,
} from "@studiocar/database-runtime";
import { toProcessingOptionsJson } from "./to-processing-options-json";
import { PROCESSABLE_VEHICLE_STATUSES } from "../../vehicles/vehicle-status-groups.constants";
import { createImageAssetLockKey } from "./create-image-asset-lock-key";

const ALLOWANCE_LOCK_PREFIX = "billing-credit:";
const AllowanceUsageRowsSchema = z.array(z.object({ used: z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) })).length(1);

const MISSING_USAGE_JOB_ERROR =
  "A processing batch must contain a usage-accounting job.";

const processingJobSelect = {
  requestId: true,
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
}

export interface ReserveProcessingBatchCommand {
  requestId?: string;
  allowance: ProcessingAllowance;
  batchIdempotencyKey: string;
  /** The batch's own name; null when the person gave none. */
  batchLabel: string | null;
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
  | {
      kind: "ALLOWANCE_EXHAUSTED";
      imageCapacity: number;
      imagesRemaining: number;
    };

type TransactionResult =
  | { kind: "CREATED"; jobs: ProcessingJobRecord[] }
  | { kind: "ASSETS_NOT_READY" }
  | { kind: "VEHICLE_UNAVAILABLE" }
  | { kind: "VEHICLE_NOT_FOUND" }
  | { kind: "BATCH_LIMIT_EXCEEDED"; maxImagesPerBatch: number }
  | {
      kind: "ALLOWANCE_EXHAUSTED";
      imageCapacity: number;
      imagesRemaining: number;
    }
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
      const result = await measureStage(PerformanceStage.RESERVATION_TRANSACTION, () => this.database.$transaction((transaction) =>
        this.reserveInTransaction(transaction, command),
      ));

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
    // Serialize reservations for the tenant, including different vehicles.
    // Completion transfers in-flight usage to charged usage atomically; the
    // single-statement count below observes both from the same snapshot.
    const allowanceLockKey = `${ALLOWANCE_LOCK_PREFIX}${command.userId}`;
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${allowanceLockKey}, 0))`;
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
    const purchased = await transaction.creditLedger.aggregate({
      where: { userId: command.userId },
      _sum: { amount: true },
    });
    const purchasedBalance = purchased._sum.amount ?? 0;
    const purchaseHistory = await transaction.creditLedger.findFirst({
      where: { userId: command.userId, type: { in: [CreditLedgerType.PURCHASE_GRANT, CreditLedgerType.ADMIN_ADJUSTMENT] }, amount: { gt: 0 } },
      select: { id: true },
    });
    const hasPaidCredits = purchaseHistory !== null;
    const plusPlan = purchasedBalance > 0
      ? await transaction.planConfig.findUnique({ where: { planKey: "STUDIO_PLUS" }, select: { maxImagesPerBatch: true } })
      : null;
    const maxImagesPerBatch = hasPaidCredits
      ? Math.max(command.allowance.maxImagesPerBatch, plusPlan?.maxImagesPerBatch ?? 0)
      : command.allowance.maxImagesPerBatch;
    if (command.jobs.length > maxImagesPerBatch) {
      return {
        kind: "BATCH_LIMIT_EXCEEDED",
        maxImagesPerBatch,
      };
    }

    /**
     * Images are charged on successful completion, so committed usage alone
     * would let a tenant reserve without limit while work is still in flight.
     * The allowance therefore counts charged images plus everything already
     * reserved and not yet terminal.
     */
    const allowanceUsed = hasPaidCredits ? 0 : await this.countAllowanceUsed(transaction, command);
    const imagesRemaining = hasPaidCredits
      ? purchasedBalance
      : Math.max(0, command.allowance.imageCapacity - allowanceUsed);
    if (command.jobs.length > imagesRemaining) {
      return {
        kind: "ALLOWANCE_EXHAUSTED",
        imageCapacity: hasPaidCredits ? purchasedBalance : command.allowance.imageCapacity,
        imagesRemaining,
      };
    }
    if (uniqueAssetIds.size !== command.jobs.length) {
      return { kind: "ASSETS_NOT_READY" };
    }
    // Preserve the cleanup lock protocol and stable ordering in one round trip.
    const lockKeys = [...uniqueAssetIds].sort().map(createImageAssetLockKey);
    await transaction.$executeRaw(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtextextended(lock_key, 0))
      FROM (
        SELECT unnest(ARRAY[${Prisma.join(lockKeys)}]::text[]) AS lock_key
        ORDER BY lock_key
      ) AS ordered_locks
    `);
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

    const jobs = await transaction.processingJob.createManyAndReturn({
      data: command.jobs.map((job) => ({
        requestId: command.requestId ?? null,
        userId: command.userId,
        vehicleId: command.vehicleId,
        imageAssetId: job.assetId,
        status: ProcessingJobStatus.CREATED,
        provider: command.provider,
        options: toProcessingOptionsJson(command.options),
        idempotencyKey: job.idempotencyKey,
        batchIdempotencyKey: command.batchIdempotencyKey,
        batchLabel: command.batchLabel,
        batchRequestHash: command.batchRequestHash,
        displayOrder: job.displayOrder,
      })),
      select: processingJobSelect,
    });
    // RETURNING does not promise input order; the response and replay must agree.
    jobs.sort((left, right) => left.displayOrder - right.displayOrder);
    await measureStage(PerformanceStage.OUTBOX_CREATION, () => transaction.processingOutboxMessage.createMany({
      data: jobs.map((job) => ({ jobId: job.id })),
    }));
    if (hasPaidCredits) {
      await transaction.creditAllocation.createMany({
        data: jobs.map((job) => ({ userId: command.userId, jobId: job.id })),
      });
      await transaction.creditLedger.createMany({
        data: jobs.map((job) => ({
          userId: command.userId, amount: -1,
          type: CreditLedgerType.PROCESSING_DEBIT, referenceId: job.id,
        })),
      });
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
    const rows = AllowanceUsageRowsSchema.parse(await transaction.$queryRaw`
      SELECT (
        (SELECT COALESCE(SUM("quantity"), 0) FROM "UsageEvent"
          WHERE "userId" = ${command.userId}::uuid
            AND "type" = ${UsageEventType.BACKGROUND_REMOVAL_COMPLETED}::"UsageEventType"
)
        + (SELECT COUNT(*) FROM "ProcessingJob"
          WHERE "userId" = ${command.userId}::uuid
            AND "status" IN (
              ${ProcessingJobStatus.CREATED}::"ProcessingJobStatus",
              ${ProcessingJobStatus.QUEUED}::"ProcessingJobStatus",
              ${ProcessingJobStatus.PROCESSING}::"ProcessingJobStatus",
              ${ProcessingJobStatus.RETRYING}::"ProcessingJobStatus"
            ))
      ) AS used
    `);
    const row = rows[0];
    if (!row) throw new Error(MISSING_USAGE_JOB_ERROR);
    return row.used;
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
