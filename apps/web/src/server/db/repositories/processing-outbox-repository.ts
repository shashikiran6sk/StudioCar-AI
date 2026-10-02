import { measureStage, PerformanceStage } from "@studiocar/observability";

import { z } from "zod";
import type { PrismaClient } from "@studiocar/database-runtime";
import { Prisma, ProcessingJobStatus } from "@studiocar/database-runtime";

const processingOutboxSelect = {
  id: true,
  jobId: true,
  job: { select: { requestId: true, batchIdempotencyKey: true } },
  attemptCount: true,
  nextAttemptAt: true,
  claimedAt: true,
  claimExpiresAt: true,
  claimToken: true,
  publishedAt: true,
  queueMessageId: true,
  lastErrorCode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProcessingOutboxMessageSelect;

const OutboxIdsSchema = z.array(z.object({ id: z.string().uuid() }));

const MINIMUM_CLAIM_LIMIT = 1;
const MAXIMUM_CLAIM_LIMIT = 100;
const INVALID_ACKNOWLEDGEMENTS_ERROR = "Publication acknowledgements must be bounded and unique.";

class ProcessingOutboxClaimLostError extends Error {}

export type ProcessingOutboxRecord =
  Prisma.ProcessingOutboxMessageGetPayload<{
    select: typeof processingOutboxSelect;
  }>;

export interface ClaimProcessingOutboxCommand {
  claimExpiresAt: Date;
  claimToken: string;
  jobIds?: string[];
  limit: number;
  now: Date;
}

export interface ReleaseProcessingOutboxCommand {
  claimToken: string;
  errorCode: string;
  messageId: string;
  nextAttemptAt: Date;
}

export interface PublishProcessingOutboxCommand {
  claimToken: string;
  messageId: string;
  publishedAt: Date;
  queueMessageId: string;
}

export class PrismaProcessingOutboxRepository {
  public constructor(private readonly database: PrismaClient) {}

  public claimPendingOutbox(command: ClaimProcessingOutboxCommand): Promise<ProcessingOutboxRecord[]> {
    return measureStage(PerformanceStage.OUTBOX_CLAIM, () => this.claimPending(command));
  }

  private async claimPending(
    command: ClaimProcessingOutboxCommand,
  ): Promise<ProcessingOutboxRecord[]> {
    if (
      !Number.isInteger(command.limit) ||
      command.limit < MINIMUM_CLAIM_LIMIT ||
      command.limit > MAXIMUM_CLAIM_LIMIT
    ) {
      throw new RangeError(
        `Outbox claim limit must be between ${String(MINIMUM_CLAIM_LIMIT)} and ${String(MAXIMUM_CLAIM_LIMIT)}.`,
      );
    }

    return this.database.$transaction(async (transaction) => {
      const jobFilter = command.jobIds
        ? command.jobIds.length > 0
          ? Prisma.sql`AND o."jobId" IN (${Prisma.join(command.jobIds.map((id) => Prisma.sql`${id}::uuid`))})`
          : Prisma.sql`AND FALSE`
        : Prisma.empty;
      const candidates = OutboxIdsSchema.parse(await transaction.$queryRaw(Prisma.sql`
        SELECT o.id FROM "ProcessingOutboxMessage" o
        JOIN "ProcessingJob" j ON j.id = o."jobId"
        WHERE o."publishedAt" IS NULL AND o."nextAttemptAt" <= ${command.now}
          AND (o."claimExpiresAt" IS NULL OR o."claimExpiresAt" <= ${command.now})
          AND j.status IN (${ProcessingJobStatus.CREATED}::"ProcessingJobStatus", ${ProcessingJobStatus.RETRYING}::"ProcessingJobStatus")
          ${jobFilter}
        ORDER BY o."createdAt", o.id
        LIMIT ${command.limit}
        FOR UPDATE OF o SKIP LOCKED
      `));
      if (candidates.length === 0) return [];
      const ids = candidates.map((candidate) => candidate.id);
      await transaction.processingOutboxMessage.updateMany({
        where: { id: { in: ids } },
        data: { attemptCount: { increment: 1 }, claimedAt: command.now,
          claimExpiresAt: command.claimExpiresAt, claimToken: command.claimToken },
      });
      return transaction.processingOutboxMessage.findMany({
        where: { id: { in: ids }, claimToken: command.claimToken },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: processingOutboxSelect,
      });
    });
  }

  /** Network publication has already completed; this transaction only acknowledges successes. */
  public markOutboxPublishedBatch(commands: PublishProcessingOutboxCommand[]): Promise<string[]> {
    return measureStage(PerformanceStage.PUBLICATION_BOOKKEEPING, () => this.markPublishedBatch(commands));
  }

  private async markPublishedBatch(commands: PublishProcessingOutboxCommand[]): Promise<string[]> {
    if (commands.length === 0) return [];
    if (commands.length > MAXIMUM_CLAIM_LIMIT || new Set(commands.map((command) => command.messageId)).size !== commands.length) {
      throw new RangeError(INVALID_ACKNOWLEDGEMENTS_ERROR);
    }
    const values = Prisma.join(commands.map((command) => Prisma.sql`(
      ${command.messageId}::uuid, ${command.claimToken}::text,
      ${command.publishedAt}::timestamptz, ${command.queueMessageId}::text
    )`));
    return this.database.$transaction(async (transaction) => {
      // Match the worker's job-before-outbox lock order. All dispatchers lock
      // jobs in the same order; no queue operation holds these locks.
      await transaction.$queryRaw(Prisma.sql`
        SELECT j.id FROM "ProcessingJob" j
        JOIN "ProcessingOutboxMessage" o ON o."jobId" = j.id
        JOIN (VALUES ${values}) AS ack(id, token, published, queue_id) ON ack.id = o.id
        WHERE o."claimToken" = ack.token AND o."publishedAt" IS NULL
          AND j.status IN (${ProcessingJobStatus.CREATED}::"ProcessingJobStatus", ${ProcessingJobStatus.RETRYING}::"ProcessingJobStatus")
        ORDER BY j.id FOR UPDATE OF j
      `);
      const acknowledged = z.array(z.object({ id: z.string().uuid(), jobId: z.string().uuid(), publishedAt: z.date() })).parse(
        await transaction.$queryRaw(Prisma.sql`
          UPDATE "ProcessingOutboxMessage" o SET
            "claimedAt" = NULL, "claimExpiresAt" = NULL, "claimToken" = NULL,
            "lastErrorCode" = NULL, "publishedAt" = ack.published,
            "queueMessageId" = ack.queue_id, "updatedAt" = CURRENT_TIMESTAMP
          FROM (VALUES ${values}) AS ack(id, token, published, queue_id), "ProcessingJob" j
          WHERE o.id = ack.id AND o."claimToken" = ack.token AND o."publishedAt" IS NULL
            AND j.id = o."jobId"
            AND j.status IN (${ProcessingJobStatus.CREATED}::"ProcessingJobStatus", ${ProcessingJobStatus.RETRYING}::"ProcessingJobStatus")
          RETURNING o.id, o."jobId", o."publishedAt"
        `));
      if (acknowledged.length === 0) return [];
      const queuedValues = Prisma.join(acknowledged.map((row) => Prisma.sql`(${row.jobId}::uuid, ${row.publishedAt}::timestamptz)`));
      await transaction.$executeRaw(Prisma.sql`
        UPDATE "ProcessingJob" j SET "nextAttemptAt" = NULL, "queuedAt" = ack.published,
          status = ${ProcessingJobStatus.QUEUED}::"ProcessingJobStatus", "updatedAt" = CURRENT_TIMESTAMP
        FROM (VALUES ${queuedValues}) AS ack(id, published) WHERE j.id = ack.id
      `);
      return acknowledged.map((row) => row.id);
    });
  }

  public markOutboxPublished(command: PublishProcessingOutboxCommand): Promise<boolean> {
    return measureStage(PerformanceStage.PUBLICATION_BOOKKEEPING, () => this.markPublished(command));
  }

  private async markPublished(
    command: PublishProcessingOutboxCommand,
  ): Promise<boolean> {
    try {
      await this.database.$transaction(async (transaction) => {
        const message = await transaction.processingOutboxMessage.findFirst({
          where: {
            id: command.messageId,
            claimToken: command.claimToken,
            publishedAt: null,
          },
          select: { jobId: true },
        });
        if (!message) throw new ProcessingOutboxClaimLostError();

        const queued = await transaction.processingJob.updateMany({
          where: {
            id: message.jobId,
            status: {
              in: [ProcessingJobStatus.CREATED, ProcessingJobStatus.RETRYING],
            },
          },
          data: {
            nextAttemptAt: null,
            queuedAt: command.publishedAt,
            status: ProcessingJobStatus.QUEUED,
          },
        });
        if (queued.count !== 1) throw new ProcessingOutboxClaimLostError();

        const published =
          await transaction.processingOutboxMessage.updateMany({
            where: {
              id: command.messageId,
              claimToken: command.claimToken,
              publishedAt: null,
            },
            data: {
              claimedAt: null,
              claimExpiresAt: null,
              claimToken: null,
              lastErrorCode: null,
              publishedAt: command.publishedAt,
              queueMessageId: command.queueMessageId,
            },
          });
        if (published.count !== 1) throw new ProcessingOutboxClaimLostError();
      });
      return true;
    } catch (error) {
      if (error instanceof ProcessingOutboxClaimLostError) return false;
      throw error;
    }
  }

  public async releaseOutboxClaim(
    command: ReleaseProcessingOutboxCommand,
  ): Promise<boolean> {
    const released = await this.database.processingOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        claimToken: command.claimToken,
        publishedAt: null,
      },
      data: {
        claimedAt: null,
        claimExpiresAt: null,
        claimToken: null,
        lastErrorCode: command.errorCode,
        nextAttemptAt: command.nextAttemptAt,
      },
    });
    return released.count === 1;
  }
}
