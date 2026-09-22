import type { PrismaClient } from "@studiocar/database-runtime";
import {
  type Prisma,
  ProcessingJobStatus,
} from "@studiocar/database-runtime";

const processingOutboxSelect = {
  id: true,
  jobId: true,
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

const MINIMUM_CLAIM_LIMIT = 1;
const MAXIMUM_CLAIM_LIMIT = 100;

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

  public async claimPendingOutbox(
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

    const candidates = await this.database.processingOutboxMessage.findMany({
      where: {
        publishedAt: null,
        nextAttemptAt: { lte: command.now },
        job: {
          status: {
            in: [
              ProcessingJobStatus.CREATED,
              ProcessingJobStatus.RETRYING,
            ],
          },
        },
        ...(command.jobIds ? { jobId: { in: command.jobIds } } : {}),
        OR: [
          { claimExpiresAt: null },
          { claimExpiresAt: { lte: command.now } },
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: command.limit,
      select: { id: true },
    });
    const claimed: ProcessingOutboxRecord[] = [];

    for (const candidate of candidates) {
      const result = await this.database.processingOutboxMessage.updateMany({
        where: {
          id: candidate.id,
          publishedAt: null,
          nextAttemptAt: { lte: command.now },
          OR: [
            { claimExpiresAt: null },
            { claimExpiresAt: { lte: command.now } },
          ],
        },
        data: {
          attemptCount: { increment: 1 },
          claimedAt: command.now,
          claimExpiresAt: command.claimExpiresAt,
          claimToken: command.claimToken,
        },
      });
      if (result.count !== 1) continue;

      const message = await this.database.processingOutboxMessage.findUnique({
        where: { id: candidate.id },
        select: processingOutboxSelect,
      });
      if (message) claimed.push(message);
    }
    return claimed;
  }

  public async markOutboxPublished(
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
              in: [
                ProcessingJobStatus.CREATED,
                ProcessingJobStatus.RETRYING,
              ],
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
